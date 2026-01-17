'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type OrganizationWithRole = {
	id: string
	name: string
	description: string | null
	owner_id: string
	created_at: string
	user_role: string
	member_count: number
}

type EditOrganizationDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	organization: OrganizationWithRole
}

export function EditOrganizationDialog({
	open,
	onOpenChange,
	organization,
}: EditOrganizationDialogProps) {
	const router = useRouter()
	const [name, setName] = useState(organization.name)
	const [description, setDescription] = useState(organization.description || '')
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!name.trim()) {
			setError('Organization name is required')
			return
		}

		startTransition(async () => {
			try {
				const response = await fetch(`/api/organization/${organization.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: name.trim(),
						description: description.trim() || null,
					}),
				})

				if (!response.ok) {
					const data = await response.json()
					setError(data.error || 'Failed to update organization')
					return
				}

				onOpenChange(false)
				router.refresh()
			} catch (err) {
				console.error('Error updating organization:', err)
				setError('An error occurred while updating the organization')
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Organization</DialogTitle>
					<DialogDescription>
						Update the name and description of your organization.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Organization Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter organization name"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description (Optional)</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
								placeholder="Enter organization description"
								rows={4}
							/>
						</div>

						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{error}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? 'Saving...' : 'Save Changes'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
