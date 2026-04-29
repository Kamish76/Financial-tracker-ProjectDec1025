"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { PeriodStats } from "@/lib/finance-client"

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

function formatDateRange(startDate: Date, endDate: Date, periodType: "weekly" | "monthly"): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }

  if (periodType === "weekly") {
    const start = startDate.toLocaleDateString("en-US", options)
    const end = endDate.toLocaleDateString("en-US", options)
    return `Week of ${start} - ${end}`
  } else {
    return startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }
}

type PeriodStatsCardProps = {
  allTransactions: any[]
  calculatePeriodStats: (txs: any[], period: "weekly" | "monthly") => PeriodStats
}

export function PeriodStatsCard({ allTransactions, calculatePeriodStats }: PeriodStatsCardProps) {
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly")
  const stats = calculatePeriodStats(allTransactions, periodType)

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

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Income Card */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Income</p>
            <p className="text-2xl font-semibold text-green-600">{formatter.format(stats.income)}</p>
          </div>

          {/* Expenses Card */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Expenses</p>
            <p className="text-2xl font-semibold text-red-600">{formatter.format(stats.expenses)}</p>
          </div>

          {/* Net Card */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Net</p>
            <p className={`text-2xl font-semibold ${netColor}`}>{formatter.format(stats.net)}</p>
          </div>
        </div>

        {stats.transactionCount > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            {stats.transactionCount} transaction{stats.transactionCount !== 1 ? "s" : ""} in this period
          </p>
        )}
        {stats.transactionCount === 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">No transactions in this period</p>
        )}
      </CardContent>
    </Card>
  )
}
