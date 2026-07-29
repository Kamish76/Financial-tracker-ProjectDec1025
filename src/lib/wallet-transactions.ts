'use server'

import { requireUser } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrCreateCategory } from '@/lib/categories'
import { revalidatePath } from 'next/cache'

export type AddWalletTransactionInput = {
  organizationId: string
  type: 'income' | 'expense_personal' | 'expense_business' | 'transfer'
  amount: number
  accountId: string
  transferToAccountId?: string | null
  category?: string
  notes?: string
  createdAt?: string
}

export async function addWalletTransaction(input: AddWalletTransactionInput): Promise<{
  success?: boolean
  transactionId?: string
  error?: string
}> {
  try {
    const user = await requireUser()
    const adminClient = createAdminClient()

    // 1. Enforce Non-Negative amount safeguard
    if (input.amount <= 0 || isNaN(input.amount)) {
      return { error: 'Transaction amount must be greater than 0.' }
    }

    if (!input.accountId) {
      return { error: 'Please select an account.' }
    }

    if (input.type === 'transfer') {
      if (!input.transferToAccountId) {
        return { error: 'Please select a destination account for the transfer.' }
      }
      if (input.accountId === input.transferToAccountId) {
        return { error: 'Source and destination accounts must be different.' }
      }
    }

    // 2. Verify org access (following our project rules: check owner_id or active member using maybeSingle)
    const { data: org } = await adminClient
      .from('organizations')
      .select('id')
      .eq('id', input.organizationId)
      .eq('owner_id', user.id)
      .maybeSingle()

    let hasAccess = !!org
    if (!hasAccess) {
      const { data: member } = await adminClient
        .from('organization_members')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      hasAccess = !!member
    }

    if (!hasAccess) {
      return { error: 'You do not have permission to add transactions to this wallet.' }
    }

    // 3. Resolve category ID if category string was specified and it is not a transfer
    let categoryId: string | null = null
    if (input.type !== 'transfer' && input.category?.trim()) {
      const catType = input.type === 'income' ? 'income' : 'expense'
      categoryId = await getOrCreateCategory(input.organizationId, input.category.trim(), catType)
    }

    // 4. Insert transaction
    const { data, error } = await adminClient
      .from('transactions')
      .insert({
        organization_id: input.organizationId,
        user_id: user.id,
        type: input.type,
        amount: input.amount,
        account_id: input.accountId,
        transfer_to_account_id: input.type === 'transfer' ? input.transferToAccountId : null,
        category_id: categoryId,
        category: input.category || null,
        description: input.notes || '',
        created_at: input.createdAt || new Date().toISOString(),
        occurred_at: input.createdAt || new Date().toISOString(),
        funded_by_type: input.type === 'expense_personal' ? 'personal' : 'business',
        funded_by_user_id: user.id,
        updated_by_user_id: user.id,
        is_initial: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[addWalletTransaction] Supabase error:', error.message)
      return { error: error.message }
    }

    // 5. Revalidate wallet paths
    revalidatePath(`/organizations/${input.organizationId}`, 'layout')

    return {
      success: true,
      transactionId: data?.id,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save transaction.'
    return { error: msg }
  }
}
