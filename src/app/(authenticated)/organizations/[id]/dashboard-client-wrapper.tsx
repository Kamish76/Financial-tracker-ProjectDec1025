"use client"

import { PeriodStatsCard } from './period-stats-card'
import { calculatePeriodStats, type ClientTransaction } from '@/lib/finance-client'

type DashboardClientWrapperProps = {
  allTransactions: ClientTransaction[]
  currency?: string
}

export function DashboardClientWrapper({ allTransactions, currency }: DashboardClientWrapperProps) {
  return <PeriodStatsCard allTransactions={allTransactions} calculatePeriodStats={calculatePeriodStats} currency={currency} />
}
