"use server"

import { createAdminClient, createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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

export async function joinOrganization(organizationId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in to join an organization" }
  }

  console.log('[JOIN_ORG] User', user.id, 'joining organization', organizationId)

  // Use admin client to bypass RLS for adding member
  const adminClient = createAdminClient()

  // First, verify the organization exists
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    console.error('[JOIN_ORG] Organization not found:', organizationId)
    return { error: "Organization not found" }
  }

  // Check if user is already a member
  const { data: existingMember, error: checkError } = await adminClient
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!checkError && existingMember) {
    console.log('[JOIN_ORG] User already a member of organization')
    return { error: "You are already a member of this organization" }
  }

  // Add user as member
  const { error: joinError } = await adminClient
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      role: 'member',
    })

  if (joinError) {
    console.error('[JOIN_ORG] Error joining organization:', joinError.message)
    return { error: joinError.message || "Failed to join organization" }
  }

  console.log('[JOIN_ORG] Successfully joined organization:', organizationId)
  
  // Redirect to the organization page
  redirect(`/organizations/${organizationId}`)
}


