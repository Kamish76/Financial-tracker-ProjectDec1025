'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftRight,
  ArrowRightLeft,
  PlusCircle,
  ReceiptText,
  ScrollText,
  Settings,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddTransactionModal } from '@/components/wallet/add-transaction-modal'
import type { AccountWithBalance } from '@/lib/wallet-types'

type WalletQuickActionsProps = {
  organizationId: string
  accounts: AccountWithBalance[]
  currency?: string
  canManage: boolean
}

export function WalletQuickActions({
  organizationId,
  accounts,
  currency,
  canManage,
}: WalletQuickActionsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<'income' | 'expense' | 'transfer'>('expense')

  const openModal = (tab: 'income' | 'expense' | 'transfer') => {
    setInitialTab(tab)
    setModalOpen(true)
  }

  const hasAccounts = accounts.length > 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Record income, expenses, or transfers, and jump to your sub accounts, history, or settings.
              </CardDescription>
            </div>
            <div className="rounded-full bg-accent-strong text-white p-2">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {canManage && (
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Button
                type="button"
                className="w-full justify-start gap-2"
                disabled={!hasAccounts}
                onClick={() => openModal('income')}
              >
                <PlusCircle className="h-4 w-4" />
                Add Income
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-start gap-2"
                disabled={!hasAccounts}
                onClick={() => openModal('expense')}
              >
                <ReceiptText className="h-4 w-4" />
                Add Expense
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={accounts.length < 2}
                onClick={() => openModal('transfer')}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-1 border-t border-border/60">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/organizations/${organizationId}/accounts`}>
                <Wallet className="h-4 w-4 mr-2" />
                Manage Sub Accounts
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/organizations/${organizationId}/records`}>
                <ScrollText className="h-4 w-4 mr-2" />
                Transaction History
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/organizations/${organizationId}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Wallet Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        organizationId={organizationId}
        accounts={accounts}
        currency={currency}
        initialTab={initialTab}
      />
    </>
  )
}
