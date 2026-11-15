"use client"

import { useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Receipt,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { FilteredStats } from "@/lib/finance-client"
import { formatCurrency } from "@/lib/utils"

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: "Income",
  expense_business: "Business Expenses",
  expense_personal: "Personal Expenses",
  held_allocate: "Held Allocations",
  held_return: "Held Returns",
  transfer: "Transfers",
}

type FilteredStatsCardProps = {
  stats: FilteredStats | null
  isLoading?: boolean
  currency?: string
}

export function FilteredStatsCard({ stats, isLoading = false, currency }: FilteredStatsCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  if (isLoading) {
    return (
      <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">—</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.count === 0) {
    return (
      <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No transactions match the applied filters
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalIncome = stats.byType.income || 0
  const totalExpenses = (stats.byType.expense_business || 0) + (stats.byType.expense_personal || 0)

  const mainCards = [
    {
      label: "Total Income",
      value: formatCurrency(totalIncome, currency),
      highlight: "text-emerald-600 dark:text-emerald-400",
      cardClass: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card",
      iconClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
      Icon: ArrowDownLeft,
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totalExpenses, currency),
      highlight: "text-rose-600 dark:text-rose-400",
      cardClass: "border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] via-card to-card",
      iconClass: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
      Icon: ArrowUpRight,
    },
    {
      label: "Gross Profit",
      value: formatCurrency(stats.grossProfit, currency),
      highlight:
        stats.grossProfit > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : stats.grossProfit < 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground",
      cardClass: "border-border/80 bg-card",
      iconClass: "bg-accent/12 text-accent-strong",
      Icon: TrendingUp,
    },
    {
      label: "Transaction Count",
      value: stats.count.toString(),
      highlight: "text-foreground",
      cardClass: "border-border/80 bg-card",
      iconClass: "bg-muted text-muted-foreground",
      Icon: Receipt,
    },
  ]

  const totalAmount = stats.totalAmount > 0 ? stats.totalAmount : 0

  return (
    <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 space-y-3">
      {/* Main stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainCards.map((card) => {
          const Icon = card.Icon
          return (
            <Card key={card.label} className={`${card.cardClass} shadow-2xs`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`font-mono text-2xl font-bold tabular-nums ${card.highlight || ""}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Type breakdown toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full sm:w-auto"
        >
          {showBreakdown ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide Type Breakdown
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Type Breakdown
            </>
          )}
        </Button>

        {showBreakdown && (
          <div className="mt-3 rounded-xl border border-border/70 p-4 bg-muted/35">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {Object.entries(stats.byType).map(([type, amount]) => {
                const share = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0
                return (
                  <div
                    key={type}
                    className="rounded-lg border border-border/60 bg-card/80 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        {TRANSACTION_TYPE_LABELS[type] || type}
                      </p>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {share}%
                      </span>
                    </div>
                    <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(amount, currency)}
                    </p>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent-strong"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
