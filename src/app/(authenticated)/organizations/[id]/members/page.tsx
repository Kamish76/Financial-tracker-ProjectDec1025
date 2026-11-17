import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberList } from './member-list'
import type { MemberWithProfile } from '@/lib/types/member'
import { requireOrgMembership } from '@/lib/auth/guards'
import { isWalletOrganization } from '@/lib/wallet'

type PageProps = {
  params: Promise<{ id: string }>
}

type MemberRow = Omit<MemberWithProfile, 'profile'> & {
  profiles?: Array<MemberWithProfile['profile']>
}

const MEMBER_SELECT = `
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

function mapMemberProfiles(rows: MemberRow[] | null): MemberWithProfile[] {
  return (rows || []).map((member) => ({
    ...member,
    profile:
      member.profiles && member.profiles.length > 0
        ? member.profiles[0]
        : { id: member.user_id, full_name: null, avatar_url: null, created_at: new Date().toISOString() },
  }))
}

export default async function MembersPage({ params }: PageProps) {
  const { id } = await params
  const adminClient = createAdminClient()

  const [
    { user, membership },
    { data: organization, error: orgError },
    { data: activeMembers, error: activeMembersError },
  ] = await Promise.all([
    requireOrgMembership(id),
    adminClient
      .from('organizations')
      .select('id, name, description')
      .eq('id', id)
      .maybeSingle(),
    adminClient
      .from('organization_members')
      .select(MEMBER_SELECT)
      .eq('organization_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ])

  if (orgError || !organization) {
    redirect('/organizations')
  }

  const isWallet = isWalletOrganization(organization.description)
  if (isWallet) {
    redirect(`/organizations/${id}`)
  }

  if (activeMembersError) {
    console.error('Error fetching active members:', activeMembersError)
  }

  const transformedActiveMembers = mapMemberProfiles(activeMembers as MemberRow[] | null)

  // Fetch inactive members (only for admins/owners)
  let inactiveMembers: MemberWithProfile[] = []
  if (['owner', 'admin'].includes(membership.role)) {
    const { data: inactiveMembersData, error: inactiveMembersError } =
      await adminClient
        .from('organization_members')
        .select(MEMBER_SELECT)
        .eq('organization_id', id)
        .eq('is_active', false)
        .order('deactivated_at', { ascending: false })

    if (inactiveMembersError) {
      console.error('Error fetching inactive members:', inactiveMembersError)
    } else {
      inactiveMembers = mapMemberProfiles(inactiveMembersData as MemberRow[] | null)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
        <p className="text-muted-foreground">
          {isWallet
            ? 'Wallets do not support members or invite codes.'
            : 'Manage organization members and invite codes'}
        </p>
      </div>

      {isWallet ? null : (
      <MemberList
        organizationId={id}
        currentUserId={user.id}
        currentUserRole={membership.role}
        activeMembers={(transformedActiveMembers as MemberWithProfile[]) || []}
        inactiveMembers={inactiveMembers}
        organizationDescription={organization.description}
      />
      )}
    </div>
  )
}
