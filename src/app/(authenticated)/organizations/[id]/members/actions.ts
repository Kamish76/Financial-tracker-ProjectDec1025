'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  UpdateMemberRoleInput,
  DeactivateMemberInput,
  ReactivateMemberInput,
  MemberWithProfile,
  OrganizationRole,
} from '@/lib/types/member'
import type {
  CreateInviteInput,
  RevokeInviteInput,
  InviteCodeWithCreator,
} from '@/lib/types/invite'
import { generateInviteCode } from '@/lib/types/invite'

// ============================================================================
// MEMBER ROLE MANAGEMENT
// ============================================================================

/**
 * Update a member's role in an organization
 * - Must be admin or owner to change roles
 * - Cannot change to/from owner role (use transfer ownership instead)
 * - Cannot change own role
 */
export async function updateMemberRole(input: UpdateMemberRoleInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { organizationId, targetUserId, newRole } = input

    // Validate: cannot change to/from owner role
    if (newRole === 'owner') {
      return { error: 'Cannot change role to owner. Use transfer ownership instead.' }
    }

    // Validate: cannot change own role
    if (targetUserId === user.id) {
      return { error: 'You cannot change your own role.' }
    }

    const adminClient = createAdminClient()

    // Check current user's role (must be admin or owner)
    const { data: currentUserMembership, error: membershipError } =
      await adminClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

    if (membershipError || !currentUserMembership) {
      return { error: 'You are not a member of this organization' }
    }

    if (!['owner', 'admin'].includes(currentUserMembership.role)) {
      return { error: 'Insufficient permissions. Only admins and owners can change roles.' }
    }

    // Check target member's current role
    const { data: targetMembership, error: targetError } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .single()

    if (targetError || !targetMembership) {
      return { error: 'Target user is not an active member of this organization' }
    }

    // Validate: cannot change owner's role
    if (targetMembership.role === 'owner') {
      return { error: 'Cannot change owner role. Use transfer ownership instead.' }
    }

    // Update the role
    const { error: updateError } = await adminClient
      .from('organization_members')
      .update({ role: newRole })
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return { error: 'Failed to update member role' }
    }

    revalidatePath(`/organizations/${organizationId}/members`)
    revalidatePath(`/organizations/${organizationId}`)

    return { success: true }
  } catch (error) {
    console.error('Error in updateMemberRole:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// MEMBER DEACTIVATION (SOFT DELETE)
// ============================================================================

/**
 * Deactivate a member from an organization (soft delete)
 * - Preserves all financial history and transactions
 * - Can be reactivated later
 * - Must be admin or owner
 * - Cannot deactivate owner or yourself
 */
export async function deactivateMember(input: DeactivateMemberInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { organizationId, targetUserId } = input

    // Validate: cannot deactivate yourself
    if (targetUserId === user.id) {
      return { error: 'You cannot deactivate yourself. Leave the organization instead.' }
    }

    const adminClient = createAdminClient()

    // Check current user's role (must be admin or owner)
    const { data: currentUserMembership, error: membershipError } =
      await adminClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

    if (membershipError || !currentUserMembership) {
      return { error: 'You are not a member of this organization' }
    }

    if (!['owner', 'admin'].includes(currentUserMembership.role)) {
      return { error: 'Insufficient permissions. Only admins and owners can deactivate members.' }
    }

    // Check target member's current role
    const { data: targetMembership, error: targetError } = await adminClient
      .from('organization_members')
      .select('role, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .single()

    if (targetError || !targetMembership) {
      return { error: 'Target user is not a member of this organization' }
    }

    // Validate: cannot deactivate owner
    if (targetMembership.role === 'owner') {
      return { error: 'Cannot deactivate the organization owner' }
    }

    // Validate: member must be active
    if (!targetMembership.is_active) {
      return { error: 'Member is already inactive' }
    }

    // Use the database function for soft delete
    const { error: deactivateError } = await adminClient.rpc('deactivate_member', {
      p_organization_id: organizationId,
      p_user_id: targetUserId,
    })

    if (deactivateError) {
      console.error('Error deactivating member:', deactivateError)
      return { error: 'Failed to deactivate member' }
    }

    revalidatePath(`/organizations/${organizationId}/members`)
    revalidatePath(`/organizations/${organizationId}`)

    return { success: true }
  } catch (error) {
    console.error('Error in deactivateMember:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// MEMBER REACTIVATION
// ============================================================================

/**
 * Reactivate a previously deactivated member
 * - Restores full access and visibility
 * - Must be admin or owner
 */
export async function reactivateMember(input: ReactivateMemberInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { organizationId, targetUserId } = input

    const adminClient = createAdminClient()

    // Check current user's role (must be admin or owner)
    const { data: currentUserMembership, error: membershipError } =
      await adminClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

    if (membershipError || !currentUserMembership) {
      return { error: 'You are not a member of this organization' }
    }

    if (!['owner', 'admin'].includes(currentUserMembership.role)) {
      return { error: 'Insufficient permissions. Only admins and owners can reactivate members.' }
    }

    // Check target member exists and is inactive
    const { data: targetMembership, error: targetError } = await adminClient
      .from('organization_members')
      .select('is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .single()

    if (targetError || !targetMembership) {
      return { error: 'Target user is not a member of this organization' }
    }

    if (targetMembership.is_active) {
      return { error: 'Member is already active' }
    }

    // Use the database function for reactivation
    const { error: reactivateError } = await adminClient.rpc('reactivate_member', {
      p_organization_id: organizationId,
      p_user_id: targetUserId,
    })

    if (reactivateError) {
      console.error('Error reactivating member:', reactivateError)
      return { error: 'Failed to reactivate member' }
    }

    revalidatePath(`/organizations/${organizationId}/members`)
    revalidatePath(`/organizations/${organizationId}`)

    return { success: true }
  } catch (error) {
    console.error('Error in reactivateMember:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// INVITE CODE MANAGEMENT
// ============================================================================

/**
 * Create a new invite code for an organization
 * - Must be admin or owner
 * - Generates a unique 12-character code
 * - Optionally set max uses (null = unlimited)
 */
export async function createInviteCode(input: CreateInviteInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { organizationId, maxUses } = input

    const adminClient = createAdminClient()

    // Check current user's role (must be admin or owner)
    const { data: membership, error: membershipError } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return { error: 'You are not a member of this organization' }
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return { error: 'Insufficient permissions. Only admins and owners can create invite codes.' }
    }

    // Generate unique code
    let code = generateInviteCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await adminClient
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) break

      code = generateInviteCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return { error: 'Failed to generate unique invite code. Please try again.' }
    }

    // Create the invite code
    const { data: inviteCode, error: createError } = await adminClient
      .from('invite_codes')
      .insert({
        organization_id: organizationId,
        code,
        max_uses: maxUses || null,
        current_uses: 0,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating invite code:', createError)
      return { error: 'Failed to create invite code' }
    }

    revalidatePath(`/organizations/${organizationId}/members`)

    return { success: true, inviteCode }
  } catch (error) {
    console.error('Error in createInviteCode:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Revoke an invite code (soft delete)
 * - Must be admin or owner
 * - Sets is_active to false
 */
export async function revokeInviteCode(input: RevokeInviteInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { inviteId, organizationId } = input

    const adminClient = createAdminClient()

    // Check current user's role (must be admin or owner)
    const { data: membership, error: membershipError } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return { error: 'You are not a member of this organization' }
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return { error: 'Insufficient permissions. Only admins and owners can revoke invite codes.' }
    }

    // Revoke the invite code
    const { error: revokeError } = await adminClient
      .from('invite_codes')
      .update({ is_active: false })
      .eq('id', inviteId)
      .eq('organization_id', organizationId)

    if (revokeError) {
      console.error('Error revoking invite code:', revokeError)
      return { error: 'Failed to revoke invite code' }
    }

    revalidatePath(`/organizations/${organizationId}/members`)

    return { success: true }
  } catch (error) {
    console.error('Error in revokeInviteCode:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all active invite codes for an organization
 * - Must be admin or owner
 */
export async function getInviteCodes(
  organizationId: string
): Promise<{ inviteCodes?: InviteCodeWithCreator[]; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()

    // Check current user's role (must be admin or owner)
    const { data: membership, error: membershipError } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return { error: 'You are not a member of this organization' }
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return { error: 'Insufficient permissions. Only admins and owners can view invite codes.' }
    }

    // Fetch invite codes with creator details
    const { data: inviteCodes, error: fetchError } = await adminClient
      .from('invite_codes')
      .select(
        `
        *,
        creator:profiles!invite_codes_created_by_fkey (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching invite codes:', fetchError)
      return { error: 'Failed to fetch invite codes' }
    }

    return { inviteCodes: inviteCodes as InviteCodeWithCreator[] }
  } catch (error) {
    console.error('Error in getInviteCodes:', error)
    return { error: 'An unexpected error occurred' }
  }
}
