import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Totals } from '@/lib/finance'

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

type StatProps = {
  totals: Totals
}

export function StatsCards({ totals }: StatProps) {
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
            <div className="text-2xl font-semibold text-foreground">{formatter.format(it.value)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
