import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Totals } from '@/lib/finance'
import { formatCurrency } from '@/lib/utils'

type StatProps = {
  totals: Totals
  currency?: string
  totalOwedToMembers?: number
}

export function StatsCards({ totals, currency, totalOwedToMembers = 0 }: StatProps) {
  const netProfit = totals.totalIncome - totals.actualExpensesWithoutCapital
  const marginPct =
    totals.totalIncome > 0 ? (netProfit / totals.totalIncome) * 100 : null
  const freeCash = totals.cashOnHand - totalOwedToMembers

  const items: Array<{ label: string; value: number; subtitle?: string }> = [
    { label: 'Total Income', value: totals.totalIncome },
    { label: 'Actual Expenses (no capital)', value: totals.actualExpensesWithoutCapital },
    { label: 'Cash on Hand', value: totals.cashOnHand },
    { label: 'Capital', value: totals.expensesCapital },
    {
      label: 'Net Profit & Margin',
      value: netProfit,
      subtitle: marginPct === null ? 'No income recorded' : `${marginPct.toFixed(1)}% operating margin`,
    },
    {
      label: 'Free Cash (After Members)',
      value: freeCash,
      subtitle: `Owed to members: ${formatCurrency(totalOwedToMembers, currency)}`,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{it.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{formatCurrency(it.value, currency)}</div>
            {it.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{it.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
