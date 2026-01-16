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
	const { data: members } = await adminClient
		.from('organization_members')
		.select(`
			user_id,
			role,
			joined_at,
			profiles:user_id (
				id,
				full_name,
				email
			)
		`)
		.eq('organization_id', id)
		.order('joined_at', { ascending: true })

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
		const profile = m.profiles as unknown as { id: string; full_name: string; email: string } | null
		return {
			user_id: m.user_id,
			role: m.role,
			joined_at: m.joined_at,
			user: {
				id: profile?.id || m.user_id,
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
		assigned_to_name: string | null
		assigned_to_email: string | null
	}> = []

	if (effectiveMembership.role === 'owner') {
		const { data: initialTxData } = await adminClient
			.from('transactions')
			.select(`
				id,
				type,
				amount,
				category,
				description,
				occurred_at,
				funded_by_user_id,
				profiles:funded_by_user_id (
					full_name,
					email
				)
			`)
			.eq('organization_id', id)
			.eq('is_initial', true)
			.order('occurred_at', { ascending: false })

		initialTransactions = (initialTxData || []).map((tx) => {
			const profile = tx.profiles as unknown as { full_name: string | null; email: string | null } | null
			return {
				id: tx.id,
				type: tx.type,
				amount: tx.amount,
				category: tx.category,
				description: tx.description,
				occurred_at: tx.occurred_at,
				assigned_to_name: profile?.full_name || null,
				assigned_to_email: profile?.email || null,
			}
		})
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
