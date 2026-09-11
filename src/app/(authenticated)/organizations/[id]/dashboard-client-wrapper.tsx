"use client"

import { PeriodStatsCard } from './period-stats-card'
import { calculatePeriodStats } from '@/lib/finance-client'

type DashboardClientWrapperProps = {
  allTransactions: any[]
  currency?: string
}

export function DashboardClientWrapper({ allTransactions, currency }: DashboardClientWrapperProps) {
  return <PeriodStatsCard allTransactions={allTransactions} calculatePeriodStats={calculatePeriodStats} currency={currency} />
}
