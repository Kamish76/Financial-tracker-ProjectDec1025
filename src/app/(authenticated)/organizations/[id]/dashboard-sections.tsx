import { cache } from 'react'
import Link from 'next/link'
import { ArrowLeftRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrganizationStats } from '@/lib/finance'
import type { ClientTransaction } from '@/lib/finance-client'
import { formatCurrency } from '@/lib/utils'
import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import type { AccountWithBalance } from '@/lib/wallet-types'
import { StatsCards } from '@/components/stats-cards'
import { MemberBalancesTable } from '@/components/member-balances-table'
import { WalletFab } from '@/components/wallet/wallet-fab'
import { WalletTotalBalanceCard } from '@/components/wallet/wallet-total-balance-card'
import { DashboardClientWrapper } from './dashboard-client-wrapper'
import { RecentActivityActions } from './recent-activity-actions'

const getCachedWalletAccounts = cache((orgId: string) => getAccountsWithBalances(orgId, false))
const getCachedOrgStats = cache((orgId: string) => getOrganizationStats(orgId))

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
    expense_personal: {
      label: isWallet ? 'Expense' : 'Expense (Personal)',
      className: isWallet
        ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40'
        : 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40',
    },
    expense: { label: 'Expense', className: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40' },
    held_allocate: { label: 'Allocation +', className: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40' },
    held_return: { label: 'Allocation −', className: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40' },
    transfer: { label: 'Transfer', className: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40' },
  }

  return map[type] || { label: type, className: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' }
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
  account_id?: string | null
  transfer_to_account_id?: string | null
  account?: { name?: string | null } | null
  transfer_to_account?: { name?: string | null } | null
}

export async function OverviewStatsSection({
  organizationId,
  isWallet,
  currency,
}: {
  organizationId: string
  isWallet: boolean
  currency?: string
}) {
  if (isWallet) {
    const accounts = await getCachedWalletAccounts(organizationId)
    return <WalletTotalBalanceCard organizationId={organizationId} accounts={accounts} currency={currency} />
  }

  const stats = await getCachedOrgStats(organizationId)
  const totalOwedToMembers = stats.members.reduce(
    (sum, m) => sum + Math.max(0, m.outstandingReimbursable),
    0
  )

  return <StatsCards totals={stats.totals} currency={currency} totalOwedToMembers={totalOwedToMembers} />
}

export async function PeriodSummarySection({
  organizationId,
  isWallet,
  currency,
}: {
  organizationId: string
  isWallet: boolean
  currency?: string
}) {
  const adminClient = createAdminClient()
  let query = adminClient
    .from('transactions')
    .select('id, type, amount, category, occurred_at, created_at')
    .eq('organization_id', organizationId)

  if (isWallet) {
    const now = new Date()
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfPrevWeek = new Date(now)
    startOfPrevWeek.setDate(now.getDate() - now.getDay() - 7)
    startOfPrevWeek.setHours(0, 0, 0, 0)
    const periodCutoff = startOfPrevMonth < startOfPrevWeek ? startOfPrevMonth : startOfPrevWeek
    query = query.gte('occurred_at', periodCutoff.toISOString())
  } else {
    query = query
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(365)
  }

  const { data } = await query
  const periodTransactions: ClientTransaction[] = (
    (data || []) as Array<{
      id: string
      type: string
      amount: number | null
      category: string | null
      occurred_at: string | null
      created_at: string
    }>
  ).map((tx) => ({
    id: tx.id,
    amount: Number(tx.amount ?? 0),
    type: tx.type,
    category: tx.category,
    occurred_at: tx.occurred_at ?? null,
    created_at: tx.created_at,
  }))

  return <DashboardClientWrapper allTransactions={periodTransactions} currency={currency} />
}

export async function MemberBalancesSection({
  organizationId,
  currency,
}: {
  organizationId: string
  currency?: string
}) {
  const stats = await getCachedOrgStats(organizationId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member balances</CardTitle>
        <CardDescription>Business funds held and outstanding personal contributions.</CardDescription>
      </CardHeader>
      <CardContent>
        <MemberBalancesTable members={stats.members} currency={currency} />
      </CardContent>
    </Card>
  )
}

export async function RecentActivitySection({
  organizationId,
  isWallet,
  currency,
  canManage,
}: {
  organizationId: string
  isWallet: boolean
  currency?: string
  canManage: boolean
}) {
  const adminClient = createAdminClient()

  const [recentTxResult, accounts] = await Promise.all([
    adminClient
      .from('transactions')
      .select(
        'id, type, amount, category, description, occurred_at, created_at, is_initial, account_id, transfer_to_account_id, account:wallet_accounts!account_id(id, name), transfer_to_account:wallet_accounts!transfer_to_account_id(id, name)'
      )
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(10),
    isWallet && canManage ? getCachedWalletAccounts(organizationId) : Promise.resolve([] as AccountWithBalance[]),
  ])

  const transactionsError = recentTxResult.error
  if (transactionsError) {
    console.error('[ORG_PAGE] Transactions error', { orgId: organizationId, error: transactionsError.message })
  }

  const transactionRows = (recentTxResult.data || []) as unknown as RawTransactionRow[]
  const transactions = transactionRows.map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount ?? 0),
    category: row.category,
    description: row.description,
    occurred_at: row.occurred_at ?? null,
    created_at: row.created_at,
    is_initial: row.is_initial ?? false,
    account_id: row.account_id ?? null,
    transfer_to_account_id: row.transfer_to_account_id ?? null,
    account_name: row.account?.name ?? null,
    transfer_to_account_name: row.transfer_to_account?.name ?? null,
  }))

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{isWallet ? 'Recent Wallet Activity' : 'Recent activity'}</CardTitle>
            <CardDescription>
              {isWallet
                ? 'Latest transactions recorded in your personal wallet.'
                : '10 most recent changes for this organization.'}
            </CardDescription>
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
                <span className="ml-2 text-foreground">
                  {isWallet
                    ? 'Use the Add Transaction button to record your first one.'
                    : 'Use the quick actions to create your first one.'}
                </span>
              </div>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {!transactionsError && transactions.length > 0 && (
            <div className="divide-y divide-border/70 rounded-xl border border-border/70">
              {transactions.map((tx) => {
                const badge = typeBadge(tx.type, isWallet)
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
                      {tx.description && <p className="text-sm text-foreground">{tx.description}</p>}
                      <p className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(tx.occurred_at || tx.created_at))}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div
                        className={`text-right text-base font-semibold ${
                          isWallet
                            ? tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : tx.type === 'transfer'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-rose-600 dark:text-rose-400'
                            : 'text-foreground'
                        }`}
                      >
                        {formatAmount(tx.type, tx.amount, currency, isWallet)}
                      </div>
                      {canManage && (
                        <RecentActivityActions
                          organizationId={organizationId}
                          isWallet={isWallet}
                          currency={currency}
                          accounts={accounts}
                          transaction={tx}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {transactions.length > 0 && (
            <div className="pt-2 border-t mt-4">
              <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                <Link href={`/organizations/${organizationId}/records`}>
                  {isWallet ? 'View full transaction history →' : 'View all transactions →'}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export async function WalletFabSection({
  organizationId,
  currency,
}: {
  organizationId: string
  currency?: string
}) {
  const accounts = await getCachedWalletAccounts(organizationId)
  return <WalletFab organizationId={organizationId} accounts={accounts} currency={currency} />
}
