"use client"

import { PeriodStatsCard } from './period-stats-card'
import { calculatePeriodStats } from '@/lib/finance-client'

type DashboardClientWrapperProps = {
  allTransactions: any[]
}

export function DashboardClientWrapper({ allTransactions }: DashboardClientWrapperProps) {
  return <PeriodStatsCard allTransactions={allTransactions} calculatePeriodStats={calculatePeriodStats} />
}
