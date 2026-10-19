import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { OrganizationSettings } from './organization-settings'
import { requireOrgMembership } from '@/lib/auth/guards'
import { isWalletOrganization } from '@/lib/wallet'

type SettingsPageProps = {
	params: Promise<{
		id: string
	}>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const { id } = await params
	const adminClient = createAdminClient()
	const { user, membership: effectiveMembership } = await requireOrgMembership(id)

	// Fetch organization details
	const { data: organization } = await adminClient
		.from('organizations')
		.select('id, name, description, owner_id, created_at, currency')
		.eq('id', id)
		.maybeSingle()

	if (!organization) {
		notFound()
	}

	// Get active member count
	const { count: memberCount } = await adminClient
		.from('organization_members')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', id)
		.eq('is_active', true)

	// Fetch all active members for transfer ownership dropdown & transaction sheets
	const { data: members, error: membersError } = await adminClient
		.from('organization_members')
		.select('user_id, role, created_at')
		.eq('organization_id', id)
		.eq('is_active', true)
		.order('created_at', { ascending: true })

	if (membersError) {
		console.error('[SETTINGS_PAGE] Members query error:', membersError)
	}

	// Fetch profiles and emails for all active members
	let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {}
	if (members && members.length > 0) {
		const userIds = (members as Array<{ user_id: string }>).map((m) => m.user_id)
		const [{ data: profiles }, { data: emailRows, error: rpcError }] = await Promise.all([
			adminClient
				.from('profiles')
				.select('id, full_name, avatar_url')
				.in('id', userIds),
			adminClient.rpc('get_org_member_emails', { p_org_id: id }),
		])

		if (profiles) {
			profilesMap = profiles.reduce(
				(acc, p) => ({
					...acc,
					[p.id]: { full_name: p.full_name, email: null },
				}),
				{} as Record<string, { full_name: string | null; email: string | null }>
			)
		}

		if (!rpcError && Array.isArray(emailRows)) {
			for (const row of emailRows as Array<{ user_id: string; email: string | null }>) {
				if (row.user_id && row.email) {
					profilesMap[row.user_id] = {
						full_name: profilesMap[row.user_id]?.full_name || null,
						email: row.email,
					}
				}
			}
		}
	}

	// Get owner info
	const { data: owner } = await adminClient
		.from('profiles')
		.select('full_name, avatar_url')
		.eq('id', organization.owner_id)
		.maybeSingle()

	const organizationWithRole = {
		...organization,
		user_role: effectiveMembership.role,
		member_count: memberCount || 0,
		is_wallet: isWalletOrganization(organization.description),
	}

	const membersFormatted = (members || []).map((m) => {
		const profile = profilesMap[m.user_id] || { full_name: null, email: null }
		return {
			user_id: m.user_id,
			role: m.role,
			joined_at: m.created_at,
			user: {
				id: m.user_id,
				name: profile?.full_name || 'Unknown',
				email: profile?.email || '',
			},
		}
	})

	// Fetch initial transactions (only if user is owner)
	let initialTransactions: Array<{
		id: string
		type: string
		amount: number
		category: string | null
		description: string | null
		occurred_at: string
		assigned_to_user_id: string | null
		assigned_to_name: string | null
		assigned_to_email: string | null
	}> = []

	if (effectiveMembership.role === 'owner') {
		// Fetch initial transactions with cleaner approach
		const { data: initialTxData, error: initialTxError } = await adminClient
			.from('transactions')
			.select('*')
			.eq('organization_id', id)
			.eq('is_initial', true)
			.order('occurred_at', { ascending: false })

		if (initialTxError) {
			console.error('[SETTINGS_PAGE] Error fetching initial transactions:', initialTxError)
		}

		// If we have transactions, fetch the associated profile information
		if (initialTxData && initialTxData.length > 0) {
			// Get unique user IDs from funded_by_user_id
			const userIds = Array.from(
				new Set(
					(initialTxData as Array<{ funded_by_user_id: string | null }>)
						.map((tx) => tx.funded_by_user_id)
						.filter(Boolean)
				)
			)

			let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {}
			if (userIds.length > 0) {
				const { data: profiles } = await adminClient
					.from('profiles')
					.select('id, full_name, avatar_url')
					.in('id', userIds)

				profilesMap = profiles?.reduce(
					(acc, p) => ({
						...acc,
						[p.id]: { full_name: p.full_name, email: null },
					}),
					{}
				) || {}
			}

			initialTransactions = (initialTxData as Array<{
				id: string
				type: string
				amount: number
				category: string | null
				description: string | null
				occurred_at: string
				funded_by_user_id: string | null
			}>).map((tx) => {
				const profile =
					tx.funded_by_user_id && profilesMap[tx.funded_by_user_id]
						? profilesMap[tx.funded_by_user_id]
						: null
				return {
					id: tx.id,
					type: tx.type,
					amount: tx.amount,
					category: tx.category,
					description: tx.description,
					occurred_at: tx.occurred_at,
					assigned_to_user_id: tx.funded_by_user_id,
					assigned_to_name: profile?.full_name || null,
					assigned_to_email: profile?.email || null,
				}
			})
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<OrganizationSettings
				organization={organizationWithRole}
				members={membersFormatted}
				ownerName={owner?.full_name || 'Unknown'}
				initialTransactions={initialTransactions}
				currentUserEmail={user.email}
				currentUserName={user.user_metadata?.full_name || null}
				currentUserId={user.id}
			/>
		</div>
	)
}
