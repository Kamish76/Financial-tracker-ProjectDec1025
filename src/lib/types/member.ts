// ============================================================================
// MEMBER MANAGEMENT TYPES
// ============================================================================

/**
 * Organization role types following database check constraint
 */
export type OrganizationRole = 'owner' | 'admin' | 'member'

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
} as const

/**
 * Role display information
 */
export const ROLE_INFO: Record<OrganizationRole, { label: string; icon: string; color: string }> = {
  owner: {
    label: 'Owner',
    icon: '👑',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  admin: {
    label: 'Admin',
    icon: '🛡️',
    color: 'text-blue-600 dark:text-blue-400',
  },
  member: {
    label: 'Member',
    icon: '👤',
    color: 'text-gray-600 dark:text-gray-400',
  },
} as const

/**
 * Base organization member from database
 */
export interface OrganizationMember {
  organization_id: string
  user_id: string
  role: OrganizationRole
  invited_by: string | null
  created_at: string
  is_active: boolean
  deactivated_at: string | null
}

/**
 * Member with profile details for display
 */
export interface MemberWithProfile extends OrganizationMember {
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
  }
}

/**
 * Member status helper type
 */
export type MemberStatus = 'active' | 'inactive'

/**
 * Input for updating member role
 */
export interface UpdateMemberRoleInput {
  organizationId: string
  targetUserId: string
  newRole: OrganizationRole
}

/**
 * Input for deactivating a member
 */
export interface DeactivateMemberInput {
  organizationId: string
  targetUserId: string
}

/**
 * Input for reactivating a member
 */
export interface ReactivateMemberInput {
  organizationId: string
  targetUserId: string
}

/**
 * Member list filters
 */
export interface MemberFilters {
  status?: MemberStatus
  role?: OrganizationRole
  searchQuery?: string
}

/**
 * Member statistics
 */
export interface MemberStats {
  totalActive: number
  totalInactive: number
  ownerCount: number
  adminCount: number
  memberCount: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has sufficient permissions
 */
export function hasPermission(userRole: OrganizationRole, requiredRole: OrganizationRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can manage a target member
 */
export function canManageMember(
  userRole: OrganizationRole,
  targetRole: OrganizationRole,
  targetUserId: string,
  currentUserId: string
): boolean {
  // Cannot manage owners
  if (targetRole === 'owner') return false
  
  // Cannot manage yourself
  if (targetUserId === currentUserId) return false
  
  // Must be admin or owner
  return hasPermission(userRole, 'admin')
}

/**
 * Check if a role change is valid
 */
export function canChangeRole(
  userRole: OrganizationRole,
  currentRole: OrganizationRole,
  newRole: OrganizationRole
): boolean {
  // Cannot change to/from owner role (must use transfer ownership)
  if (currentRole === 'owner' || newRole === 'owner') return false
  
  // Must be admin or owner to change roles
  return hasPermission(userRole, 'admin')
}

/**
 * Get member status from is_active flag
 */
export function getMemberStatus(isActive: boolean): MemberStatus {
  return isActive ? 'active' : 'inactive'
}

/**
 * Get display name for member (handles null full_name)
 */
export function getMemberDisplayName(member: MemberWithProfile): string {
  return member.profile.full_name || 'Unknown User'
}

/**
 * Get display name with inactive suffix for transactions
 */
export function getMemberDisplayNameWithStatus(member: MemberWithProfile): string {
  const name = getMemberDisplayName(member)
  return member.is_active ? name : `${name} (Inactive)`
}

/**
 * Format joined date
 */
export function formatJoinedDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Format deactivated date
 */
export function formatDeactivatedDate(dateString: string | null): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}
