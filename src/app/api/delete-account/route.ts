import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

interface DeletionRequestBody {
  email?: string
  userId?: string
  accountType?: 'all' | 'wallet' | 'business'
  reason?: string
  confirmed?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Require active authenticated user session to schedule account deletion
    const client = await createClient()
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to request account deletion.' },
        { status: 401 }
      )
    }

    const body: DeletionRequestBody = await request.json()
    const userId = user.id
    const email = user.email?.toLowerCase().trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required to process an account deletion request.' },
        { status: 400 }
      )
    }

    if (!body.confirmed) {
      return NextResponse.json(
        { error: 'You must confirm that you understand the data deletion consequences.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Check if there is already an active pending request for this authenticated user
    const { data: existingPending } = await admin
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      const scheduledDate = new Date(existingPending.scheduled_deletion_at)
      const daysRemaining = Math.max(
        0,
        Math.ceil((scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
      return NextResponse.json(
        {
          success: true,
          message: 'An account deletion request is already pending for this user.',
          request: {
            id: existingPending.id,
            ticketId: existingPending.id,
            status: existingPending.status,
            requestedAt: existingPending.requested_at,
            scheduledDeletionAt: existingPending.scheduled_deletion_at,
            daysRemaining,
          },
        },
        { status: 200 }
      )
    }

    // 30-day grace period buffer
    const requestedAt = new Date().toISOString()
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 30)
    const scheduledDeletionAt = scheduledDate.toISOString()

    const { data: inserted, error: insertError } = await admin
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        email,
        reason: body.reason || 'User requested account deletion via profile settings',
        status: 'pending',
        requested_at: requestedAt,
        scheduled_deletion_at: scheduledDeletionAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[DELETE_ACCOUNT_POST] Error creating deletion request:', insertError.message)
      return NextResponse.json(
        { error: 'Failed to record account deletion request. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        ticketId: inserted.id,
        status: 'pending',
        requestedAt,
        scheduledDeletionAt,
        daysRemaining: 30,
        message:
          'Your account deletion request has been scheduled with a 30-day grace period. You may cancel this request at any time before the scheduled date.',
        request: {
          id: inserted.id,
          ticketId: inserted.id,
          status: 'pending',
          requestedAt,
          scheduledDeletionAt,
          daysRemaining: 30,
        },
        policySummary: {
          walletMode:
            'All personal wallet sub-accounts, transactions, and categories (is_wallet = true) will be permanently and irreversibly purged.',
          businessOrganizations:
            'Your user profile will be deactivated from shared business workspaces. Legal financial audit trails for organization accounts will be preserved in anonymized form.',
        },
      },
      { status: 202 }
    )
  } catch (err) {
    console.error('[DELETE_ACCOUNT_POST] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to process account deletion request.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require active authenticated user session to check deletion status
    const client = await createClient()
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to view account deletion status.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ticket = searchParams.get('ticket')?.trim()
    const userId = user.id

    const admin = createAdminClient()
    let query = admin
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (ticket) {
      query = query.eq('id', ticket)
    }

    const { data: requests, error } = await query.limit(1)

    if (error) {
      console.error('[DELETE_ACCOUNT_GET] Database query error:', error.message)
      return NextResponse.json(
        { error: 'Failed to query deletion request status' },
        { status: 500 }
      )
    }

    const requestRecord = requests?.[0]
    if (!requestRecord) {
      return NextResponse.json(
        {
          found: false,
          message: 'No active account deletion request found.',
        },
        { status: 404 }
      )
    }

    const scheduledDate = new Date(requestRecord.scheduled_deletion_at)
    const now = new Date()
    const msRemaining = Math.max(scheduledDate.getTime() - now.getTime(), 0)
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      found: true,
      request: {
        id: requestRecord.id,
        ticketId: requestRecord.id,
        userId: requestRecord.user_id,
        email: requestRecord.email,
        reason: requestRecord.reason,
        status: requestRecord.status,
        requestedAt: requestRecord.requested_at,
        scheduledDeletionAt: requestRecord.scheduled_deletion_at,
        cancelledAt: requestRecord.cancelled_at,
        completedAt: requestRecord.completed_at,
        daysRemaining,
        isPending: requestRecord.status === 'pending',
      },
    })
  } catch (err) {
    console.error('[DELETE_ACCOUNT_GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleCancellation() {
  try {
    // Require active authenticated user session to cancel account deletion
    const client = await createClient()
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to cancel an account deletion request.' },
        { status: 401 }
      )
    }

    const userId = user.id
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()

    if (error) {
      console.error('[DELETE_ACCOUNT_CANCEL] Error cancelling request:', error.message)
      return NextResponse.json({ error: 'Failed to cancel deletion request.' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { found: false, message: 'No active pending deletion request found to cancel.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your account deletion request has been successfully cancelled.',
      cancelledCount: data.length,
    })
  } catch (err) {
    console.error('[DELETE_ACCOUNT_CANCEL] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to process request cancellation.' }, { status: 500 })
  }
}

export async function DELETE() {
  return handleCancellation()
}

export async function PATCH() {
  return handleCancellation()
}
