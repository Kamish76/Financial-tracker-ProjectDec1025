import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
		const supabase = await createClient()
		const adminClient = createAdminClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Check if user is the owner
		const { data: org } = await adminClient
			.from('organizations')
			.select('owner_id')
			.eq('id', id)
			.single()

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

		// Check if new owner is a member of the organization
		const { data: newOwnerMembership } = await adminClient
			.from('organization_members')
			.select('user_id, role')
			.eq('organization_id', id)
			.eq('user_id', new_owner_id)
			.single()

		if (!newOwnerMembership) {
			return NextResponse.json(
				{ error: 'New owner must be a member of the organization' },
				{ status: 400 }
			)
		}

		// Perform the transfer in a transaction-like manner
		// 1. Update the organization's owner_id
		const { error: orgUpdateError } = await adminClient
			.from('organizations')
			.update({ owner_id: new_owner_id })
			.eq('id', id)

		if (orgUpdateError) {
			console.error('Error updating organization owner:', orgUpdateError)
			return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 })
		}

		// 2. Update the current owner's role to admin
		const { error: currentOwnerUpdateError } = await adminClient
			.from('organization_members')
			.update({ role: 'admin' })
			.eq('organization_id', id)
			.eq('user_id', user.id)

		if (currentOwnerUpdateError) {
			console.error('Error updating current owner role:', currentOwnerUpdateError)
			// Attempt to rollback
			await adminClient.from('organizations').update({ owner_id: user.id }).eq('id', id)
			return NextResponse.json({ error: 'Failed to update member roles' }, { status: 500 })
		}

		// 3. Update the new owner's role to owner
		const { error: newOwnerUpdateError } = await adminClient
			.from('organization_members')
			.update({ role: 'owner' })
			.eq('organization_id', id)
			.eq('user_id', new_owner_id)

		if (newOwnerUpdateError) {
			console.error('Error updating new owner role:', newOwnerUpdateError)
			// Attempt to rollback
			await adminClient.from('organizations').update({ owner_id: user.id }).eq('id', id)
			await adminClient
				.from('organization_members')
				.update({ role: 'owner' })
				.eq('organization_id', id)
				.eq('user_id', user.id)
			return NextResponse.json({ error: 'Failed to update new owner role' }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error in POST /api/organization/[id]/transfer-ownership:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
