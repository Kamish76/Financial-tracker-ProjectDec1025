import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { assertOrgRoleForAction } from '@/lib/auth/guards'

type RouteContext = {
	params: Promise<{
		id: string
	}>
}

/**
 * PATCH /api/organization/[id]
 * Update organization name and description
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
	try {
		const { id } = await params
		const adminClient = createAdminClient()
		const auth = await assertOrgRoleForAction(id, ['owner', 'admin'])

		if (!auth.ok) {
			return NextResponse.json(
				{ error: auth.error },
				{ status: auth.error === 'You must be signed in' ? 401 : 403 }
			)
		}

		const body = await request.json()
		const { name, description } = body

		if (!name || typeof name !== 'string' || !name.trim()) {
			return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
		}

		// Update organization
		const { data: updatedOrg, error: updateError } = await adminClient
			.from('organizations')
			.update({
				name: name.trim(),
				description: description?.trim() || null,
			})
			.eq('id', id)
			.select()
			.single()

		if (updateError) {
			console.error('Error updating organization:', updateError)
			return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
		}

		return NextResponse.json(updatedOrg)
	} catch (error) {
		console.error('Error in PATCH /api/organization/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * DELETE /api/organization/[id]
 * Delete organization (owner only)
 * Cascades to delete all related data: members, transactions, invites, etc.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

		// Verify the user is actually the owner_id on the organization
		const { data: org } = await adminClient
			.from('organizations')
			.select('owner_id')
			.eq('id', id)
			.single()

		if (!org || org.owner_id !== auth.user.id) {
			return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
		}

		// Delete organization (cascade will handle related tables)
		const { error: deleteError } = await adminClient.from('organizations').delete().eq('id', id)

		if (deleteError) {
			console.error('Error deleting organization:', deleteError)
			return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error in DELETE /api/organization/[id]:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
