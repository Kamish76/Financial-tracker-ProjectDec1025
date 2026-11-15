import { ArrowDownLeft, ArrowUpRight, Landmark, Layers, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Totals } from '@/lib/finance'
import { formatCurrency } from '@/lib/utils'

type StatProps = {
  totals: Totals
  currency?: string
}

export function StatsCards({ totals, currency }: StatProps) {
  const isNetPositive = totals.actualExpensesVsIncome >= 0

  const kpiItems = [
    {
      label: 'Total Income',
      value: totals.totalIncome,
      subtitle: 'Gross revenue logged',
      icon: ArrowDownLeft,
      cardClass: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card',
      iconClass: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
      valueClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Actual Expenses (no capital)',
      value: totals.actualExpensesWithoutCapital,
      subtitle: 'Operational spending',
      icon: ArrowUpRight,
      cardClass: 'border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] via-card to-card',
      iconClass: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
      valueClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Capital',
      value: totals.expensesCapital,
      subtitle: 'Out-of-pocket & capital',
      icon: Layers,
      cardClass: 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-card to-card',
      iconClass: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
      valueClass: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Hero Treasury Card: Cash on Hand */}
      <Card className="relative overflow-hidden border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card shadow-sm transition-shadow hover:shadow-md">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/15 blur-2xl"
        />
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
                <Landmark className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                  Organization Treasury
                </CardDescription>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cash on Hand
                </CardTitle>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                isNetPositive
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              {isNetPositive ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              )}
              <span>Net vs Income:</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatCurrency(totals.actualExpensesVsIncome, currency)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatCurrency(totals.cashOnHand, currency)}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Business Exp:{' '}
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.totalExpensesBusiness, currency)}
                </span>
              </span>
              <span>
                Personal Exp:{' '}
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.totalExpensesPersonal, currency)}
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 Companion KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpiItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className={`${item.cardClass} transition-shadow hover:shadow-sm`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </CardTitle>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconClass}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className={`font-mono text-2xl font-bold tabular-nums ${item.valueClass}`}>
                  {formatCurrency(item.value, currency)}
                </div>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
