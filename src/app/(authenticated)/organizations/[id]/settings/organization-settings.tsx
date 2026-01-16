'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
	Building2,
	Calendar,
	Users,
	Shield,
	AlertTriangle,
	Trash2,
	UserCog,
	ArrowLeft,
	Pencil,
	Receipt,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EditOrganizationDialog } from './edit-organization-dialog'
import { AddInitialValueSheet } from './add-initial-value-sheet'
import { deleteInitialTransaction } from '../actions'

type OrganizationRole = 'owner' | 'admin' | 'member'

type OrganizationWithRole = {
	id: string
	name: string
	description: string | null
	owner_id: string
	created_at: string
	user_role: OrganizationRole
	member_count: number
}

type MemberWithUser = {
	user_id: string
	role: OrganizationRole
	joined_at: string
	user: {
		id: string
		name: string
		email: string
	}
}

type InitialTransaction = {
	id: string
	type: string
	amount: number
	category: string | null
	description: string | null
	occurred_at: string
	assigned_to_name: string | null
	assigned_to_email: string | null
}

type OrganizationSettingsProps = {
	organization: OrganizationWithRole
	members: MemberWithUser[]
	ownerName: string
	initialTransactions?: InitialTransaction[]
	currentUserEmail?: string | null
	currentUserName?: string | null
	currentUserId?: string | null
}

export function OrganizationSettings({
	organization,
	members,
	ownerName,
	initialTransactions = [],
	currentUserEmail,
	currentUserName,
	currentUserId,
}: OrganizationSettingsProps) {
	const router = useRouter()
	const isOwner = organization.user_role === 'owner'
	const canEdit = organization.user_role === 'owner' || organization.user_role === 'admin'

	// Edit organization state
	const [editDialogOpen, setEditDialogOpen] = useState(false)

	// Delete organization state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [deleteConfirmName, setDeleteConfirmName] = useState('')
	const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('')
	const [isDeleting, setIsDeleting] = useState(false)

	// Transfer ownership state
	const [transferDialogOpen, setTransferDialogOpen] = useState(false)
	const [selectedNewOwner, setSelectedNewOwner] = useState<string>('')
	const [transferConfirmation, setTransferConfirmation] = useState('')
	const [isTransferring, setIsTransferring] = useState(false)

	// Delete initial transaction state
	const [deleteInitialDialogOpen, setDeleteInitialDialogOpen] = useState(false)
	const [selectedInitialTx, setSelectedInitialTx] = useState<string | null>(null)
	const [isDeletingInitial, startDeletingInitial] = useTransition()

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	const getTransactionTypeInfo = (type: string) => {
		switch (type) {
			case 'income':
				return { label: 'Income', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' }
			case 'expense_business':
				return { label: 'Expense (Biz)', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100' }
			case 'expense_personal':
				return { label: 'Expense (Personal)', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' }
			default:
				return { label: type, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' }
		}
	}

	const handleDeleteInitialTransaction = async () => {
		if (!selectedInitialTx) return

		startDeletingInitial(async () => {
			const result = await deleteInitialTransaction({
				organizationId: organization.id,
				transactionId: selectedInitialTx,
			})

			if (result?.error) {
				alert(result.error)
			} else {
				setDeleteInitialDialogOpen(false)
				setSelectedInitialTx(null)
				router.refresh()
			}
		})
	}

	// Get members who can become owners (everyone except current owner)
	const transferableMembers = members.filter((m) => m.user_id !== organization.owner_id)

	// Prepare members list for the AddInitialValueSheet
	// Include all members except current user for the dropdown
	const membersForSheet = members
		.map((m) => ({
			user_id: m.user_id,
			email: m.user.email,
			full_name: m.user.name,
		}))
		.filter((m) => m.email && m.user_id) // Only include members with valid data

	const handleDeleteOrganization = async () => {
		const expectedPhrase = 'i confirm in deleting the organization'
		if (deleteConfirmName !== organization.name || deleteConfirmPhrase.toLowerCase() !== expectedPhrase) {
			return
		}

		setIsDeleting(true)
		try {
			const response = await fetch(`/api/organization/${organization.id}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				router.push('/organizations')
				router.refresh()
			} else {
				const data = await response.json()
				alert(data.error || 'Failed to delete organization')
			}
		} catch (error) {
			console.error('Error deleting organization:', error)
			alert('An error occurred while deleting the organization')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleTransferOwnership = async () => {
		if (!selectedNewOwner || transferConfirmation !== organization.name) return

		setIsTransferring(true)
		try {
			const response = await fetch(`/api/organization/${organization.id}/transfer-ownership`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ new_owner_id: selectedNewOwner }),
			})

			if (response.ok) {
				setTransferDialogOpen(false)
				router.refresh()
			} else {
				const data = await response.json()
				alert(data.error || 'Failed to transfer ownership')
			}
		} catch (error) {
			console.error('Error transferring ownership:', error)
			alert('An error occurred while transferring ownership')
		} finally {
			setIsTransferring(false)
		}
	}

	const selectedMember = transferableMembers.find((m) => m.user_id === selectedNewOwner)

	const deleteButtonDisabled =
		deleteConfirmName !== organization.name ||
		deleteConfirmPhrase.toLowerCase() !== 'i confirm in deleting the organization' ||
		isDeleting

	return (
		<div className="container mx-auto py-6 px-4 max-w-4xl">
			{/* Back Button */}
			<Button
				variant="ghost"
				onClick={() => router.push(`/organizations/${organization.id}`)}
				className="mb-6"
			>
				<ArrowLeft className="h-4 w-4 mr-2" />
				Back to Dashboard
			</Button>

			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
				<p className="text-muted-foreground mt-2">
					Manage settings and preferences for {organization.name}
				</p>
			</div>

			<div className="space-y-6">
				{/* Organization Info Card */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
									<Building2 className="h-5 w-5 text-primary" />
								</div>
								<div>
									<CardTitle>Organization Information</CardTitle>
									<CardDescription>Basic details about your organization</CardDescription>
								</div>
							</div>
							{canEdit && (
								<Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
									<Pencil className="h-4 w-4 mr-2" />
									Edit
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Name */}
							<div className="space-y-1">
								<Label className="text-muted-foreground text-sm">Name</Label>
								<p className="font-medium text-foreground">{organization.name}</p>
							</div>

							{/* Description */}
							<div className="space-y-1 md:col-span-2">
								<Label className="text-muted-foreground text-sm">Description</Label>
								<p className="font-medium text-foreground">
									{organization.description || (
										<span className="text-muted-foreground italic">No description</span>
									)}
								</p>
							</div>
						</div>

						<div className="border-t pt-4 mt-4">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{/* Created Date */}
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
										<Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Created</p>
										<p className="text-sm font-medium">{formatDate(organization.created_at)}</p>
									</div>
								</div>

								{/* Member Count */}
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
										<Users className="h-4 w-4 text-green-600 dark:text-green-400" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Members</p>
										<p className="text-sm font-medium">{organization.member_count} members</p>
									</div>
								</div>

								{/* Owner */}
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
										<Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Owner</p>
										<p className="text-sm font-medium">{ownerName}</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Initial Values Section - Owner Only */}
				{isOwner && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
										<Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<CardTitle>Initial Values</CardTitle>
										<CardDescription>
											Set up opening balances and initial capital contributions ({members.length} members)
										</CardDescription>
									</div>
								</div>
								<AddInitialValueSheet
									organizationId={organization.id}
									members={membersForSheet}
									currentUserEmail={currentUserEmail}
									currentUserName={currentUserName}
									currentUserId={currentUserId}
								/>
							</div>
						</CardHeader>
						<CardContent>
							{initialTransactions.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<p>No initial transactions set up yet.</p>
									<p className="text-sm mt-1">
										Add initial values to set up your organization&apos;s starting financial state.
									</p>
								</div>
							) : (
								<div className="space-y-2">
									{initialTransactions.map((tx) => {
										const typeInfo = getTransactionTypeInfo(tx.type)
										return (
											<div
												key={tx.id}
												className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
											>
												<div className="flex-1 space-y-1">
													<div className="flex items-center gap-2">
														<Badge className={typeInfo.className}>{typeInfo.label}</Badge>
														<span className="font-semibold">
															${tx.amount.toLocaleString('en-US', {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</span>
														{tx.category && (
															<span className="text-sm text-muted-foreground">
																• {tx.category}
															</span>
														)}
													</div>
													<div className="flex items-center gap-3 text-sm text-muted-foreground">
														<span>{formatDate(tx.occurred_at)}</span>
														<span>•</span>
														<span>
															Assigned to:{' '}
															{tx.assigned_to_name ||
																tx.assigned_to_email ||
																'Organization'}
														</span>
													</div>
													{tx.description && (
														<p className="text-sm text-muted-foreground">{tx.description}</p>
													)}
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setSelectedInitialTx(tx.id)
														setDeleteInitialDialogOpen(true)
													}}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										)
									})}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Danger Zone - Owner Only */}
				{isOwner && (
					<Card className="border-destructive/50">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
									<AlertTriangle className="h-5 w-5 text-destructive" />
								</div>
								<div>
									<CardTitle className="text-destructive">Danger Zone</CardTitle>
									<CardDescription>
										Irreversible actions that require careful consideration
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Transfer Ownership */}
							<div className="flex items-center justify-between p-4 border rounded-lg">
								<div className="flex items-start gap-3">
									<UserCog className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<h4 className="font-medium text-foreground">Transfer Ownership</h4>
										<p className="text-sm text-muted-foreground">
											Transfer this organization to another member. You will become an Admin.
										</p>
									</div>
								</div>
								<Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
									<DialogTrigger asChild>
										<Button variant="outline">Transfer</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Transfer Ownership</DialogTitle>
											<DialogDescription>
												Select a member to become the new owner of this organization. This action
												cannot be undone. You will be demoted to Admin.
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div className="space-y-2">
												<Label>Select New Owner</Label>
												<Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Choose a member..." />
													</SelectTrigger>
													<SelectContent>
														{transferableMembers.map((member) => (
															<SelectItem key={member.user_id} value={member.user_id}>
																{member.user.name} ({member.user.email}) - {member.role}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{selectedMember && (
													<p className="text-sm text-muted-foreground">
														<strong>{selectedMember.user.name}</strong> will become the new owner.
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label>
													Type <strong className="text-foreground">{organization.name}</strong> to
													confirm
												</Label>
												<Input
													value={transferConfirmation}
													onChange={(e) => setTransferConfirmation(e.target.value)}
													placeholder="Enter organization name"
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => {
													setTransferDialogOpen(false)
													setSelectedNewOwner('')
													setTransferConfirmation('')
												}}
											>
												Cancel
											</Button>
											<Button
												variant="destructive"
												onClick={handleTransferOwnership}
												disabled={
													!selectedNewOwner ||
													transferConfirmation !== organization.name ||
													isTransferring
												}
											>
												{isTransferring ? 'Transferring...' : 'Transfer Ownership'}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>

							{/* Delete Organization */}
							<div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
								<div className="flex items-start gap-3">
									<Trash2 className="h-5 w-5 text-destructive mt-0.5" />
									<div>
										<h4 className="font-medium text-destructive">Delete Organization</h4>
										<p className="text-sm text-muted-foreground">
											Permanently delete this organization and all its data including transactions,
											members, invites, and balances.
										</p>
									</div>
								</div>
								<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
									<DialogTrigger asChild>
										<Button variant="destructive">Delete</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle className="text-destructive">Delete Organization</DialogTitle>
											<DialogDescription>
												This action <strong>cannot be undone</strong>. This will permanently delete the{' '}
												<strong>{organization.name}</strong> organization and remove all associated data
												including:
											</DialogDescription>
										</DialogHeader>
										<div className="py-4">
											<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
												<li>All transactions (income, expenses)</li>
												<li>All member associations and roles</li>
												<li>All invite codes</li>
												<li>All member balances and contributions</li>
												<li>All reimbursement requests</li>
											</ul>
											<div className="mt-4 space-y-4">
												<div className="space-y-2">
													<Label>
														Type <strong className="text-foreground">{organization.name}</strong> to
														confirm
													</Label>
													<Input
														value={deleteConfirmName}
														onChange={(e) => setDeleteConfirmName(e.target.value)}
														placeholder="Enter organization name"
														className="border-destructive/50 focus-visible:ring-destructive/50"
													/>
												</div>
												<div className="space-y-2">
													<Label>
														Type{' '}
														<strong className="text-foreground">
															i confirm in deleting the organization
														</strong>{' '}
														to confirm
													</Label>
													<Input
														value={deleteConfirmPhrase}
														onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
														placeholder="i confirm in deleting the organization"
														className="border-destructive/50 focus-visible:ring-destructive/50"
													/>
												</div>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => {
													setDeleteDialogOpen(false)
													setDeleteConfirmName('')
													setDeleteConfirmPhrase('')
												}}
											>
												Cancel
											</Button>
											<Button
												variant="destructive"
												onClick={handleDeleteOrganization}
												disabled={deleteButtonDisabled}
											>
												{isDeleting ? 'Deleting...' : 'Delete Organization'}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Edit Organization Dialog */}
			<EditOrganizationDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				organization={organization}
			/>

			{/* Delete Initial Transaction Dialog */}
			<Dialog open={deleteInitialDialogOpen} onOpenChange={setDeleteInitialDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Initial Transaction</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this initial transaction? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeleteInitialDialogOpen(false)
								setSelectedInitialTx(null)
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteInitialTransaction}
							disabled={isDeletingInitial}
						>
							{isDeletingInitial ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
