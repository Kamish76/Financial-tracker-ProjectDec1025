import { createAdminClient } from "@/lib/supabase/server"

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
  transactions: any[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Fetch transactions for an organization with filters and cursor-based pagination
 */
export async function fetchTransactionsWithFilters(
  organizationId: string,
  filters: TransactionFilters
): Promise<FetchTransactionsResult> {
  const admin = createAdminClient()
  const limit = filters.limit || 20

  let query = admin
    .from("transactions")
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
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })

  // Apply text search (description or category)
  if (filters.searchText) {
    const searchLower = `%${filters.searchText.toLowerCase()}%`
    query = query.or(
      `description.ilike.${searchLower},category.ilike.${searchLower}`
    )
  }

  // Filter by category (normalized name)
  if (filters.category) {
    query = query.eq("category_ref.normalized_name", filters.category)
  }

  // Filter by transaction type
  if (filters.type) {
    query = query.eq("type", filters.type)
  }

  // Filter by member (who the transaction is assigned to)
  if (filters.memberId) {
    query = query.eq("funded_by_user_id", filters.memberId)
  }

  // Filter by funded type
  if (filters.fundedByType) {
    query = query.eq("funded_by_type", filters.fundedByType)
  }

  // Filter by date range
  if (filters.startDate) {
    query = query.gte("occurred_at", new Date(filters.startDate).toISOString())
  }
  if (filters.endDate) {
    query = query.lte("occurred_at", new Date(filters.endDate).toISOString())
  }

  // Cursor-based pagination
  if (filters.cursor) {
    query = query.lt("occurred_at", filters.cursor)
  }

  // Fetch one extra to determine if there are more results
  const { data, error } = await query.limit(limit + 1)

  if (error) {
    console.error("[fetchTransactionsWithFilters] Error:", error.message)
    return { transactions: [], nextCursor: null, hasMore: false }
  }

  const transactions = data || []
  let hasMore = false
  let nextCursor = null

  if (transactions.length > limit) {
    hasMore = true
    transactions.pop() // Remove the extra item
    nextCursor = transactions[transactions.length - 1]?.occurred_at || null
  }

  return { transactions, nextCursor, hasMore }
}

/**
 * Fetch all unique members for an organization (for filtering)
 */
export async function fetchOrganizationMembers(organizationId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("organization_members")
    .select(
      `
      user_id,
      role,
      user:profiles(id, full_name, email:auth.email)
      `
    )
    .eq("organization_id", organizationId)

  if (error) {
    console.error("[fetchOrganizationMembers] Error:", error.message)
    return []
  }

  return (data || []).map((m: any) => ({
    id: m.user_id,
    name: m.user?.full_name || m.user?.email || "Unknown",
    role: m.role,
  }))
}

/**
 * Fetch all categories used in an organization
 */
export async function fetchOrganizationCategories(organizationId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("transaction_categories")
    .select("id, normalized_name, aliases")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[fetchOrganizationCategories] Error:", error.message)
    return []
  }

  return data || []
}
