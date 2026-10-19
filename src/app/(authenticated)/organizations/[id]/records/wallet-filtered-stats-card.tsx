"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { FilteredStats } from "@/lib/finance-client"
import { formatCurrency } from "@/lib/utils"

type WalletFilteredStatsCardProps = {
  stats: FilteredStats | null
  isLoading?: boolean
  currency?: string
}

export function WalletFilteredStatsCard({
  stats,
  isLoading = false,
  currency,
}: WalletFilteredStatsCardProps) {
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No transactions match the applied filters
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mainCards = [
    {
      label: "Total Income",
      value: formatCurrency(stats.totalIncome, currency),
      highlight: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(stats.totalExpenses, currency),
      highlight: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Net Balance",
      value: formatCurrency(stats.netBalance, currency),
      highlight:
        stats.netBalance > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : stats.netBalance < 0
          ? "text-rose-600 dark:text-rose-400"
          : "",
    },
    {
      label: "Transaction Count",
      value: stats.count.toString(),
    },
  ]

  const walletBreakdown = [
    { label: "Income", amount: stats.byType.income },
    { label: "Expenses", amount: stats.totalExpenses },
    { label: "Transfers", amount: stats.byType.transfer },
  ]

  return (
    <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 space-y-3">
      {/* Main stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold text-foreground ${card.highlight || ""}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Type breakdown toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full sm:w-auto text-xs"
        >
          {showBreakdown ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
              Hide Type Breakdown
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
              Show Type Breakdown
            </>
          )}
        </Button>

        {showBreakdown && (
          <div className="mt-3 rounded-lg border p-4 bg-muted/50">
            <div className="grid gap-3 sm:grid-cols-3">
              {walletBreakdown.map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold">{formatCurrency(item.amount, currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
