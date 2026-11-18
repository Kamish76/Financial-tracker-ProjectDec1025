'use server'

import { requireOrgMembership, authorizeOrgAction } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/server'
import { isWalletOrganization } from '@/lib/wallet'
import { revalidatePath } from 'next/cache'

import type { WalletAccount, AccountWithBalance, LinkableOrganization } from './wallet-types'

function sanitizePostgrestFilter(term: string): string {
  if (!term) return ''
  return term.replace(/[(),."\\]/g, '').trim()
}

export async function verifyOrgAccess(organizationId: string, userId: string): Promise<boolean> {
  const adminClient = createAdminClient()

  // First check if user is owner of the organization
  const { data: org } = await adminClient
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (org) return true

  // Otherwise check if user is an active member
  const { data: member } = await adminClient
    .from('organization_members')
    .select('organization_id, user_id, is_active')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  return !!member
}

/**
 * Computes a member's businessHeld balance inside a linked organization,
 * matching getOrganizationStats() in src/lib/finance.ts.
 */
async function computeMemberBusinessHeld(
  adminClient: ReturnType<typeof createAdminClient>,
  linkedOrgId: string,
  userId: string
): Promise<number> {
  const { data, error } = await adminClient
    .from('transactions')
    .select('type, amount, funded_by_type')
    .eq('organization_id', linkedOrgId)
    .eq('funded_by_user_id', userId)
    .limit(10000)

  if (error) {
    console.error('[computeMemberBusinessHeld] Error fetching transactions:', error.message)
    return 0
  }

  let held = 0
  for (const tx of data || []) {
    const amount = Number(tx.amount ?? 0)
    if (tx.type === 'held_allocate') {
      held += amount
    } else if (tx.type === 'held_return') {
      held -= amount
    } else if (tx.funded_by_type === 'business') {
      if (tx.type === 'income') {
        held += amount
      } else if (tx.type === 'expense_business') {
        held -= amount
      }
    }
  }
  return Number(held.toFixed(2))
}

export async function getLinkableOrganizations(
  organizationId: string
): Promise<LinkableOrganization[]> {
  const { user } = await requireOrgMembership(organizationId)
  const adminClient = createAdminClient()

  const [membershipsResult, ownedOrgsResult] = await Promise.all([
    adminClient
      .from('organization_members')
      .select('organization_id, organizations(id, name, description, currency)')
      .eq('user_id', user.id)
      .eq('is_active', true),
    adminClient
      .from('organizations')
      .select('id, name, description, currency')
      .eq('owner_id', user.id),
  ])

  const orgMap = new Map<string, LinkableOrganization>()

  const considerOrg = (org: {
    id: string
    name: string
    description: string | null
    currency?: string | null
  }) => {
    if (org.id === organizationId || isWalletOrganization(org.description)) return
    orgMap.set(org.id, {
      id: org.id,
      name: org.name,
      currency: org.currency ?? undefined,
    })
  }

  for (const m of membershipsResult.data || []) {
    const orgData = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
    if (orgData) {
      considerOrg(
        orgData as { id: string; name: string; description: string | null; currency?: string | null }
      )
    }
  }

  for (const owned of ownedOrgsResult.data || []) {
    considerOrg(owned)
  }

  return Array.from(orgMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getWalletAccounts(
  organizationId: string,
  includeArchived = false
): Promise<WalletAccount[]> {
  await requireOrgMembership(organizationId)
  const adminClient = createAdminClient()

  let query = adminClient
    .from('wallet_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: true })

  if (!includeArchived) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getWalletAccounts] Error fetching accounts:', error.message)
    return []
  }

  const rows = (data || []) as Record<string, unknown>[]
  const linkedOrgIds = Array.from(
    new Set(rows.map((r) => (r.linked_org_id ? String(r.linked_org_id) : '')).filter(Boolean))
  )

  const orgNameMap = new Map<string, string>()
  if (linkedOrgIds.length > 0) {
    const { data: linkedOrgs } = await adminClient
      .from('organizations')
      .select('id, name')
      .in('id', linkedOrgIds)

    for (const org of linkedOrgs || []) {
      orgNameMap.set(org.id, org.name)
    }
  }

  return rows.map((row) => {
    const linkedOrgId = row.linked_org_id ? String(row.linked_org_id) : null
    return {
      id: String(row.id ?? ''),
      organization_id: String(row.organization_id ?? ''),
      name: String(row.name ?? ''),
      starting_value: Number(row.starting_value ?? 0),
      is_active: Boolean(row.is_active ?? true),
      linked_org_id: linkedOrgId,
      linked_org_balance:
        row.linked_org_balance !== null && row.linked_org_balance !== undefined
          ? Number(row.linked_org_balance)
          : null,
      linked_org_name: linkedOrgId ? (orgNameMap.get(linkedOrgId) ?? null) : null,
      created_at: String(row.created_at ?? ''),
      updated_at: String(row.updated_at ?? ''),
    }
  })
}

export async function getAccountsWithBalances(
  organizationId: string,
  includeArchived = false
): Promise<AccountWithBalance[]> {
  await requireOrgMembership(organizationId)
  const accounts = await getWalletAccounts(organizationId, includeArchived)
  if (accounts.length === 0) return []

  const adminClient = createAdminClient()
  const linkedOrgIds = Array.from(
    new Set(accounts.map((a) => a.linked_org_id).filter((id): id is string => Boolean(id)))
  )

  const [{ data: transactions, error }, walletOrgResult] = await Promise.all([
    adminClient
      .from('transactions')
      .select('id, account_id, transfer_to_account_id, type, amount')
      .eq('organization_id', organizationId)
      .or('account_id.not.is.null,transfer_to_account_id.not.is.null')
      .limit(10000),
    linkedOrgIds.length > 0
      ? adminClient.from('organizations').select('owner_id').eq('id', organizationId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (error) {
    console.error('[getAccountsWithBalances] Error fetching transactions:', error.message)
  }

  const linkedBalanceMap = new Map<string, number>()
  const walletOwnerId = walletOrgResult.data?.owner_id
  if (linkedOrgIds.length > 0 && walletOwnerId) {
    await Promise.all(
      linkedOrgIds.map(async (linkedOrgId) => {
        const held = await computeMemberBusinessHeld(adminClient, linkedOrgId, walletOwnerId)
        linkedBalanceMap.set(linkedOrgId, held === 0 ? 0 : Number((-held).toFixed(2)))
      })
    )
  }

  const txList = transactions || []

  return accounts.map((acc) => {
    let current_balance = acc.starting_value
    let transaction_count = 0

    for (const tx of txList) {
      const amt = Number(tx.amount ?? 0)
      if (tx.account_id === acc.id) {
        transaction_count++
        if (tx.type === 'income') {
          current_balance += amt
        } else if (tx.type === 'expense_business' || tx.type === 'expense_personal' || tx.type === 'transfer') {
          current_balance -= amt
        }
      }
      if (tx.transfer_to_account_id === acc.id) {
        transaction_count++
        if (tx.type === 'transfer') {
          current_balance += amt
        }
      }
    }

    if (acc.linked_org_id) {
      current_balance =
        linkedBalanceMap.get(acc.linked_org_id) ?? Number(acc.linked_org_balance ?? 0)
    }

    return {
      ...acc,
      current_balance,
      transaction_count,
    }
  })
}

export async function createWalletAccount(
  organizationId: string,
  name: string,
  startingValue = 0,
  linkedOrgId?: string | null
): Promise<{ success?: boolean; accountId?: string; error?: string }> {
  try {
    const auth = await authorizeOrgAction(
      organizationId,
      ['owner', 'admin'],
      'You do not have permission to create an account in this organization'
    )
    if ('error' in auth) {
      return { error: auth.error }
    }

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      return { error: 'Account name must be at least 2 characters long' }
    }
    if (trimmedName.length > 60) {
      return { error: 'Account name must be 60 characters or fewer' }
    }
    if (isNaN(startingValue)) {
      return { error: 'Starting value must be a valid number' }
    }

    const adminClient = createAdminClient()
    const normalizedLinkedOrgId = linkedOrgId?.trim() || null
    let linkedBalance: number | null = null

    if (normalizedLinkedOrgId) {
      if (normalizedLinkedOrgId === organizationId) {
        return { error: 'Cannot link a wallet to itself' }
      }
      const hasAccess = await verifyOrgAccess(normalizedLinkedOrgId, auth.user.id)
      if (!hasAccess) {
        return { error: 'You do not have access to the selected organization' }
      }
      const { data: walletOrg } = await adminClient
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .maybeSingle()
      const targetUserId = walletOrg?.owner_id ?? auth.user.id
      const held = await computeMemberBusinessHeld(adminClient, normalizedLinkedOrgId, targetUserId)
      linkedBalance = held === 0 ? 0 : Number((-held).toFixed(2))
    }

    const { data, error } = await adminClient
      .from('wallet_accounts')
      .insert({
        organization_id: organizationId,
        name: trimmedName,
        starting_value: normalizedLinkedOrgId ? 0 : startingValue,
        is_active: true,
        linked_org_id: normalizedLinkedOrgId,
        linked_org_balance: linkedBalance,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'An account with this name already exists' }
      }
      console.error('[createWalletAccount] Error:', error.message)
      return { error: error.message }
    }

    revalidatePath(`/organizations/${organizationId}`, 'layout')
    return { success: true, accountId: data?.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create account'
    return { error: msg }
  }
}

export async function updateWalletAccount(
  accountId: string,
  name: string,
  startingValue: number,
  linkedOrgId?: string | null
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    const { data: account, error: fetchError } = await adminClient
      .from('wallet_accounts')
      .select('organization_id, linked_org_id')
      .eq('id', accountId)
      .maybeSingle()

    if (fetchError || !account) {
      return { error: 'Account not found' }
    }

    const auth = await authorizeOrgAction(
      account.organization_id,
      ['owner', 'admin'],
      'You do not have permission to modify this account'
    )
    if ('error' in auth) {
      return { error: auth.error }
    }

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      return { error: 'Account name must be at least 2 characters long' }
    }

    const updateFields: {
      name: string
      starting_value?: number
      linked_org_id?: string | null
      linked_org_balance?: number | null
      updated_at: string
    } = {
      name: trimmedName,
      updated_at: new Date().toISOString(),
    }

    if (linkedOrgId !== undefined) {
      const normalizedLinkedOrgId = linkedOrgId?.trim() || null
      if (normalizedLinkedOrgId) {
        if (normalizedLinkedOrgId === account.organization_id) {
          return { error: 'Cannot link a wallet to itself' }
        }
        const hasAccess = await verifyOrgAccess(normalizedLinkedOrgId, auth.user.id)
        if (!hasAccess) {
          return { error: 'You do not have access to the selected organization' }
        }
        const { data: walletOrg } = await adminClient
          .from('organizations')
          .select('owner_id')
          .eq('id', account.organization_id)
          .maybeSingle()
        const targetUserId = walletOrg?.owner_id ?? auth.user.id
        const held = await computeMemberBusinessHeld(adminClient, normalizedLinkedOrgId, targetUserId)
        updateFields.linked_org_id = normalizedLinkedOrgId
        updateFields.linked_org_balance = held === 0 ? 0 : Number((-held).toFixed(2))
        // Preserve existing starting_value when linking so unlinking later restores it cleanly.
      } else {
        updateFields.linked_org_id = null
        updateFields.linked_org_balance = null
        updateFields.starting_value = startingValue
      }
    } else if (!account.linked_org_id) {
      updateFields.starting_value = startingValue
    }

    const { error: updateError } = await adminClient
      .from('wallet_accounts')
      .update(updateFields)
      .eq('id', accountId)

    if (updateError) {
      if (updateError.code === '23505') {
        return { error: 'An account with this name already exists' }
      }
      return { error: updateError.message }
    }

    revalidatePath(`/organizations/${account.organization_id}`, 'layout')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update account'
    return { error: msg }
  }
}

export async function toggleArchiveWalletAccount(
  accountId: string,
  isActive: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    const { data: account, error: fetchError } = await adminClient
      .from('wallet_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .maybeSingle()

    if (fetchError || !account) {
      return { error: 'Account not found' }
    }

    const auth = await authorizeOrgAction(
      account.organization_id,
      ['owner', 'admin'],
      'You do not have permission to modify this account'
    )
    if ('error' in auth) {
      return { error: auth.error }
    }

    const { error: updateError } = await adminClient
      .from('wallet_accounts')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath(`/organizations/${account.organization_id}`, 'layout')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to change archive status'
    return { error: msg }
  }
}

export async function deleteWalletAccount(
  accountId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    const { data: account, error: fetchError } = await adminClient
      .from('wallet_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .maybeSingle()

    if (fetchError || !account) {
      return { error: 'Account not found' }
    }

    const auth = await authorizeOrgAction(
      account.organization_id,
      ['owner', 'admin'],
      'You do not have permission to delete this account'
    )
    if ('error' in auth) {
      return { error: auth.error }
    }

    const sanitizedAccountId = sanitizePostgrestFilter(accountId)
    if (!sanitizedAccountId) {
      return { error: 'Invalid account ID' }
    }

    const { count, error: txError } = await adminClient
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .or(`account_id.eq.${sanitizedAccountId},transfer_to_account_id.eq.${sanitizedAccountId}`)

    if (txError) {
      return { error: 'Failed to verify transaction references' }
    }

    if ((count || 0) > 0) {
      return {
        error:
          'Cannot delete an account that has existing transactions. Please archive it instead.',
      }
    }

    const { error: deleteError } = await adminClient
      .from('wallet_accounts')
      .delete()
      .eq('id', accountId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    revalidatePath(`/organizations/${account.organization_id}`, 'layout')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete account'
    return { error: msg }
  }
}
