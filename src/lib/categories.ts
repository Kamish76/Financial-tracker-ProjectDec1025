"use server"

import { createAdminClient } from "./supabase/server"

/**
 * Fetch top N categories for an organization, sorted by usage frequency
 */
export async function getTopCategories(organizationId: string, limit: number = 10) {
  const admin = createAdminClient()
  
  const { data, error } = await admin
    .from("transaction_categories")
    .select("id, normalized_name, aliases")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[getTopCategories] Error fetching categories:", error.message)
    return []
  }

  return data || []
}

/**
 * Get or create a normalized category with fuzzy matching
 * Returns the category ID to use for the transaction
 */
export async function getOrCreateCategory(organizationId: string, categoryName: string) {
  const admin = createAdminClient()

  if (!categoryName?.trim()) {
    return null
  }

  // Call the Supabase function for fuzzy matching
  const { data, error } = await admin.rpc("get_or_create_category", {
    p_org_id: organizationId,
    p_input_name: categoryName,
    p_max_distance: 2, // Levenshtein distance threshold
  })

  if (error) {
    console.error("[getOrCreateCategory] Error:", error.message)
    return null
  }

  return data as string | null
}

/**
 * Search categories by partial name with fuzzy suggestions
 */
export async function searchCategories(
  organizationId: string,
  searchText: string
) {
  const admin = createAdminClient()

  if (!searchText?.trim()) {
    // Return top categories if no search text
    return getTopCategories(organizationId, 15)
  }

  const normalized = searchText.toLowerCase().trim()

  // Exact prefix match first
  const { data: exactMatches, error: exactError } = await admin
    .from("transaction_categories")
    .select("id, normalized_name, aliases")
    .eq("organization_id", organizationId)
    .ilike("normalized_name", `${normalized}%`)
    .limit(10)

  if (exactError) {
    console.error("[searchCategories] Error:", exactError.message)
    return []
  }

  return exactMatches || []
}
