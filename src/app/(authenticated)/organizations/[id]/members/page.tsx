import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberList } from './member-list'
import type { MemberWithProfile } from '@/lib/types/member'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MembersPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const adminClient = createAdminClient()

  // Check if user is a member of this organization
  const { data: membership, error: membershipError } = await adminClient
    .from('organization_members')
    .select('role, is_active')
    .eq('organization_id', id)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership || !membership.is_active) {
    redirect('/organizations')
  }

  // Fetch organization details
  const { data: organization, error: orgError } = await adminClient
    .from('organizations')
    .select('id, name, description')
    .eq('id', id)
    .single()

  if (orgError || !organization) {
    redirect('/organizations')
  }

  // Fetch all active members with profiles
  const { data: activeMembers, error: activeMembersError } = await adminClient
    .from('organization_members')
    .select(
      `
      organization_id,
      user_id,
      role,
      invited_by,
      created_at,
      is_active,
      deactivated_at,
      profiles (
        id,
        full_name,
        avatar_url,
        created_at
      )
    `
    )
    .eq('organization_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (activeMembersError) {
    console.error('Error fetching active members:', activeMembersError)
  }

  // Transform activeMembers to handle profile array (Supabase returns as array)
  const transformedActiveMembers = (activeMembers || []).map((member: any) => ({
    ...member,
    profile: member.profiles && member.profiles.length > 0 ? member.profiles[0] : { id: member.user_id, full_name: null, avatar_url: null, created_at: new Date().toISOString() }
  }))

  // Fetch inactive members (only for admins/owners)
  let inactiveMembers: MemberWithProfile[] = []
  if (['owner', 'admin'].includes(membership.role)) {
    const { data: inactiveMembersData, error: inactiveMembersError } =
      await adminClient
        .from('organization_members')
        .select(
          `
        organization_id,
        user_id,
        role,
        invited_by,
        created_at,
        is_active,
        deactivated_at,
        profiles (
          id,
          full_name,
          avatar_url,
          created_at
        )
      `
        )
        .eq('organization_id', id)
        .eq('is_active', false)
        .order('deactivated_at', { ascending: false })

    if (inactiveMembersError) {
      console.error('Error fetching inactive members:', inactiveMembersError)
    } else {
      // Transform inactiveMembers to handle profile array (Supabase returns as array)
      inactiveMembers = (inactiveMembersData || []).map((member: any) => ({
        ...member,
        profile: member.profiles && member.profiles.length > 0 ? member.profiles[0] : { id: member.user_id, full_name: null, avatar_url: null, created_at: new Date().toISOString() }
      }))
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
        <p className="text-muted-foreground">Manage organization members and invite codes</p>
      </div>

      <MemberList
        organizationId={id}
        currentUserId={user.id}
        currentUserRole={membership.role}
        activeMembers={(transformedActiveMembers as MemberWithProfile[]) || []}
        inactiveMembers={inactiveMembers}
      />
    </div>
  )
}
