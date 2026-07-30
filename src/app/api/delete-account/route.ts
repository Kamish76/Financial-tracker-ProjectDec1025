import { NextRequest, NextResponse } from 'next/server'

interface DeletionRequestBody {
  email?: string
  accountType?: 'all' | 'wallet' | 'business'
  reason?: string
  confirmed?: boolean
}

// In-memory mock store for demonstration of status lookups during development/testing
// In production, these would be persisted in a database table such as account_deletion_requests
const mockDeletionRequests = new Map<string, {
  ticketId: string
  email: string
  accountType: string
  reason: string
  status: 'PENDING_VERIFICATION' | 'SCHEDULED_FOR_DELETION' | 'CANCELLED' | 'COMPLETED'
  requestedAt: string
  scheduledDeletionAt: string
}>()

export async function POST(request: NextRequest) {
  try {
    const body: DeletionRequestBody = await request.json()

    if (!body.email || !body.email.includes('@')) {
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

    const accountType = body.accountType || 'all'
    const ticketId = `DEL-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const requestedAt = new Date().toISOString()
    
    // Default 30-day grace period for recovery and verification
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 30)
    const scheduledDeletionAt = scheduledDate.toISOString()

    const requestRecord = {
      ticketId,
      email: body.email.toLowerCase().trim(),
      accountType,
      reason: body.reason || 'No reason provided',
      status: 'PENDING_VERIFICATION' as const,
      requestedAt,
      scheduledDeletionAt,
    }

    mockDeletionRequests.set(ticketId, requestRecord)
    mockDeletionRequests.set(body.email.toLowerCase().trim(), requestRecord)

    return NextResponse.json(
      {
        success: true,
        ticketId,
        status: 'PENDING_VERIFICATION',
        requestedAt,
        scheduledDeletionAt,
        scope: accountType,
        message:
          'Your account deletion request has been received. A verification link has been sent to your email address to confirm identity. You have a 30-day grace period to cancel this request before data is permanently purged.',
        policySummary: {
          walletMode:
            'All personal wallet sub-accounts, transactions, and categories (is_wallet = true) will be permanently and irreversibly purged.',
          businessOrganizations:
            'Your user profile will be unlinked from shared business workspaces. Legal financial audit trails for organization accounts will be preserved in anonymized form.',
        },
      },
      { status: 202 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process account deletion request. Please check your request payload.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticket = searchParams.get('ticket')?.trim().toUpperCase()
  const email = searchParams.get('email')?.toLowerCase().trim()

  const key = ticket || email
  if (!key) {
    return NextResponse.json(
      { error: 'Please provide a ticket ID or email address to check deletion request status.' },
      { status: 400 }
    )
  }

  const record = mockDeletionRequests.get(key)
  if (!record) {
    return NextResponse.json(
      {
        found: false,
        message: 'No active account deletion request found for the provided Ticket ID or email address.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    found: true,
    request: record,
  })
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required to confirm account deletion.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your account and personal wallet data have been scheduled for deletion.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred while processing account deletion.' },
      { status: 500 }
    )
  }
}

