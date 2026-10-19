import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { assertOrgRoleForAction } from '@/lib/auth/guards'
import { revalidateOrganizationSections } from '@/lib/revalidation'
import { revalidatePath } from 'next/cache'

type RouteContext = {
	params: Promise<{
		id: string
	}>
}

/**
 * POST /api/organization/[id]/transfer-ownership
 * Transfer organization ownership to another member
 * Current owner becomes admin
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
	try {
		const { id } = await params
		const adminClient = createAdminClient()
		const auth = await assertOrgRoleForAction(id, ['owner'])
		if (!auth.ok) {
			return NextResponse.json(
				{ error: auth.error },
				{ status: auth.error === 'You must be signed in' ? 401 : 403 }
			)
		}

		const { user } = auth

		// Check if user is the owner
		const { data: org } = await adminClient
			.from('organizations')
			.select('owner_id')
			.eq('id', id)
			.maybeSingle()

		if (!org) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
		}

		if (org.owner_id !== user.id) {
			return NextResponse.json(
				{ error: 'Only the organization owner can transfer ownership' },
				{ status: 403 }
			)
		}

		const body = await request.json()
		const { new_owner_id } = body

		if (!new_owner_id || typeof new_owner_id !== 'string') {
			return NextResponse.json({ error: 'New owner ID is required' }, { status: 400 })
		}

		// Check if new owner is an active member of the organization
		const { data: newOwnerMembership } = await adminClient
			.from('organization_members')
			.select('user_id, role, is_active')
			.eq('organization_id', id)
			.eq('user_id', new_owner_id)
			.eq('is_active', true)
			.maybeSingle()

		if (!newOwnerMembership) {
			return NextResponse.json(
				{ error: 'New owner must be an active member of the organization' },
				{ status: 400 }
			)
		}

		// Execute atomic ownership transfer via PostgreSQL stored procedure (with FOR UPDATE locks)
		const { error: transferError } = await adminClient.rpc('transfer_organization_ownership', {
			p_org_id: id,
			p_new_owner_id: new_owner_id,
		})

		if (transferError) {
			console.error('Error transferring organization ownership via RPC:', transferError)
			return NextResponse.json(
				{ error: transferError.message || 'Failed to transfer ownership' },
				{ status: 500 }
			)
		}

		revalidateOrganizationSections(id, ['settings', 'members'])
		revalidatePath('/organizations')

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error in POST /api/organization/[id]/transfer-ownership:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
