'use server'

import {
	fetchOrganizationCategories as fetchOrganizationCategoriesImpl,
	fetchOrganizationMembers as fetchOrganizationMembersImpl,
	fetchTransactionsWithFilters as fetchTransactionsWithFiltersImpl,
} from './utils'
import type { FetchTransactionsResult, TransactionFilters } from './utils'

export type { FetchTransactionsResult, TransactionFilters }

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
