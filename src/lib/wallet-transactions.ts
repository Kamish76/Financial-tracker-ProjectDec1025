'use server'

import { authorizeOrgAction } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrCreateCategory } from '@/lib/categories'
import { revalidateOrganizationSections } from '@/lib/revalidation'

type AddWalletTransactionInput = {
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
    // 1. Enforce Non-Negative amount safeguard and basic input validation before DB calls
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

    // 2. Verify org access via cached auth context (reused by getOrCreateCategory)
    const auth = await authorizeOrgAction(
      input.organizationId,
      ['owner', 'admin', 'member'],
      'You do not have permission to add transactions to this wallet.'
    )
    if (!auth.ok) {
      return { error: auth.error }
    }

    const { user } = auth
    const adminClient = createAdminClient()

    // 3. Validate account(s) in parallel before resolving/creating category
    const [sourceResult, destResult] = await Promise.all([
      adminClient
        .from('wallet_accounts')
        .select('id, organization_id, is_active, linked_org_id')
        .eq('id', input.accountId)
        .eq('organization_id', input.organizationId)
        .eq('is_active', true)
        .maybeSingle(),
      input.type === 'transfer' && input.transferToAccountId
        ? adminClient
            .from('wallet_accounts')
            .select('id, organization_id, is_active')
            .eq('id', input.transferToAccountId)
            .eq('organization_id', input.organizationId)
            .eq('is_active', true)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const sourceAccount = sourceResult.data
    if (!sourceAccount) {
      return { error: 'Invalid source account.' }
    }

    if (input.type !== 'transfer' && sourceAccount.linked_org_id) {
      return {
        error:
          'This sub-account is linked to an organization balance and is read-only for direct income or expenses. Use Transfer or record transactions in the linked organization.',
      }
    }

    if (input.type === 'transfer' && !destResult.data) {
      return { error: 'Invalid destination account.' }
    }

    const catType = input.type === 'income' ? 'income' : 'expense'
    const categoryId =
      input.type !== 'transfer' && input.category?.trim()
        ? await getOrCreateCategory(input.organizationId, input.category.trim(), catType)
        : null

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
        created_at: new Date().toISOString(),
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

    // 5. Revalidate affected wallet sections without forcing a full-layout revalidation
    revalidateOrganizationSections(input.organizationId, ['records', 'accounts'])

    return {
      success: true,
      transactionId: data?.id,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save transaction.'
    return { error: msg }
  }
}
