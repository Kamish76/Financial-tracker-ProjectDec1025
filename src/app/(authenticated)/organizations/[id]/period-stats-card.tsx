"use client"

import { useState } from "react"
import { Activity, CalendarDays, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PeriodStats, ClientTransaction } from "@/lib/finance-client"
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

  const netColor =
    stats.net > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.net < 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-foreground"

  const periodLabel = formatDateRange(stats.startDate, stats.endDate, stats.periodType)

  const totalFlow = stats.income + stats.expenses
  const incomePct = totalFlow > 0 ? Math.round((stats.income / totalFlow) * 100) : 0
  const expensePct = totalFlow > 0 ? 100 - incomePct : 0

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Period Summary</CardTitle>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/80" aria-hidden />
              <span>{periodLabel}</span>
            </p>
          </div>
          <div
            role="group"
            aria-label="Period selector"
            className="inline-flex self-start sm:self-auto items-center rounded-xl border border-border/70 bg-muted/70 p-1 gap-1"
          >
            <button
              type="button"
              onClick={() => setPeriodType("weekly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                periodType === "weekly"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPeriodType("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                periodType === "monthly"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Income Card */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Income</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.income, currency)}
            </p>
          </div>

          {/* Expenses Card */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Expenses</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/12 text-rose-600 dark:text-rose-400">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(stats.expenses, currency)}
            </p>
          </div>

          {/* Net Card */}
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Net</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border/70 text-foreground">
                <Activity className="h-3.5 w-3.5" aria-hidden />
              </div>
            </div>
            <p className={`font-mono text-2xl font-bold tabular-nums ${netColor}`}>
              {formatCurrency(stats.net, currency)}
            </p>
          </div>
        </div>

        {/* Visual Cashflow Ratio Bar */}
        {totalFlow > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/25 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Income {incomePct}%
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-300">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Expenses {expensePct}%
                </span>
              </div>
              <span className="rounded-full bg-background border border-border/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {stats.transactionCount} transaction{stats.transactionCount !== 1 ? "s" : ""} in this period
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {incomePct > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${incomePct}%` }}
                />
              )}
              {expensePct > 0 && (
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${expensePct}%` }}
                />
              )}
            </div>
          </div>
        )}

        {totalFlow === 0 && stats.transactionCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {stats.transactionCount} transaction{stats.transactionCount !== 1 ? "s" : ""} in this period
          </p>
        )}
        {stats.transactionCount === 0 && (
          <p className="text-xs text-muted-foreground text-center py-1">No transactions in this period</p>
        )}
      </CardContent>
    </Card>
  )
}
