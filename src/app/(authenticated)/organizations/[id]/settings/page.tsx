import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { OrganizationSettings } from './organization-settings'

type SettingsPageProps = {
	params: Promise<{
		id: string
	}>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const { id } = await params
	const supabase = await createClient()
	const adminClient = createAdminClient()

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth')
	}

	// Check if user is a member of this organization
	const { data: membership } = await supabase
		.from('organization_members')
		.select('organization_id, role')
		.eq('organization_id', id)
		.eq('user_id', user.id)
		.maybeSingle()

	const { data: membershipAdmin } = await adminClient
		.from('organization_members')
		.select('organization_id, role, user_id')
		.eq('organization_id', id)
		.eq('user_id', user.id)
		.maybeSingle()

	const effectiveMembership = membership || membershipAdmin

	if (!effectiveMembership) {
		redirect('/organizations')
	}

	// Fetch organization details
	const { data: organization } = await adminClient
		.from('organizations')
		.select('id, name, description, owner_id, created_at')
		.eq('id', id)
		.single()

	if (!organization) {
		notFound()
	}

	// Get member count
	const { count: memberCount } = await adminClient
		.from('organization_members')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', id)

	// Fetch all members for transfer ownership dropdown
	const { data: members, error: membersError } = await adminClient
		.from('organization_members')
		.select('user_id, role, created_at')
		.eq('organization_id', id)
		.order('created_at', { ascending: true })

	if (membersError) {
		console.error('[SETTINGS_PAGE] Members query error:', membersError)
	}

	console.log('[SETTINGS_PAGE] Members fetched:', members?.length ?? 0, 'error:', membersError?.message)

	// Fetch profiles separately for all members
	let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {}
	if (members && members.length > 0) {
		const userIds = (members as Array<{ user_id: string }>).map((m) => m.user_id)
		const { data: profiles } = await adminClient
			.from('profiles')
			.select('id, full_name, email')
			.in('id', userIds)

		if (profiles) {
			profilesMap = profiles.reduce(
				(acc, p) => ({
					...acc,
					[p.id]: { full_name: p.full_name, email: p.email },
				}),
				{}
			)
		}

		// Fallback: if any member has no email in profiles, try to fetch from auth
		const missingEmails = userIds.filter((uid) => !profilesMap[uid]?.email)
		if (missingEmails.length > 0) {
			try {
				const { data, error } = await adminClient.auth.admin.listUsers()
				if (!error && data?.users) {
					for (const authUser of data.users) {
						if (missingEmails.includes(authUser.id) && authUser.email) {
							profilesMap[authUser.id] = {
								full_name: profilesMap[authUser.id]?.full_name || null,
								email: authUser.email,
							}
						}
					}
				}
			} catch (e) {
				console.error('[SETTINGS_PAGE] Failed to fetch auth users:', e)
			}
		}
	}

	// Get owner info
	const { data: owner } = await adminClient
		.from('profiles')
		.select('full_name, email')
		.eq('id', organization.owner_id)
		.single()

	const organizationWithRole = {
		...organization,
		user_role: effectiveMembership.role,
		member_count: memberCount || 0,
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
					.select('id, full_name, email')
					.in('id', userIds)

				profilesMap = profiles?.reduce(
					(acc, p) => ({
						...acc,
						[p.id]: { full_name: p.full_name, email: p.email },
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
				ownerName={owner?.full_name || owner?.email || 'Unknown'}
				initialTransactions={initialTransactions}
				currentUserEmail={user.email}
				currentUserName={user.user_metadata?.full_name || null}
				currentUserId={user.id}
			/>
		</div>
	)
}
