'use server'

import {
	fetchOrganizationCategories as fetchOrganizationCategoriesImpl,
	fetchOrganizationMembers as fetchOrganizationMembersImpl,
	fetchTransactionsWithFilters as fetchTransactionsWithFiltersImpl,
} from './utils'
import type { FetchTransactionsResult, TransactionFilters } from './utils'

export async function fetchTransactionsWithFilters(
	organizationId: string,
	filters: TransactionFilters
): Promise<FetchTransactionsResult> {
	return fetchTransactionsWithFiltersImpl(organizationId, filters)
}

export async function fetchOrganizationMembers(organizationId: string) {
	return fetchOrganizationMembersImpl(organizationId)
}

export async function fetchOrganizationCategories(organizationId: string) {
	return fetchOrganizationCategoriesImpl(organizationId)
}

import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import { createAdminClient } from '@/lib/supabase/server'
import { isWalletOrganization } from '@/lib/wallet'

export async function fetchWalletSummary(organizationId: string) {
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

