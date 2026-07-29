'use client'

import React from 'react'
import Link from 'next/link'
import { Wallet, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AccountWithBalance } from '@/lib/wallet-accounts'

type Props = {
  organizationId: string
  accounts: AccountWithBalance[]
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function WalletTotalBalanceCard({ organizationId, accounts }: Props) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-md transition-all hover:shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Personal Wallet
              </CardDescription>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Total Balance
              </CardTitle>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
          >
            {accounts.length} {accounts.length === 1 ? 'Active Account' : 'Active Accounts'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {formatter.format(totalBalance)}
            </span>
            <Link
              href={`/organizations/${organizationId}/accounts`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 hover:underline transition-colors"
            >
              Manage accounts
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {accounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{acc.name}:</span>
                  <span className="text-muted-foreground font-normal">
                    {formatter.format(acc.current_balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
