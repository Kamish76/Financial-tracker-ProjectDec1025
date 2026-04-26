import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createAdminClient, getCachedUser } from '@/lib/supabase/server'

export type OrganizationRole = 'owner' | 'admin' | 'member'

export interface OrgMembership {
  organizationId: string
  userId: string
  role: OrganizationRole
  isActive: boolean
}

export interface AuthContext {
  user: User | null
  userId: string | null
  isAuthenticated: boolean
  getOrgMembership: (organizationId: string) => Promise<OrgMembership | null>
  hasOrgRole: (organizationId: string, roles: OrganizationRole[]) => Promise<boolean>
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const { user } = await getCachedUser()
  const membershipCache = new Map<string, OrgMembership | null>()

  const getOrgMembership = async (organizationId: string): Promise<OrgMembership | null> => {
    if (!user) {
      return null
    }

    if (membershipCache.has(organizationId)) {
      return membershipCache.get(organizationId) ?? null
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('organization_members')
      .select('organization_id, user_id, role, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data || !data.is_active) {
      if (error) {
        console.error('[auth-context] Membership lookup failed', {
          organizationId,
          userId: user.id,
          error: error.message,
        })
      }

      membershipCache.set(organizationId, null)
      return null
    }

    const membership: OrgMembership = {
      organizationId: data.organization_id,
      userId: data.user_id,
      role: data.role as OrganizationRole,
      isActive: data.is_active,
    }

    membershipCache.set(organizationId, membership)
    return membership
  }

  const hasOrgRole = async (organizationId: string, roles: OrganizationRole[]): Promise<boolean> => {
    const membership = await getOrgMembership(organizationId)
    if (!membership) {
      return false
    }

    return roles.includes(membership.role)
  }

  return {
    user,
    userId: user?.id ?? null,
    isAuthenticated: Boolean(user),
    getOrgMembership,
    hasOrgRole,
  }
})