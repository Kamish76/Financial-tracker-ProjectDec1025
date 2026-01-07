"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function searchOrganizations(query: string) {
  if (!query.trim()) {
    return { data: [], error: null }
  }

  console.log('[SEARCH_ORGS] Searching for:', query)

  const adminClient = createAdminClient()

  // Search organizations by name (accessible to all authenticated users who can join)
  const { data, error } = await adminClient
    .from('organizations')
    .select('id, name, description')
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) {
    console.error('[SEARCH_ORGS] Error searching organizations:', error.message, error)
    return { data: [], error: error.message }
  }

  console.log('[SEARCH_ORGS] Found', (data || []).length, 'organizations')
  return { data: data || [], error: null }
}

