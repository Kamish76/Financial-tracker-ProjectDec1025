import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, ScrollText, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CardSkeleton, RecentActivitySkeleton } from '@/components/page-skeleton'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrgMembership } from '@/lib/auth/guards'
import { isWalletOrganization } from '@/lib/wallet'
import { getUserMirrorableWalletAccounts } from '@/lib/wallet-accounts'
import { AddIncomeSheet } from './add-income-sheet'
import { AddExpenseSheet } from './add-expense-sheet'
import { RefundSheet } from './refund-sheet'
import { CustomizableDashboard, type DashboardSection } from './customizable-dashboard'
import { WalletQuickActions } from './wallet-quick-actions'
import { ManageCategoriesButton } from './manage-categories-button'
import {
  MemberBalancesSection,
  OverviewStatsSection,
  PeriodSummarySection,
  RecentActivitySection,
  WalletFabSection,
} from './dashboard-sections'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function OrganizationFinancePage({ params }: PageProps) {
  const { id } = await params
  const adminClient = createAdminClient()

  const [{ membership: effectiveMembership }, { data: organization }] = await Promise.all([
    requireOrgMembership(id),
    adminClient
      .from('organizations')
      .select('id, name, description, currency')
      .eq('id', id)
      .maybeSingle(),
  ])

  const isWallet = isWalletOrganization(organization?.description)
  const canManage = effectiveMembership?.role === 'owner' || effectiveMembership?.role === 'admin'
  const mirrorContext = !isWallet && canManage ? await getUserMirrorableWalletAccounts(id) : null

  const topStatsNode = (
    <Suspense fallback={<CardSkeleton heightClass="h-32" />}>
      <OverviewStatsSection
        organizationId={id}
        isWallet={isWallet}
        currency={organization?.currency}
      />
    </Suspense>
  )

  const periodStatsNode = (
    <Suspense fallback={<CardSkeleton heightClass="h-56" />}>
      <PeriodSummarySection
        organizationId={id}
        isWallet={isWallet}
        currency={organization?.currency}
      />
    </Suspense>
  )

  const quickActionsNode = !isWallet ? (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Quick actions open sheets for fast entry. Add income, expenses, and refunds.
            </CardDescription>
          </div>
          <div className="rounded-full bg-accent-strong text-white p-2">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {canManage ? (
          <AddIncomeSheet
            organizationId={id}
            organizationDescription={organization?.description}
            currency={organization?.currency}
            mirrorContext={mirrorContext}
          />
        ) : (
          <Button type="button" className="w-full justify-start gap-2" disabled aria-disabled>
            Add income (insufficient permissions)
          </Button>
        )}
        {canManage ? (
          <AddExpenseSheet
            organizationId={id}
            organizationDescription={organization?.description}
            currency={organization?.currency}
            mirrorContext={mirrorContext}
          />
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
        {canManage ? (
          <RefundSheet
            organizationId={id}
            currency={organization?.currency}
            mirrorContext={mirrorContext}
          />
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
        <ManageCategoriesButton organizationId={id} disabled={!canManage} />
      </CardContent>
    </Card>
  ) : null

  const secondarySectionNode = !isWallet ? (
    <Suspense fallback={<CardSkeleton heightClass="h-48" />}>
      <MemberBalancesSection organizationId={id} currency={organization?.currency} />
    </Suspense>
  ) : (
    <WalletQuickActions organizationId={id} canManage={canManage} />
  )

  const recentActivityNode = (
    <Suspense fallback={<RecentActivitySkeleton />}>
      <RecentActivitySection
        organizationId={id}
        isWallet={isWallet}
        currency={organization?.currency}
        canManage={canManage}
      />
    </Suspense>
  )

  const sections: DashboardSection[] = [
    { id: 'overview-stats', label: isWallet ? 'Wallet Balance' : 'Overview Stats', node: topStatsNode },
    { id: 'period-summary', label: 'Period Summary & Categories', node: periodStatsNode },
    ...(quickActionsNode
      ? [{ id: 'quick-actions', label: 'Quick Actions', node: quickActionsNode }]
      : []),
    {
      id: isWallet ? 'wallet-accounts' : 'member-balances',
      label: isWallet ? 'Quick Actions' : 'Member Balances',
      node: secondarySectionNode,
    },
    {
      id: 'recent-activity',
      label: isWallet ? 'Recent Wallet Activity' : 'Recent Activity',
      node: recentActivityNode,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
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

      <CustomizableDashboard organizationId={id} sections={sections} />

      {isWallet && (
        <Suspense fallback={null}>
          <WalletFabSection organizationId={id} currency={organization?.currency} />
        </Suspense>
      )}
    </div>
  )
}
