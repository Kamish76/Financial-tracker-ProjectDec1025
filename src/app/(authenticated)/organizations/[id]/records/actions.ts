'use server'

import {
	fetchOrganizationCategories as fetchOrganizationCategoriesImpl,
	fetchOrganizationMembers as fetchOrganizationMembersImpl,
	fetchTransactionsWithFilters as fetchTransactionsWithFiltersImpl,
} from './utils'
import type { FetchTransactionsResult, TransactionFilters } from './utils'
import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import { createAdminClient } from '@/lib/supabase/server'
import { isWalletOrganization } from '@/lib/wallet'
import { requireOrgMembership } from '@/lib/auth/guards'

export async function fetchTransactionsWithFilters(
	organizationId: string,
	filters: TransactionFilters
): Promise<FetchTransactionsResult> {
	await requireOrgMembership(organizationId)
	return fetchTransactionsWithFiltersImpl(organizationId, filters)
}

export async function fetchTransactions(
	organizationId: string,
	filters: TransactionFilters = {}
): Promise<FetchTransactionsResult> {
	await requireOrgMembership(organizationId)
	return fetchTransactionsWithFiltersImpl(organizationId, filters)
}

export async function fetchOrganizationMembers(organizationId: string) {
	await requireOrgMembership(organizationId)
	return fetchOrganizationMembersImpl(organizationId)
}

export async function fetchOrganizationCategories(organizationId: string) {
	await requireOrgMembership(organizationId)
	return fetchOrganizationCategoriesImpl(organizationId)
}

export async function fetchWalletSummary(organizationId: string) {
	await requireOrgMembership(organizationId)
	const adminClient = createAdminClient()
	const { data: org } = await adminClient
		.from('organizations')
		.select('description')
		.eq('id', organizationId)
		.maybeSingle()

	const isWallet = isWalletOrganization(org?.description)
	if (!isWallet) return null

	const accounts = await getAccountsWithBalances(organizationId, false)
	return {
		isWallet: true,
		accounts,
	}
}

export async function createTransaction(
	organizationIdOrInput: string | { organizationId: string; [key: string]: unknown },
	data?: Record<string, unknown>
) {
	const organizationId =
		typeof organizationIdOrInput === 'string'
			? organizationIdOrInput
			: organizationIdOrInput?.organizationId

	if (!organizationId) {
		return { error: 'Organization is required' }
	}

	const { user } = await requireOrgMembership(organizationId)
	const payload = (typeof organizationIdOrInput === 'object' ? organizationIdOrInput : data || {}) as Record<string, unknown>
	const admin = createAdminClient()

	const insertPayload = {
		organization_id: organizationId,
		user_id: user.id,
		amount: Number(payload.amount ?? 0),
		type: String(payload.type ?? 'expense_business'),
		description: payload.description ? String(payload.description).trim() : null,
		category: payload.category ? String(payload.category).trim() : null,
		category_id: (payload.categoryId || payload.category_id || null) as string | null,
		account_id: (payload.accountId || payload.account_id || null) as string | null,
		transfer_to_account_id: (payload.transferToAccountId || payload.transfer_to_account_id || null) as string | null,
		occurred_at: payload.occurredAt
			? new Date(String(payload.occurredAt)).toISOString()
			: payload.occurred_at
				? new Date(String(payload.occurred_at)).toISOString()
				: new Date().toISOString(),
		funded_by_type: String(payload.fundedByType || payload.funded_by_type || 'business'),
		funded_by_user_id: (payload.fundedByUserId || payload.funded_by_user_id || user.id) as string,
		updated_by_user_id: user.id,
	}

	const { data: created, error } = await admin
		.from('transactions')
		.insert(insertPayload)
		.select()
		.single()

	if (error) {
		return { error: error.message }
	}
	return { success: true, transaction: created }
}

export async function updateTransaction(
	organizationIdOrInput: string | { organizationId: string; transactionId?: string; id?: string; [key: string]: unknown },
	idOrData?: string | Record<string, unknown>,
	data?: Record<string, unknown>
) {
	let organizationId: string
	let transactionId: string
	let updateData: Record<string, unknown>

	if (typeof organizationIdOrInput === 'string') {
		organizationId = organizationIdOrInput
		transactionId = typeof idOrData === 'string' ? idOrData : String((idOrData as Record<string, unknown>)?.id ?? '')
		updateData = (data || idOrData) as Record<string, unknown>
	} else {
		organizationId = organizationIdOrInput.organizationId
		transactionId = String(organizationIdOrInput.transactionId || organizationIdOrInput.id || '')
		updateData = organizationIdOrInput
	}

	if (!organizationId || !transactionId) {
		return { error: 'Organization ID and Transaction ID are required' }
	}

	const { user } = await requireOrgMembership(organizationId)
	const admin = createAdminClient()

	// Verify transaction exists and belongs to organization
	const { data: existingTx, error: txError } = await admin
		.from('transactions')
		.select('id, organization_id')
		.eq('id', transactionId)
		.eq('organization_id', organizationId)
		.maybeSingle()

	if (txError || !existingTx) {
		return { error: 'Transaction not found or does not belong to this organization' }
	}

	const updatePayload: Record<string, unknown> = {
		updated_by_user_id: user.id,
		updated_at: new Date().toISOString(),
	}

	if (updateData.amount !== undefined) updatePayload.amount = Number(updateData.amount)
	if (updateData.description !== undefined) {
		updatePayload.description = updateData.description ? String(updateData.description).trim() : null
	}
	if (updateData.category !== undefined) {
		updatePayload.category = updateData.category ? String(updateData.category).trim() : null
	}
	if (updateData.category_id !== undefined || updateData.categoryId !== undefined) {
		updatePayload.category_id = (updateData.category_id ?? updateData.categoryId) as string | null
	}
	if (updateData.occurredAt || updateData.occurred_at) {
		updatePayload.occurred_at = new Date(String(updateData.occurredAt || updateData.occurred_at)).toISOString()
	}

	const { data: updated, error: updateError } = await admin
		.from('transactions')
		.update(updatePayload)
		.eq('id', transactionId)
		.eq('organization_id', organizationId)
		.select()
		.maybeSingle()

	if (updateError) {
		return { error: updateError.message }
	}

	return { success: true, transaction: updated }
}

export async function deleteTransaction(
	organizationIdOrInput: string | { organizationId: string; transactionId?: string; id?: string },
	idArg?: string
) {
	let organizationId: string
	let transactionId: string

	if (typeof organizationIdOrInput === 'string') {
		organizationId = organizationIdOrInput
		transactionId = idArg ?? ''
	} else {
		organizationId = organizationIdOrInput.organizationId
		transactionId = String(organizationIdOrInput.transactionId || organizationIdOrInput.id || '')
	}

	if (!organizationId || !transactionId) {
		return { error: 'Organization ID and Transaction ID are required' }
	}

	await requireOrgMembership(organizationId)
	const admin = createAdminClient()

	// Verify transaction exists and belongs to organization
	const { data: existingTx, error: txError } = await admin
		.from('transactions')
		.select('id, organization_id')
		.eq('id', transactionId)
		.eq('organization_id', organizationId)
		.maybeSingle()

	if (txError || !existingTx) {
		return { error: 'Transaction not found or does not belong to this organization' }
	}

	const { error: deleteError } = await admin
		.from('transactions')
		.delete()
		.eq('id', transactionId)
		.eq('organization_id', organizationId)

	if (deleteError) {
		return { error: deleteError.message }
	}

	return { success: true }
}
