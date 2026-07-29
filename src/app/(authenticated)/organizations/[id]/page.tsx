
import Link from 'next/link'
import { ArrowLeftRight, ScrollText, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrgMembership } from '@/lib/auth/guards'
import { AddIncomeSheet } from './add-income-sheet'
import { AddExpenseSheet } from './add-expense-sheet'
import { RefundSheet } from './refund-sheet'
import { getOrganizationStats } from '@/lib/finance'
import { StatsCards } from '@/components/stats-cards'
import { MemberBalancesTable } from '@/components/member-balances-table'
import { DashboardClientWrapper } from './dashboard-client-wrapper'
import { isWalletOrganization } from '@/lib/wallet'
import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import { WalletFab } from '@/components/wallet/wallet-fab'
import { WalletTotalBalanceCard } from '@/components/wallet/wallet-total-balance-card'

type PageProps = {
	params: Promise<{
		id: string
	}>
}

type TransactionRecord = {
	id: string
	amount: number
	type: string
	category: string | null
	description: string | null
	created_at: string
	is_initial: boolean
	account_name?: string | null
	transfer_to_account_name?: string | null
}

const formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
})

function formatAmount(type: string, amount: number) {
	const sign = type === 'income' ? '+' : type === 'held_allocate' ? '+' : '-'
	return `${sign} ${formatter.format(amount)}`
}

function typeBadge(type: string) {
	const map: Record<string, { label: string; className: string }> = {
		income: { label: 'Income', className: 'text-emerald-600 bg-emerald-50' },
		expense_business: { label: 'Expense (Biz)', className: 'text-rose-600 bg-rose-50' },
		expense_personal: { label: 'Expense (Personal)', className: 'text-orange-600 bg-orange-50' },
		held_allocate: { label: 'Allocation +', className: 'text-blue-600 bg-blue-50' },
		held_return: { label: 'Allocation −', className: 'text-purple-600 bg-purple-50' },
	}

	return map[type] || { label: type, className: 'text-slate-700 bg-slate-100' }
}

export default async function OrganizationFinancePage({ params }: PageProps) {
	const { id } = await params
	const adminClient = createAdminClient()

	const debugInfo: { label: string; value: string }[] = []
	const { user, membership: effectiveMembership } = await requireOrgMembership(id)

	debugInfo.push({ label: 'orgId', value: id })
	debugInfo.push({ label: 'userId', value: user?.id ?? 'none' })
	debugInfo.push({ label: 'userEmail', value: user?.email ?? 'none' })
	debugInfo.push({ label: 'membershipRole', value: effectiveMembership.role })

	const { data: organization } = await adminClient
		.from('organizations')
		.select('id, name, description')
		.eq('id', id)
		.maybeSingle()

	const isWallet = isWalletOrganization(organization?.description)
	debugInfo.push({ label: 'isWallet', value: isWallet ? 'yes' : 'no' })

	const accounts = isWallet ? await getAccountsWithBalances(id, false) : []

	const { data: transactionRows, error: transactionsError } = await adminClient
		.from('transactions')
		.select('id, type, amount, category, description, created_at, is_initial, account_id, transfer_to_account_id, account:wallet_accounts!account_id(id, name), transfer_to_account:wallet_accounts!transfer_to_account_id(id, name)')
		.eq('organization_id', id)
		.order('created_at', { ascending: false })
		.limit(365)

	if (transactionsError) {
		console.error('[ORG_PAGE] Transactions error', { orgId: id, error: transactionsError.message })
	}

	const transactions: TransactionRecord[] = (transactionRows || []).map((row: any) => ({
		id: row.id,
		type: row.type,
		amount: Number(row.amount ?? 0),
		category: row.category,
		description: row.description,
		created_at: row.created_at,
		is_initial: row.is_initial ?? false,
		account_name: row.account?.name ?? null,
		transfer_to_account_name: row.transfer_to_account?.name ?? null,
	}))

	// Compute organization stats (totals + per-member balances)
	const stats = await getOrganizationStats(id)

	const canManage = effectiveMembership?.role === 'owner' || effectiveMembership?.role === 'admin'

	debugInfo.push({ label: 'transactionsCount', value: transactions.length.toString() })

	return (
		<div className="flex flex-col gap-6">
			<Card className="border-dashed bg-muted/30">
				<CardContent className="flex flex-wrap gap-3 px-4 py-3 text-xs text-muted-foreground">
					<span className="font-semibold text-foreground">Debug (temporary)</span>
					{debugInfo.map((item) => (
						<span key={item.label} className="rounded-md bg-background px-2 py-1 shadow-sm">
							{item.label}: {item.value}
						</span>
					))}
				</CardContent>
			</Card>

			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<Link href="/organizations" className="hover:text-foreground">
						Organizations
					</Link>
					<span>/</span>
					<span className="text-foreground font-medium">{organization?.name ?? 'Organization'}</span>
					{isWallet && (
						<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
							Wallet
						</span>
					)}
				</div>
				<h1 className="text-3xl font-semibold text-foreground">
					{isWallet ? 'Personal Wallet' : 'Finance hub'}
				</h1>
				<p className="text-muted-foreground max-w-2xl">
					{isWallet
						? 'Manage your personal finances in a private wallet UI. Collaboration and invite features are hidden here.'
						: 'Manage income and expenses for this organization. Use the quick actions below to open modals for adding entries or back tracking. View the full ledger in the dedicated records page.'}
				</p>
			</div>

			{/* Top-level stats */}
			{!isWallet && <StatsCards totals={stats.totals} />}
			{isWallet && <WalletTotalBalanceCard organizationId={id} accounts={accounts} />}

		{/* Period Summary Stats */}
		<DashboardClientWrapper allTransactions={transactions} />
			{!isWallet && (
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<CardTitle>{isWallet ? 'Wallet actions' : 'Quick actions'}</CardTitle>
								<CardDescription>
									{isWallet
										? 'Wallet actions focus on private expense tracking and balance updates.'
										: 'Quick actions open sheets for fast entry. Add income, expenses, and refunds.'}
								</CardDescription>
							</div>
							<div className="rounded-full bg-accent text-background p-2">
								<ArrowLeftRight className="h-5 w-5" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-2">
						{canManage ? (
							<AddIncomeSheet organizationId={id} />
						) : (
							<Button type="button" className="w-full justify-start gap-2" disabled aria-disabled>
								Add income (insufficient permissions)
							</Button>
						)}
						{canManage ? (
							<AddExpenseSheet organizationId={id} organizationDescription={organization?.description} />
						) : (
							<Button
								type="button"
								variant="secondary"
								className="w-full justify-start gap-2"
								disabled
								aria-disabled
							>
								Add expense (insufficient permissions)
							</Button>
						)}
						{!isWallet && (
							canManage ? (
								<RefundSheet organizationId={id} />
							) : (
								<Button
									type="button"
									variant="outline"
									className="w-full justify-start gap-2"
									disabled
									aria-disabled
								>
									Refund (insufficient permissions)
								</Button>
							)
						)}
						{isWallet && (
							<Button
								asChild
								variant="outline"
								className="w-full justify-start gap-2"
								aria-label="Manage wallet settings"
							>
								<Link href={`/organizations/${id}/settings`}>
									<Settings className="h-4 w-4" />
									Wallet Settings
								</Link>
							</Button>
						)}
						<Button
							asChild
							className="w-full justify-start gap-2"
							aria-label="Go to full records"
						>
							<Link href={`/organizations/${id}/records`}>
								<ScrollText className="h-4 w-4" />
								View full records
							</Link>
						</Button>
						{!isWallet && (
							<Button
								asChild
								variant="outline"
								className="w-full justify-start gap-2 md:col-span-2"
								aria-label="Manage organization settings"
							>
								<Link href={`/organizations/${id}/settings`}>
									<Settings className="h-4 w-4" />
									Manage Settings
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>
			)}
			{!isWallet && (
				<Card>
					<CardHeader>
						<CardTitle>Member balances</CardTitle>
						<CardDescription>Business funds held and outstanding personal contributions.</CardDescription>
					</CardHeader>
					<CardContent>
						<MemberBalancesTable members={stats.members} />
					</CardContent>
				</Card>
			)}
			{isWallet && (
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<CardTitle>Wallet Sub Accounts</CardTitle>
								<CardDescription>
									Organize your personal funds across custom cash, checking, and savings accounts.
								</CardDescription>
							</div>
							<div className="rounded-full bg-accent text-background p-2">
								<ArrowLeftRight className="h-5 w-5" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
						<Button asChild className="w-full sm:w-auto">
							<Link href={`/organizations/${id}/accounts`}>
								Manage Sub Accounts
							</Link>
						</Button>
						<Button asChild variant="outline" className="w-full sm:w-auto">
							<Link href={`/organizations/${id}/records`}>
								<ScrollText className="h-4 w-4 mr-2" />
								View full records
							</Link>
						</Button>
						<Button asChild variant="outline" className="w-full sm:w-auto">
							<Link href={`/organizations/${id}/settings`}>
								<Settings className="h-4 w-4 mr-2" />
								Wallet Settings
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-4 lg:grid-cols-[1.1fr,1.2fr]">
				<Card>
					<CardHeader className="flex flex-row items-start justify-between">
						<div className="space-y-1">
							<CardTitle>Recent activity</CardTitle>
							<CardDescription>10 most recent changes for this organization.</CardDescription>
						</div>
						<span className="text-xs text-muted-foreground">Auto-refreshed on load</span>
					</CardHeader>
					<CardContent className="space-y-3">
						{transactionsError && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								Unable to load transactions right now.
							</div>
						)}

						{!transactionsError && transactions.length === 0 && (
							<div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
								<div>
									No transactions yet.
									<span className="ml-2 text-foreground">Use the quick actions to create your first one.</span>
								</div>
								<ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
							</div>
						)}

						{!transactionsError && transactions.length > 0 && (
							<div className="divide-y divide-border/70 rounded-xl border border-border/70">
								{transactions.map((tx) => {
									const badge = typeBadge(tx.type)
									const badgeLabel = tx.is_initial ? `${badge.label} (Initial)` : badge.label
									return (
										<div key={tx.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
														{badgeLabel}
													</span>
													{tx.category && (
														<span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
															{tx.category}
														</span>
													)}
													{tx.type === 'transfer' && tx.transfer_to_account_name ? (
														<span className="rounded-full bg-purple-100 dark:bg-purple-950/50 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
															{tx.account_name || 'Cash'} → {tx.transfer_to_account_name}
														</span>
													) : tx.account_name ? (
														<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
															<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
															{tx.account_name}
														</span>
													) : null}
												</div>
												{tx.description && (
													<p className="text-sm text-foreground">{tx.description}</p>
												)}
												<p className="text-xs text-muted-foreground">
													{dateFormatter.format(new Date(tx.created_at))}
												</p>
											</div>
											<div className="text-right text-base font-semibold text-foreground">
												{formatAmount(tx.type, tx.amount)}
											</div>
										</div>
									)
								})}
							</div>
						)}
						{transactions.length > 0 && (
							<div className="pt-2 border-t mt-4">
								<Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
									<Link href={`/organizations/${id}/records`}>
										View all transactions &rarr;
									</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
			{isWallet && <WalletFab organizationId={id} accounts={accounts} />}
		</div>
	)
}