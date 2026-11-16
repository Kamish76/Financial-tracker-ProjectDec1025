import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Totals } from '@/lib/finance'
import { formatCurrency } from '@/lib/utils'

type StatProps = {
  totals: Totals
  currency?: string
}

export function StatsCards({ totals, currency }: StatProps) {
  const items = [
    { label: 'Total Income', value: totals.totalIncome },
    { label: 'Actual Expenses (no capital)', value: totals.actualExpensesWithoutCapital },
    { label: 'Cash on Hand', value: totals.cashOnHand },
    { label: 'Capital', value: totals.expensesCapital },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{it.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{formatCurrency(it.value, currency)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
