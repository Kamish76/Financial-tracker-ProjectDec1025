"use server"

import { createAdminClient } from "./supabase/server"
import { requireOrgMembership } from "@/lib/auth/guards"
import { revalidatePath } from "next/cache"

import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  type CategoryItem,
} from "./category-constants"

export type { CategoryItem }

function formatCategoryName(normalized: string): string {
  if (!normalized) return ''
  return normalized
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

function getCategoryType(
  normalizedName: string,
  aliases?: string[] | null
): 'income' | 'expense' {
  if (aliases && aliases.includes('type:income')) {
    return 'income'
  }
  if (aliases && aliases.includes('type:expense')) {
    return 'expense'
  }
  const lower = (normalizedName || '').toLowerCase()
  if (DEFAULT_INCOME_CATEGORIES.some((c) => c.toLowerCase() === lower)) {
    return 'income'
  }
  return 'expense'
}

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
export async function getOrCreateCategory(
  organizationId: string,
  categoryName: string,
  type: 'income' | 'expense' = 'expense'
) {
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

  if (error || !data) {
    if (error) console.error("[getOrCreateCategory] Error:", error.message)
    return null
  }

  const categoryId = data as string

  // Ensure the alias tag ('type:income' or 'type:expense') is attached to this category
  try {
    const { data: existing } = await admin
      .from("transaction_categories")
      .select("aliases")
      .eq("id", categoryId)
      .single()

    if (existing) {
      const typeTag = type === 'income' ? 'type:income' : 'type:expense'
      const currentAliases: string[] = existing.aliases || []
      if (!currentAliases.includes(typeTag)) {
        await admin
          .from("transaction_categories")
          .update({
            aliases: [...currentAliases, typeTag],
          })
          .eq("id", categoryId)
      }
    }
  } catch (err) {
    // Non-fatal if alias update fails
  }

  return categoryId
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

/**
 * Fetch all categories for an organization grouped by income/expense,
 * automatically seeding the 5 core default income and expense categories if none exist.
 */
export async function getOrganizationCategoriesByType(organizationId: string): Promise<{
  income: CategoryItem[]
  expense: CategoryItem[]
}> {
  const admin = createAdminClient()

  let { data, error } = await admin
    .from('transaction_categories')
    .select('id, normalized_name, aliases, is_custom')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getOrganizationCategoriesByType] Error:', error.message)
    return { income: [], expense: [] }
  }

  // If no categories exist for this organization yet, seed the default 5 income + 5 expense categories
  if (!data || data.length === 0) {
    const toInsert = [
      ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
        organization_id: organizationId,
        normalized_name: name.toLowerCase(),
        aliases: ['type:income'],
        is_custom: false,
      })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
        organization_id: organizationId,
        normalized_name: name.toLowerCase(),
        aliases: ['type:expense'],
        is_custom: false,
      })),
    ]

    const { data: seeded, error: seedError } = await admin
      .from('transaction_categories')
      .insert(toInsert)
      .select('id, normalized_name, aliases, is_custom')

    if (!seedError && seeded) {
      data = seeded
    }
  }

  const income: CategoryItem[] = []
  const expense: CategoryItem[] = []

  for (const row of data || []) {
    const type = getCategoryType(row.normalized_name, row.aliases)
    const item: CategoryItem = {
      id: row.id,
      normalized_name: row.normalized_name,
      display_name: formatCategoryName(row.normalized_name),
      aliases: row.aliases || [],
      is_custom: row.is_custom,
      type,
    }
    if (type === 'income') {
      income.push(item)
    } else {
      expense.push(item)
    }
  }

  return { income, expense }
}

/**
 * Add a new category for an organization with specified type
 */
export async function addOrganizationCategory(
  organizationId: string,
  name: string,
  type: 'income' | 'expense'
): Promise<{ success?: boolean; error?: string; category?: CategoryItem }> {
  try {
    await requireOrgMembership(organizationId)
    const admin = createAdminClient()

    if (!name?.trim()) {
      return { error: 'Category name is required.' }
    }

    const normalized = name.trim().toLowerCase()
    const aliases = [type === 'income' ? 'type:income' : 'type:expense']

    const { data, error } = await admin
      .from('transaction_categories')
      .insert({
        organization_id: organizationId,
        normalized_name: normalized,
        aliases,
        is_custom: true,
      })
      .select('id, normalized_name, aliases, is_custom')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'A category with this name already exists.' }
      }
      return { error: error.message }
    }

    revalidatePath(`/organizations/${organizationId}/settings`)

    return {
      success: true,
      category: {
        id: data.id,
        normalized_name: data.normalized_name,
        display_name: formatCategoryName(data.normalized_name),
        aliases: data.aliases || [],
        is_custom: data.is_custom,
        type,
      },
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to add category' }
  }
}

/**
 * Update a category's name
 */
export async function updateOrganizationCategory(
  organizationId: string,
  categoryId: string,
  newName: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireOrgMembership(organizationId)
    const admin = createAdminClient()

    if (!newName?.trim()) {
      return { error: 'Category name cannot be empty.' }
    }

    const { error } = await admin
      .from('transaction_categories')
      .update({
        normalized_name: newName.trim().toLowerCase(),
      })
      .eq('id', categoryId)
      .eq('organization_id', organizationId)

    if (error) {
      if (error.code === '23505') {
        return { error: 'A category with this name already exists.' }
      }
      return { error: error.message }
    }

    revalidatePath(`/organizations/${organizationId}/settings`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update category' }
  }
}

/**
 * Delete a category
 */
export async function deleteOrganizationCategory(
  organizationId: string,
  categoryId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireOrgMembership(organizationId)
    const admin = createAdminClient()

    const { error } = await admin
      .from('transaction_categories')
      .delete()
      .eq('id', categoryId)
      .eq('organization_id', organizationId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/organizations/${organizationId}/settings`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete category' }
  }
}

