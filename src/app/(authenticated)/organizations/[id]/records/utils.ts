import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'

export interface TransactionFilters {
  searchText?: string
  category?: string
  type?: string
  memberId?: string
  fundedByType?: 'business' | 'personal'
  startDate?: string
  endDate?: string
  cursor?: string
  limit?: number
}

export interface FetchTransactionsResult {
  transactions: TransactionRecord[]
  nextCursor: string | null
  hasMore: boolean
}

export interface TransactionRecord {
  id: string
  type: string
  amount: number
  description: string | null
  category: string | null
  category_id: string | null
  funded_by_type: 'business' | 'personal' | null
  funded_by_user_id: string | null
  user_id: string
  occurred_at: string
  created_at: string
  updated_at: string | null
  funded_by_user?: {
    id: string
    full_name: string | null
    email: string | null
  } | null
  recorder?: {
    id: string
    full_name: string | null
    email: string | null
  } | null
  category_ref?: {
    id: string
    normalized_name: string
    aliases: string[] | null
  } | null
}

type MemberRecord = {
  user_id: string
  role: string
  user?: {
    id: string
    full_name: string | null
    email: string | null
  } | null
}

/**
 * Fetch transactions for an organization with filters and cursor-based pagination.
 * Uses nested joins to avoid N+1 profile and category lookups.
 */
export async function fetchTransactionsWithFilters(
  organizationId: string,
  filters: TransactionFilters
): Promise<FetchTransactionsResult> {
  const admin = createAdminClient()
  const limit = filters.limit || 20

  let query = admin
    .from('transactions')
    .select(
      `
      id,
      type,
      amount,
      description,
      category,
      category_id,
      funded_by_type,
      funded_by_user_id,
      user_id,
      occurred_at,
      created_at,
      updated_at,
      funded_by_user:profiles!funded_by_user_id(id, full_name, email:auth.email),
      recorder:profiles!user_id(id, full_name, email:auth.email),
      category_ref:transaction_categories!category_id(id, normalized_name, aliases)
      `
    )
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })

  if (filters.searchText) {
    const searchLower = `%${filters.searchText.toLowerCase()}%`
    query = query.or(`description.ilike.${searchLower},category.ilike.${searchLower}`)
  }

  if (filters.category) {
    query = query.eq('category_ref.normalized_name', filters.category)
  }

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.memberId) {
    query = query.eq('funded_by_user_id', filters.memberId)
  }

  if (filters.fundedByType) {
    query = query.eq('funded_by_type', filters.fundedByType)
  }

  if (filters.startDate) {
    query = query.gte('occurred_at', new Date(filters.startDate).toISOString())
  }
  if (filters.endDate) {
    query = query.lte('occurred_at', new Date(filters.endDate).toISOString())
  }

  if (filters.cursor) {
    query = query.lt('occurred_at', filters.cursor)
  }

  const { data, error } = await query.limit(limit + 1)

  if (error) {
    console.error('[fetchTransactionsWithFilters] Error:', error.message)
    return { transactions: [], nextCursor: null, hasMore: false }
  }

  const transactions = (data || []) as unknown as TransactionRecord[]
  let hasMore = false
  let nextCursor: string | null = null

  if (transactions.length > limit) {
    hasMore = true
    transactions.pop()
    nextCursor = transactions[transactions.length - 1]?.occurred_at || null
  }

  return { transactions, nextCursor, hasMore }
}

/**
 * Fetch all unique members for an organization (for filtering).
 */
export async function fetchOrganizationMembers(organizationId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('organization_members')
    .select(
      `
      user_id,
      role,
      user:profiles(id, full_name, email:auth.email)
      `
    )
    .eq('organization_id', organizationId)

  if (error) {
    console.error('[fetchOrganizationMembers] Error:', error.message)
    return []
  }

  return ((data || []) as unknown as MemberRecord[]).map((member) => ({
    id: member.user_id,
    name: member.user?.full_name || member.user?.email || 'Unknown',
    role: member.role,
  }))
}

/**
 * Fetch all categories used in an organization.
 */
export async function fetchOrganizationCategories(organizationId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('transaction_categories')
    .select('id, normalized_name, aliases')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchOrganizationCategories] Error:', error.message)
    return []
  }

  return data || []
}
