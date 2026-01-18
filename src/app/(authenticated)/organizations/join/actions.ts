"use server"

import { createClient } from "@/lib/supabase/server"
import type { JoinWithInviteInput, UseInviteResult } from "@/lib/types/invite"

/**
 * Join an organization using an invite code
 * Uses the database function use_invite_code which handles:
 * - Validating the code exists and is active
 * - Checking max uses
 * - Creating or reactivating membership
 * - Incrementing usage counter
 */
export async function joinWithInviteCode(input: JoinWithInviteInput): Promise<UseInviteResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        errorMessage: "You must be signed in to join an organization",
      }
    }

    const { code } = input

    console.log('[JOIN_WITH_INVITE] User', user.id, 'attempting to join with code:', code)

    // Call the database function to use the invite code
    // This function returns: organization_id, organization_name, success, error_message
    const { data, error } = await supabase.rpc('use_invite_code', {
      p_code: code,
      p_user_id: user.id,
    })

    if (error) {
      console.error('[JOIN_WITH_INVITE] Database error:', error)
      return {
        success: false,
        errorMessage: error.message || 'Failed to use invite code',
      }
    }

    // The RPC returns a single row with the result
    const result = Array.isArray(data) ? data[0] : data

    if (!result) {
      return {
        success: false,
        errorMessage: 'Invalid response from server',
      }
    }

    if (!result.success) {
      console.log('[JOIN_WITH_INVITE] Failed:', result.error_message)
      return {
        success: false,
        errorMessage: result.error_message || 'Failed to join organization',
      }
    }

    console.log('[JOIN_WITH_INVITE] Successfully joined organization:', result.organization_id)

    return {
      success: true,
      organizationId: result.organization_id,
      organizationName: result.organization_name,
    }
  } catch (error) {
    console.error('[JOIN_WITH_INVITE] Unexpected error:', error)
    return {
      success: false,
      errorMessage: 'An unexpected error occurred',
    }
  }
}

