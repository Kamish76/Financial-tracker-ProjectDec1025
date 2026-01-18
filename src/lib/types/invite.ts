// ============================================================================
// INVITE CODE TYPES
// ============================================================================

/**
 * Base invite code from database
 */
export interface InviteCode {
  id: string
  organization_id: string
  code: string
  max_uses: number | null // null = unlimited
  current_uses: number
  is_active: boolean
  created_by: string | null
  created_at: string
}

/**
 * Invite code with creator profile details
 */
export interface InviteCodeWithCreator extends InviteCode {
  creator: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

/**
 * Input for creating a new invite code
 */
export interface CreateInviteInput {
  organizationId: string
  maxUses?: number | null // undefined or null = unlimited
}

/**
 * Input for revoking an invite code
 */
export interface RevokeInviteInput {
  inviteId: string
  organizationId: string
}

/**
 * Input for joining with an invite code
 */
export interface JoinWithInviteInput {
  code: string
}

/**
 * Result from using an invite code
 */
export interface UseInviteResult {
  success: boolean
  organizationId?: string
  organizationName?: string
  errorMessage?: string
}

/**
 * Invite code statistics
 */
export interface InviteStats {
  totalActive: number
  totalRevoked: number
  totalUses: number
  averageUsesPerCode: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if invite code has reached max uses
 */
export function isInviteCodeExhausted(code: InviteCode): boolean {
  if (code.max_uses === null) return false // Unlimited
  return code.current_uses >= code.max_uses
}

/**
 * Get remaining uses for an invite code
 */
export function getRemainingUses(code: InviteCode): number | null {
  if (code.max_uses === null) return null // Unlimited
  return Math.max(0, code.max_uses - code.current_uses)
}

/**
 * Format remaining uses for display
 */
export function formatRemainingUses(code: InviteCode): string {
  const remaining = getRemainingUses(code)
  if (remaining === null) return 'Unlimited'
  if (remaining === 0) return 'Exhausted'
  return `${remaining} remaining`
}

/**
 * Format max uses for display
 */
export function formatMaxUses(maxUses: number | null): string {
  return maxUses === null ? 'Unlimited' : `${maxUses} uses`
}

/**
 * Check if invite code is usable
 */
export function isInviteCodeUsable(code: InviteCode): boolean {
  return code.is_active && !isInviteCodeExhausted(code)
}

/**
 * Generate a random invite code (12 characters)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar looking chars
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // Format as XXXX-XXXX-XXXX
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`
}

/**
 * Format invite code for display (with dashes)
 */
export function formatInviteCode(code: string): string {
  // Remove existing dashes
  const clean = code.replace(/-/g, '')
  // Add dashes every 4 characters
  return clean.match(/.{1,4}/g)?.join('-') || code
}

/**
 * Clean invite code input (remove dashes and whitespace)
 */
export function cleanInviteCode(code: string): string {
  return code.replace(/[-\s]/g, '').toUpperCase()
}

/**
 * Validate invite code format
 */
export function isValidInviteCodeFormat(code: string): boolean {
  const clean = cleanInviteCode(code)
  return /^[A-Z0-9]{12}$/.test(clean)
}

/**
 * Format created date
 */
export function formatCreatedDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

/**
 * Get invite code status badge info
 */
export function getInviteCodeBadge(code: InviteCode): {
  label: string
  color: string
} {
  if (!code.is_active) {
    return { label: 'Revoked', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  }
  if (isInviteCodeExhausted(code)) {
    return { label: 'Exhausted', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
  }
  return { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
}
