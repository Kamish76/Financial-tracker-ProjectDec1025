"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { FilteredStats } from "@/lib/finance"

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: "Income",
  expense_business: "Business Expenses",
  expense_personal: "Personal Expenses",
  held_allocate: "Held Allocations",
  held_return: "Held Returns",
}

type FilteredStatsCardProps = {
  stats: FilteredStats | null
  isLoading?: boolean
}

export function FilteredStatsCard({ stats, isLoading = false }: FilteredStatsCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  if (isLoading) {
    return (
      <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="grid gap-4 sm:grid-cols-3 animate-pulse">
          {[1, 2, 3].map((i) => (
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
      label: "Total Amount",
      value: formatter.format(stats.totalAmount),
    },
    {
      label: "Transaction Count",
      value: stats.count.toString(),
    },
    {
      label: "Gross Profit",
      value: formatter.format(stats.grossProfit),
      highlight: stats.grossProfit > 0 ? "text-green-600" : stats.grossProfit < 0 ? "text-red-600" : "",
    },
  ]

  return (
    <div className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 space-y-3">
      {/* Main stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="mt-3 rounded-lg border p-4 bg-muted/50">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(stats.byType).map(([type, amount]) => (
                <div key={type} className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {TRANSACTION_TYPE_LABELS[type]}
                  </p>
                  <p className="text-sm font-semibold">{formatter.format(amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
