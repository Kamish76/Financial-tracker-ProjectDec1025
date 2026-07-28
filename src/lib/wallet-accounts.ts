'use server'

import { requireUser } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type WalletAccount = {
  id: string
  organization_id: string
  name: string
  starting_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AccountWithBalance = WalletAccount & {
  current_balance: number
  transaction_count: number
}

async function verifyOrgAccess(organizationId: string, userId: string): Promise<boolean> {
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
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  return !!member
}

export async function getWalletAccounts(
  organizationId: string,
  includeArchived = false
): Promise<WalletAccount[]> {
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

  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    organization_id: String(row.organization_id ?? ''),
    name: String(row.name ?? ''),
    starting_value: Number(row.starting_value ?? 0),
    is_active: Boolean(row.is_active ?? true),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }))
}

export async function getAccountsWithBalances(
  organizationId: string,
  includeArchived = false
): Promise<AccountWithBalance[]> {
  const accounts = await getWalletAccounts(organizationId, includeArchived)
  if (accounts.length === 0) return []

  const adminClient = createAdminClient()
  const { data: transactions, error } = await adminClient
    .from('transactions')
    .select('id, account_id, type, amount')
    .eq('organization_id', organizationId)
    .not('account_id', 'is', null)

  if (error) {
    console.error('[getAccountsWithBalances] Error fetching transactions:', error.message)
  }

  const txList = transactions || []

  return accounts.map((acc) => {
    let current_balance = acc.starting_value
    let transaction_count = 0

    for (const tx of txList) {
      if (tx.account_id === acc.id) {
        transaction_count++
        const amt = Number(tx.amount ?? 0)
        if (tx.type === 'income') {
          current_balance += amt
        } else if (tx.type === 'expense_business' || tx.type === 'expense_personal') {
          current_balance -= amt
        }
      }
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
  startingValue = 0
): Promise<{ success?: boolean; accountId?: string; error?: string }> {
  try {
    const user = await requireUser()
    const hasAccess = await verifyOrgAccess(organizationId, user.id)
    if (!hasAccess) {
      return { error: 'You do not have permission to create an account in this organization' }
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
    const { data, error } = await adminClient
      .from('wallet_accounts')
      .insert({
        organization_id: organizationId,
        name: trimmedName,
        starting_value: startingValue,
        is_active: true,
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
  startingValue: number
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await requireUser()
    const adminClient = createAdminClient()

    const { data: account, error: fetchError } = await adminClient
      .from('wallet_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .single()

    if (fetchError || !account) {
      return { error: 'Account not found' }
    }

    const hasAccess = await verifyOrgAccess(account.organization_id, user.id)
    if (!hasAccess) {
      return { error: 'You do not have permission to modify this account' }
    }

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      return { error: 'Account name must be at least 2 characters long' }
    }

    const { error: updateError } = await adminClient
      .from('wallet_accounts')
      .update({
        name: trimmedName,
        starting_value: startingValue,
        updated_at: new Date().toISOString(),
      })
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
    const user = await requireUser()
    const adminClient = createAdminClient()

    const { data: account, error: fetchError } = await adminClient
      .from('wallet_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .single()

    if (fetchError || !account) {
      return { error: 'Account not found' }
    }

    const hasAccess = await verifyOrgAccess(account.organization_id, user.id)
    if (!hasAccess) {
      return { error: 'You do not have permission to modify this account' }
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
    const user = await requireUser()
    const adminClient = createAdminClient()

    const { data: account, error: fetchError } = await adminClient
      .from('wallet_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .single()

    if (fetchError || !account) {
      return { error: 'Account not found' }
    }

    const hasAccess = await verifyOrgAccess(account.organization_id, user.id)
    if (!hasAccess) {
      return { error: 'You do not have permission to delete this account' }
    }

    const { count, error: txError } = await adminClient
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)

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
