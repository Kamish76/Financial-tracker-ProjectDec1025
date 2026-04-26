import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getAuthContext, type OrgMembership, type OrganizationRole } from './server-context'

type RequireOptions = {
  redirectTo?: string
}

type ActionAuthFailure = {
  ok: false
  error: string
}

type ActionAuthSuccess = {
  ok: true
  user: User
  membership: OrgMembership
}

export type ActionAuthResult = ActionAuthFailure | ActionAuthSuccess

export async function requireUser(options?: RequireOptions): Promise<User> {
  const { user } = await getAuthContext()

  if (!user) {
    redirect(options?.redirectTo ?? '/auth')
  }

  return user
}

export async function requireOrgMembership(
  organizationId: string,
  options?: RequireOptions
): Promise<{ user: User; membership: OrgMembership }> {
  const user = await requireUser(options)
  const context = await getAuthContext()
  const membership = await context.getOrgMembership(organizationId)

  if (!membership) {
    redirect(options?.redirectTo ?? '/organizations')
  }

  return { user, membership }
}

export async function requireOrgRole(
  organizationId: string,
  roles: OrganizationRole[],
  options?: RequireOptions
): Promise<{ user: User; membership: OrgMembership }> {
  const { user, membership } = await requireOrgMembership(organizationId, options)

  if (!roles.includes(membership.role)) {
    redirect(options?.redirectTo ?? `/organizations/${organizationId}`)
  }

  return { user, membership }
}

export async function assertOrgRoleForAction(
  organizationId: string,
  roles: OrganizationRole[]
): Promise<ActionAuthResult> {
  const context = await getAuthContext()

  if (!context.user) {
    return {
      ok: false,
      error: 'You must be signed in',
    }
  }

  const membership = await context.getOrgMembership(organizationId)
  if (!membership) {
    return {
      ok: false,
      error: 'You are not a member of this organization',
    }
  }

  if (!roles.includes(membership.role)) {
    return {
      ok: false,
      error: 'Insufficient permissions',
    }
  }

  return {
    ok: true,
    user: context.user,
    membership,
  }
}

export async function authorizeOrgAction(
  organizationId: string,
  roles: OrganizationRole[],
  errorMessage: string
): Promise<ActionAuthResult> {
  const auth = await assertOrgRoleForAction(organizationId, roles)

  if (!auth.ok) {
    return {
      ok: false,
      error: auth.error === 'You must be signed in' ? auth.error : errorMessage,
    }
  }

  return auth
}