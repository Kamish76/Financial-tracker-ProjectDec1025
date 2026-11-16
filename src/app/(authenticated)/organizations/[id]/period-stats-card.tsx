"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  calculatePeriodComparison,
  calculateTopExpenseCategories,
  type PeriodStats,
  type ClientTransaction,
} from "@/lib/finance-client"
import { formatCurrency } from "@/lib/utils"

function formatDateRange(startDate: Date, endDate: Date, periodType: "weekly" | "monthly"): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }

  if (periodType === "weekly") {
    const start = startDate.toLocaleDateString("en-US", options)
    const end = endDate.toLocaleDateString("en-US", options)
    return `Current week: ${start} - ${end}`
  } else {
    return `Current month: ${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
  }
}

type PeriodStatsCardProps = {
  allTransactions: ClientTransaction[]
  calculatePeriodStats: (txs: ClientTransaction[], period: "weekly" | "monthly") => PeriodStats
  currency?: string
}

export function PeriodStatsCard({ allTransactions, calculatePeriodStats, currency }: PeriodStatsCardProps) {
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("monthly")
  const stats = calculatePeriodStats(allTransactions, periodType)
  const comparison = calculatePeriodComparison(allTransactions, periodType)
  const topCategories = calculateTopExpenseCategories(allTransactions, periodType, 5)
  const prevLabel = periodType === "weekly" ? "last week" : "last month"

  const formatDelta = (delta: number | null) => {
    if (delta === null) return null
    const sign = delta >= 0 ? "+" : ""
    return `${sign}${delta.toFixed(1)}% vs ${prevLabel}`
  }

  const netColor =
    stats.net > 0 ? "text-green-600 dark:text-green-500" : stats.net < 0 ? "text-red-600 dark:text-red-500" : ""

  const periodLabel = formatDateRange(stats.startDate, stats.endDate, stats.periodType)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Period Summary</CardTitle>
            <p className="text-xs text-muted-foreground mt-2">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={periodType === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodType("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={periodType === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodType("monthly")}
            >
              Monthly
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Income Card */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Income</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.income, currency)}</p>
            {comparison.incomeDeltaPct !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDelta(comparison.incomeDeltaPct)}
              </p>
            )}
          </div>

          {/* Expenses Card */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Expenses</p>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.expenses, currency)}</p>
            {comparison.expenseDeltaPct !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDelta(comparison.expenseDeltaPct)}
              </p>
            )}
          </div>

          {/* Net Card */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Net</p>
            <p className={`text-2xl font-semibold ${netColor}`}>{formatCurrency(stats.net, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.transactionCount} tx{stats.transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Savings Rate & Daily Avg Spend */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border px-4 py-3 bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Savings Rate</span>
            <span className="text-sm font-semibold text-foreground">
              {comparison.savingsRatePct === null
                ? "—"
                : `${comparison.savingsRatePct.toFixed(1)}%`}
            </span>
          </div>
          <div className="rounded-lg border px-4 py-3 bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Daily Avg Spend ({comparison.daysElapsed}d)
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(comparison.dailyAvgSpend, currency)}/day
            </span>
          </div>
        </div>

        {/* Top Expense Categories */}
        {topCategories.items.length > 0 ? (
          <div className="pt-3 border-t space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Expense Categories ({periodType === "weekly" ? "This Week" : "This Month"})
              </p>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(topCategories.totalExpenses, currency)} total
              </span>
            </div>
            <div className="space-y-2">
              {topCategories.items.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate">{item.category}</span>
                    <span className="text-muted-foreground shrink-0">
                      {formatCurrency(item.amount, currency)} ({item.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(4, item.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center pt-2">
            {stats.transactionCount === 0
              ? "No transactions in this period"
              : "No expenses recorded in this period"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
