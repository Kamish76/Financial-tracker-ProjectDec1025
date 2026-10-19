import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { calculateFilteredStats, type FilteredStats } from '@/lib/finance-client'

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
  accountId?: string
}

export interface FetchTransactionsResult {
  transactions: TransactionRecord[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Sanitizes input strings before interpolating into PostgREST `.or()` or filter strings.
 * Strips characters that break PostgREST filter syntax: (, ), ,, ., ", and backslashes.
 */
export function sanitizePostgrestFilter(term: string): string {
  if (!term) return ''
  return term.replace(/[(),."\\]/g, '').trim()
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
  is_initial?: boolean | null
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
  account_id?: string | null
  transfer_to_account_id?: string | null
  account_ref?: {
    id: string
    name: string
  } | null
  transfer_to_account_ref?: {
    id: string
    name: string
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
      is_initial,
      account_id,
      transfer_to_account_id,
      occurred_at,
      created_at,
      updated_at,
      funded_by_user:profiles!funded_by_user_id(id, full_name, avatar_url),
      recorder:profiles!user_id(id, full_name, avatar_url),
      category_ref:transaction_categories!category_id(id, normalized_name, aliases),
      account_ref:wallet_accounts!account_id(id, name),
      transfer_to_account_ref:wallet_accounts!transfer_to_account_id(id, name)
      `
    )
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters.searchText) {
    const sanitizedSearch = sanitizePostgrestFilter(filters.searchText)
    if (sanitizedSearch) {
      const searchLower = `%${sanitizedSearch.toLowerCase()}%`
      query = query.or(`description.ilike.${searchLower},category.ilike.${searchLower}`)
    }
  }

  if (filters.category && filters.category !== 'all') {
    const sanitizedCategory = sanitizePostgrestFilter(filters.category)
    if (sanitizedCategory) {
      query = query.or(`category.eq.${sanitizedCategory},category_ref.normalized_name.eq.${sanitizedCategory}`)
    }
  }

  if (filters.type) {
    if (filters.type === 'expense') {
      query = query.or('type.eq.expense_personal,type.eq.expense_business,type.eq.expense')
    } else {
      query = query.eq('type', filters.type)
    }
  }

  if (filters.accountId && filters.accountId !== 'all') {
    const sanitizedAccountId = sanitizePostgrestFilter(filters.accountId)
    if (sanitizedAccountId) {
      query = query.or(`account_id.eq.${sanitizedAccountId},transfer_to_account_id.eq.${sanitizedAccountId}`)
    }
  }

  if (filters.memberId && filters.memberId !== 'all') {
    const sanitizedMemberId = sanitizePostgrestFilter(filters.memberId)
    if (sanitizedMemberId) {
      query = query.or(`funded_by_user_id.eq.${sanitizedMemberId},user_id.eq.${sanitizedMemberId}`)
    }
  }

  if (filters.fundedByType) {
    query = query.eq('funded_by_type', filters.fundedByType)
  }

  if (filters.startDate) {
    query = query.gte('occurred_at', new Date(filters.startDate).toISOString())
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('occurred_at', end.toISOString())
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
 * Safely resolves organization owner, active members, and historical transaction funders
 * without relying on ambiguous PostgREST nested profile joins.
 */
export async function fetchOrganizationMembers(organizationId: string) {
  const admin = createAdminClient()

  try {
    // 1. Fetch organization owner
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .maybeSingle()

    if (orgError) {
      console.error('[fetchOrganizationMembers] Error fetching organization:', orgError.message)
    }

    // 2. Fetch organization members
    const { data: members, error: membersError } = await admin
      .from('organization_members')
      .select('user_id, role, is_active')
      .eq('organization_id', organizationId)

    if (membersError) {
      console.error('[fetchOrganizationMembers] Error fetching organization_members:', membersError.message)
    }

    // 3. Fetch distinct funded_by_user_id and user_id from transactions to ensure any past contributor is included
    const { data: txUsers, error: txError } = await admin
      .from('transactions')
      .select('funded_by_user_id, user_id')
      .eq('organization_id', organizationId)

    if (txError) {
      console.error('[fetchOrganizationMembers] Error fetching transaction users:', txError.message)
    }

    // 4. Map user IDs to their respective roles
    const userRoleMap = new Map<string, string>()

    if (org?.owner_id) {
      userRoleMap.set(org.owner_id, 'owner')
    }

    for (const m of members || []) {
      if (m.is_active !== false) {
        if (!userRoleMap.has(m.user_id) || m.role === 'owner') {
          userRoleMap.set(m.user_id, m.role || 'member')
        }
      }
    }

    for (const tx of txUsers || []) {
      if (tx.funded_by_user_id && !userRoleMap.has(tx.funded_by_user_id)) {
        userRoleMap.set(tx.funded_by_user_id, 'member')
      }
      if (tx.user_id && !userRoleMap.has(tx.user_id)) {
        userRoleMap.set(tx.user_id, 'member')
      }
    }

    const userIds = Array.from(userRoleMap.keys())
    if (userIds.length === 0) {
      return []
    }

    // 5. Fetch profiles by ID
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('[fetchOrganizationMembers] Error fetching profiles:', profilesError.message)
    }

    const profileMap = new Map<string, { full_name: string | null }>()
    for (const p of profiles || []) {
      profileMap.set(p.id, { full_name: p.full_name })
    }

    // 6. Look up auth email fallback for any user missing a profile full_name
    const missingNameIds = userIds.filter((id) => !profileMap.get(id)?.full_name)
    const emailMap = new Map<string, string>()

    if (missingNameIds.length > 0) {
      try {
        const { data: emailRows } = await admin.rpc('get_org_member_emails', { p_org_id: organizationId })
        if (Array.isArray(emailRows)) {
          for (const row of emailRows as Array<{ user_id: string; email: string }>) {
            if (missingNameIds.includes(row.user_id) && row.email) {
              emailMap.set(row.user_id, row.email)
            }
          }
        }
      } catch (e) {
        console.error('[fetchOrganizationMembers] Auth user list fallback failed:', e)
      }
    }

    // 7. Format members
    const memberList = userIds.map((userId) => {
      const role = userRoleMap.get(userId) || 'member'
      const fullName = profileMap.get(userId)?.full_name
      const email = emailMap.get(userId)
      const name = fullName || email || (role === 'owner' ? 'Owner' : `Member (${userId.slice(0, 6)})`)

      return {
        id: userId,
        name,
        role,
      }
    })

    // Sort: owner first, then alphabetically
    return memberList.sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1
      if (b.role === 'owner' && a.role !== 'owner') return 1
      return a.name.localeCompare(b.name)
    })
  } catch (err) {
    console.error('[fetchOrganizationMembers] Unexpected error:', err)
    return []
  }
}

/**
 * Fetch all categories used in an organization.
 */
export async function fetchOrganizationCategories(organizationId: string) {
  const admin = createAdminClient()

  try {
    const { data: dbCategories, error: catError } = await admin
      .from('transaction_categories')
      .select('id, normalized_name, aliases')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (catError) {
      console.error('[fetchOrganizationCategories] Error:', catError.message)
    }

    // Also fetch categories directly from transactions table in case older transactions have uncatalogued categories
    const { data: txCategories } = await admin
      .from('transactions')
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)

    const categoryMap = new Map<string, { id: string; normalized_name: string; aliases?: string[] }>()

    for (const cat of dbCategories || []) {
      if (cat.normalized_name) {
        categoryMap.set(cat.normalized_name.toLowerCase(), {
          id: cat.id,
          normalized_name: cat.normalized_name,
          aliases: cat.aliases || undefined,
        })
      }
    }

    for (const tx of txCategories || []) {
      if (tx.category && !categoryMap.has(tx.category.toLowerCase())) {
        categoryMap.set(tx.category.toLowerCase(), {
          id: tx.category,
          normalized_name: tx.category,
        })
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.normalized_name.localeCompare(b.normalized_name)
    )
  } catch (err) {
    console.error('[fetchOrganizationCategories] Unexpected error:', err)
    return []
  }
}

/**
 * Fetch aggregates (total income, total expenses, net balance, transaction count, breakdown)
 * across ALL transactions matching the filters in the database, without pagination.
 *
 * Performance optimization:
 * - Only queries `type, amount` (and foreign category normalized name if filtering by category).
 * - Avoids heavy joins on profiles and wallet accounts.
 * - Decouples summary card accuracy from table pagination / lazy loading.
 */
export async function fetchTransactionAggregates(
  organizationId: string,
  filters: TransactionFilters
): Promise<FilteredStats> {
  const admin = createAdminClient()

  const selectColumns = filters.category
    ? 'type, amount, category, category_ref:transaction_categories!category_id(normalized_name)'
    : 'type, amount'

  let query = admin
    .from('transactions')
    .select(selectColumns)
    .eq('organization_id', organizationId)

  if (filters.searchText) {
    const sanitizedSearch = sanitizePostgrestFilter(filters.searchText)
    if (sanitizedSearch) {
      const searchLower = `%${sanitizedSearch.toLowerCase()}%`
      query = query.or(`description.ilike.${searchLower},category.ilike.${searchLower}`)
    }
  }

  if (filters.category && filters.category !== 'all') {
    const sanitizedCategory = sanitizePostgrestFilter(filters.category)
    if (sanitizedCategory) {
      query = query.or(`category.eq.${sanitizedCategory},category_ref.normalized_name.eq.${sanitizedCategory}`)
    }
  }

  if (filters.type) {
    if (filters.type === 'expense') {
      query = query.or('type.eq.expense_personal,type.eq.expense_business,type.eq.expense')
    } else {
      query = query.eq('type', filters.type)
    }
  }

  if (filters.accountId && filters.accountId !== 'all') {
    const sanitizedAccountId = sanitizePostgrestFilter(filters.accountId)
    if (sanitizedAccountId) {
      query = query.or(`account_id.eq.${sanitizedAccountId},transfer_to_account_id.eq.${sanitizedAccountId}`)
    }
  }

  if (filters.memberId && filters.memberId !== 'all') {
    const sanitizedMemberId = sanitizePostgrestFilter(filters.memberId)
    if (sanitizedMemberId) {
      query = query.or(`funded_by_user_id.eq.${sanitizedMemberId},user_id.eq.${sanitizedMemberId}`)
    }
  }

  if (filters.fundedByType) {
    query = query.eq('funded_by_type', filters.fundedByType)
  }

  if (filters.startDate) {
    query = query.gte('occurred_at', new Date(filters.startDate).toISOString())
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('occurred_at', end.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('[fetchTransactionAggregates] Error:', error.message)
    return calculateFilteredStats([])
  }

  return calculateFilteredStats((data || []) as unknown as { type?: string; amount?: number }[])
}
