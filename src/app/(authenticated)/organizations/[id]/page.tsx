
import Link from 'next/link'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Building2, ScrollText, Settings, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrgMembership } from '@/lib/auth/guards'
import { AddIncomeSheet } from './add-income-sheet'
import { AddExpenseSheet } from './add-expense-sheet'
import { RefundSheet } from './refund-sheet'
import { getOrganizationStats, type OrganizationStats } from '@/lib/finance'
import { StatsCards } from '@/components/stats-cards'
import { MemberBalancesTable } from '@/components/member-balances-table'
import { DashboardClientWrapper } from './dashboard-client-wrapper'
import { isWalletOrganization } from '@/lib/wallet'
import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import type { AccountWithBalance } from '@/lib/wallet-types'
import type { ClientTransaction } from '@/lib/finance-client'
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
	occurred_at: string | null
	created_at: string
	is_initial: boolean
	account_name?: string | null
	transfer_to_account_name?: string | null
}

import { formatCurrency } from '@/lib/utils'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
})

function formatAmount(type: string, amount: number, currency?: string, isWallet?: boolean) {
	if (isWallet && type === 'transfer') {
		return formatCurrency(amount, currency)
	}
	const sign = type === 'income' ? '+' : type === 'held_allocate' ? '+' : '-'
	return `${sign} ${formatCurrency(amount, currency)}`
}

function typeBadge(type: string, isWallet?: boolean) {
	const map: Record<string, { label: string; className: string }> = {
		income: { label: 'Income', className: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40' },
		expense_business: { label: isWallet ? 'Expense' : 'Expense (Biz)', className: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40' },
		expense_personal: { label: isWallet ? 'Expense' : 'Expense (Personal)', className: isWallet ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40' : 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40' },
		expense: { label: 'Expense', className: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40' },
		held_allocate: { label: 'Allocation +', className: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40' },
		held_return: { label: 'Allocation −', className: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40' },
		transfer: { label: 'Transfer', className: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40' },
	}

	return map[type] || { label: type, className: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' }
}

function getActivityVisuals(type: string, isWallet?: boolean) {
	if (type === 'income') {
		return {
			Icon: ArrowDownLeft,
			iconBoxClass: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
			amountClass: 'text-emerald-600 dark:text-emerald-400',
		}
	}
	if (type === 'held_allocate') {
		return {
			Icon: ArrowLeftRight,
			iconBoxClass: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
			amountClass: 'text-blue-600 dark:text-blue-400',
		}
	}
	if (type === 'held_return' || type === 'transfer') {
		return {
			Icon: ArrowLeftRight,
			iconBoxClass: 'bg-purple-500/12 text-purple-600 dark:text-purple-400',
			amountClass: 'text-purple-600 dark:text-purple-400',
		}
	}
	if (type === 'expense_personal' && !isWallet) {
		return {
			Icon: ArrowUpRight,
			iconBoxClass: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
			amountClass: 'text-amber-600 dark:text-amber-400',
		}
	}
	return {
		Icon: ArrowUpRight,
		iconBoxClass: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
		amountClass: 'text-rose-600 dark:text-rose-400',
	}
}

type RawTransactionRow = {
	id: string
	type: string
	amount: number | null
	category: string | null
	description: string | null
	occurred_at?: string | null
	created_at: string
	is_initial?: boolean | null
	account?: { name?: string | null } | null
	transfer_to_account?: { name?: string | null } | null
}

export default async function OrganizationFinancePage({ params }: PageProps) {
	const { id } = await params
	const adminClient = createAdminClient()

	const { membership: effectiveMembership } = await requireOrgMembership(id)

	const { data: organization } = await adminClient
		.from('organizations')
		.select('id, name, description, currency')
		.eq('id', id)
		.maybeSingle()

	const isWallet = isWalletOrganization(organization?.description)

	let accounts: AccountWithBalance[] = []
	let transactionRows: RawTransactionRow[] = []
	let transactionsError: { message: string } | null = null
	let periodTransactions: ClientTransaction[] = []
	let stats: OrganizationStats = {
		totals: {
			totalIncome: 0,
			totalExpensesBusiness: 0,
			totalExpensesPersonal: 0,
			expensesCapital: 0,
			actualExpensesWithoutCapital: 0,
			cashOnHand: 0,
			actualExpensesVsIncome: 0,
		},
		members: [],
	}

	if (isWallet) {
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const startOfWeek = new Date(now)
		startOfWeek.setDate(now.getDate() - now.getDay())
		startOfWeek.setHours(0, 0, 0, 0)
		const periodCutoff = startOfMonth < startOfWeek ? startOfMonth : startOfWeek

		// Fast parallel fetching for wallet mode:
		// 1. Account balances
		// 2. 10 recent transactions for recent activity
		// 3. Lightweight period transactions for current week/month stats (no heavy joins)
		const [accountsData, recentTxResult, periodTxResult] = await Promise.all([
			getAccountsWithBalances(id, false),
			adminClient
				.from('transactions')
				.select('id, type, amount, category, description, occurred_at, created_at, is_initial, account_id, transfer_to_account_id, account:wallet_accounts!account_id(id, name), transfer_to_account:wallet_accounts!transfer_to_account_id(id, name)')
				.eq('organization_id', id)
				.order('created_at', { ascending: false })
				.limit(10),
			adminClient
				.from('transactions')
				.select('id, type, amount, occurred_at, created_at')
				.eq('organization_id', id)
				.gte('occurred_at', periodCutoff.toISOString()),
		])

		accounts = accountsData
		transactionRows = (recentTxResult.data || []) as unknown as RawTransactionRow[]
		transactionsError = recentTxResult.error
		periodTransactions = ((periodTxResult.data || []) as unknown as Array<{
			id: string
			type: string
			amount: number | null
			occurred_at: string | null
			created_at: string
		}>).map((tx) => ({
			id: tx.id,
			amount: Number(tx.amount ?? 0),
			type: tx.type,
			occurred_at: tx.occurred_at,
			created_at: tx.created_at,
		}))
	} else {
		// Business mode: load full stats and ledger
		const [transactionsResult, statsResult] = await Promise.all([
			adminClient
				.from('transactions')
				.select('id, type, amount, category, description, occurred_at, created_at, is_initial, account_id, transfer_to_account_id, account:wallet_accounts!account_id(id, name), transfer_to_account:wallet_accounts!transfer_to_account_id(id, name)')
				.eq('organization_id', id)
				.order('created_at', { ascending: false })
				.limit(365),
			getOrganizationStats(id),
		])

		transactionRows = (transactionsResult.data || []) as unknown as RawTransactionRow[]
		transactionsError = transactionsResult.error
		stats = statsResult
		periodTransactions = transactionRows.map((tx) => ({
			id: tx.id,
			amount: Number(tx.amount ?? 0),
			type: tx.type,
			occurred_at: tx.occurred_at ?? null,
			created_at: tx.created_at,
		}))
	}

	if (transactionsError) {
		console.error('[ORG_PAGE] Transactions error', { orgId: id, error: transactionsError.message })
	}

	const transactions: TransactionRecord[] = transactionRows.map((row) => ({
		id: row.id,
		type: row.type,
		amount: Number(row.amount ?? 0),
		category: row.category,
		description: row.description,
		occurred_at: row.occurred_at ?? null,
		created_at: row.created_at,
		is_initial: row.is_initial ?? false,
		account_name: row.account?.name ?? null,
		transfer_to_account_name: row.transfer_to_account?.name ?? null,
	}))

	const canManage = effectiveMembership?.role === 'owner' || effectiveMembership?.role === 'admin'

	const currencyCode = organization?.currency?.trim()?.toUpperCase() || 'USD'

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<Link href="/organizations" className="hover:text-foreground transition-colors">
						Organizations
					</Link>
					<span>/</span>
					<span className="text-foreground font-medium">{organization?.name ?? 'Organization'}</span>
					{isWallet && (
						<span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
							Wallet
						</span>
					)}
				</div>

				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-start gap-3.5">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
								isWallet
									? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
									: 'border-accent/25 bg-accent/12 text-accent-strong'
							}`}
						>
							{isWallet ? <Wallet className="h-6 w-6" aria-hidden /> : <Building2 className="h-6 w-6" aria-hidden />}
						</div>
						<div className="space-y-1">
							<div className="flex flex-wrap items-center gap-2.5">
								<h1 className="text-3xl font-bold tracking-tight text-foreground">
									{isWallet ? 'Personal Wallet' : 'Finance hub'}
								</h1>
								<span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
									{currencyCode}
								</span>
							</div>
							<p className="text-sm text-muted-foreground max-w-2xl">
								{isWallet
									? 'Manage your personal finances in a private wallet UI. Collaboration and invite features are hidden here.'
									: 'Manage income and expenses for this organization. Log entries quickly below or inspect the full accountability ledger.'}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2 shrink-0">
						<Button asChild variant="outline" size="sm" className="gap-1.5">
							<Link href={`/organizations/${id}/records`}>
								<ScrollText className="h-4 w-4" aria-hidden />
								<span>Full Ledger</span>
							</Link>
						</Button>
						<Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
							<Link href={`/organizations/${id}/settings`}>
								<Settings className="h-4 w-4" aria-hidden />
								<span>Settings</span>
							</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Top-level stats */}
			{!isWallet && <StatsCards totals={stats.totals} currency={organization?.currency} />}
			{isWallet && <WalletTotalBalanceCard organizationId={id} accounts={accounts} currency={organization?.currency} />}

		{/* Period Summary Stats */}
		<DashboardClientWrapper allTransactions={periodTransactions} currency={organization?.currency} />
			{!isWallet && (
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<CardTitle>{isWallet ? 'Wallet actions' : 'Quick actions'}</CardTitle>
								<CardDescription>
									{isWallet
										? 'Wallet actions focus on private expense tracking and balance updates.'
										: 'Open the transaction drawer pre-selected for income, expenses, or member refunds.'}
								</CardDescription>
							</div>
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
								<ArrowLeftRight className="h-4 w-4" aria-hidden />
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid gap-3 sm:grid-cols-3">
							{canManage ? (
								<AddIncomeSheet organizationId={id} currency={organization?.currency} />
							) : (
								<Button type="button" variant="outline" className="w-full justify-start gap-2 h-auto py-3.5" disabled aria-disabled>
									Add income (insufficient permissions)
								</Button>
							)}
							{canManage ? (
								<AddExpenseSheet organizationId={id} organizationDescription={organization?.description} currency={organization?.currency} />
							) : (
								<Button
									type="button"
									variant="outline"
									className="w-full justify-start gap-2 h-auto py-3.5"
									disabled
									aria-disabled
								>
									Add expense (insufficient permissions)
								</Button>
							)}
							{!isWallet && (
								canManage ? (
									<RefundSheet organizationId={id} currency={organization?.currency} />
								) : (
									<Button
										type="button"
										variant="outline"
										className="w-full justify-start gap-2 h-auto py-3.5"
										disabled
										aria-disabled
									>
										Refund (insufficient permissions)
									</Button>
								)
							)}
						</div>

						<div className="grid gap-3 sm:grid-cols-2 pt-1">
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
								variant="secondary"
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
									className="w-full justify-start gap-2"
									aria-label="Manage organization settings"
								>
									<Link href={`/organizations/${id}/settings`}>
										<Settings className="h-4 w-4" />
										Manage Settings
									</Link>
								</Button>
							)}
						</div>
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
						<MemberBalancesTable members={stats.members} currency={organization?.currency} />
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
							<div className="rounded-full bg-accent-strong text-white p-2">
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
								Transaction History
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

			<div className="grid gap-4">
				<Card>
					<CardHeader className="flex flex-row items-start justify-between gap-3">
						<div className="space-y-1">
							<CardTitle>{isWallet ? 'Recent Wallet Activity' : 'Recent activity'}</CardTitle>
							<CardDescription>
								{isWallet
									? 'Latest transactions recorded in your personal wallet.'
									: '10 most recent changes for this organization.'}
							</CardDescription>
						</div>
						<span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
							Auto-refreshed on load
						</span>
					</CardHeader>
					<CardContent className="space-y-3">
						{transactionsError && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								Unable to load transactions right now.
							</div>
						)}

						{!transactionsError && transactions.length === 0 && (
							<div className="flex items-center justify-between rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
								<div>
									No transactions yet.
									<span className="ml-2 text-foreground font-medium">
										{isWallet
											? 'Use the Add Transaction button to record your first one.'
											: 'Use the quick actions above to create your first one.'}
									</span>
								</div>
								<ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
							</div>
						)}

						{!transactionsError && transactions.length > 0 && (
							<div className="space-y-2.5">
								{transactions.slice(0, 10).map((tx) => {
									const badge = typeBadge(tx.type, isWallet)
									const badgeLabel = tx.is_initial ? `${badge.label} (Initial)` : badge.label
									const visuals = getActivityVisuals(tx.type, isWallet)
									const TxIcon = visuals.Icon
									const primaryTitle = tx.description || tx.category || badgeLabel

									return (
										<div
											key={tx.id}
											className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 p-3.5 transition-colors hover:bg-muted/40"
										>
											<div className="flex items-start sm:items-center gap-3 min-w-0">
												<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visuals.iconBoxClass}`}>
													<TxIcon className="h-4 w-4" aria-hidden />
												</div>
												<div className="min-w-0 space-y-1">
													<p className="text-sm font-semibold text-foreground truncate">
														{primaryTitle}
													</p>
													<div className="flex flex-wrap items-center gap-1.5">
														<span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>
															{badgeLabel}
														</span>
														{tx.category && tx.description && (
															<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
																{tx.category}
															</span>
														)}
														{tx.type === 'transfer' && tx.transfer_to_account_name ? (
															<span className="rounded-full bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
																{tx.account_name || 'Cash'} → {tx.transfer_to_account_name}
															</span>
														) : tx.account_name ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
																<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
																{tx.account_name}
															</span>
														) : null}
														<span className="text-[11px] text-muted-foreground">
															· {dateFormatter.format(new Date(tx.occurred_at || tx.created_at))}
														</span>
													</div>
												</div>
											</div>

											<div className={`shrink-0 text-right font-mono text-sm sm:text-base font-bold tabular-nums ${visuals.amountClass}`}>
												{formatAmount(tx.type, tx.amount, organization?.currency, isWallet)}
											</div>
										</div>
									)
								})}
							</div>
						)}
						{transactions.length > 0 && (
							<div className="pt-2 border-t border-border/60 mt-4">
								<Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
									<Link href={`/organizations/${id}/records`}>
										{isWallet ? 'View full transaction history →' : 'View all transactions →'}
									</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
			{isWallet && <WalletFab organizationId={id} accounts={accounts} currency={organization?.currency} />}
		</div>
	)
}