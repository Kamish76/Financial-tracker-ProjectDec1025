'use server'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function createOrganization(
  name: string,
  description: string | null
) {
  // Validate name
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { error: 'Organization name is required' }
  }
  if (trimmedName.length < 3) {
    return { error: 'Organization name must be at least 3 characters' }
  }
  if (trimmedName.length > 100) {
    return { error: 'Organization name must be less than 100 characters' }
  }

  // Use regular client to verify authentication
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[CREATE_ORG] Auth error:', authError?.message)
    return { error: 'You must be logged in to create an organization' }
  }

  console.log('[CREATE_ORG] Creating organization:', { name: trimmedName, userId: user.id })

  // Use admin client for database operations (bypasses RLS)
  // This is safe because we've already verified the user is authenticated above
  const adminClient = createAdminClient()

  // Ensure user has a profile (required for foreign key on organizations.owner_id)
  const { data: profile, error: profileSelectError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  console.log('[CREATE_ORG] Profile check:', { profile, error: profileSelectError?.message })

  if (!profile) {
    // Create profile if it doesn't exist
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
      })

    if (profileError) {
      console.error('[CREATE_ORG] Failed to create profile:', profileError.message)
      return { error: 'Failed to set up user profile. Please try again.' }
    }
    console.log('[CREATE_ORG] Profile created for user:', user.id)
  }

  // Insert the organization
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name: trimmedName,
      description: description?.trim() || null,
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (orgError) {
    console.error('[CREATE_ORG] Failed to create organization:', orgError.message)
    return { error: orgError.message }
  }

  console.log('[CREATE_ORG] Organization created:', org.id)

  // Add the creator as an owner in organization_members
  const { error: memberError } = await adminClient
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
      invited_by: null, // Creator, not invited
    })

  if (memberError) {
    console.error('[CREATE_ORG] Failed to add owner to members:', memberError.message)
    // Attempt to clean up the organization if member insert fails
    await adminClient.from('organizations').delete().eq('id', org.id)
    return { error: 'Failed to set up organization membership. Please try again.' }
  }

  console.log('[CREATE_ORG] Owner added to organization_members')

  // Redirect to organizations list
  redirect('/organizations')
}
