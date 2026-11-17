import type { MemberBalance } from '@/lib/finance'
import { formatCurrency } from '@/lib/utils'

type Props = {
  members: MemberBalance[]
  currency?: string
}

export function MemberBalancesTable({ members, currency }: Props) {
  if (!members || members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        No members found for this organization.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Member</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Business Held</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.user_id} className="border-t">
              <td className="px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">
                    {m.email ?? m.user_id}
                    {m.is_active === false && (
                      <span className="text-muted-foreground ml-2">(Inactive)</span>
                    )}
                  </span>
                  {m.role && <span className="text-xs text-muted-foreground">{m.role}</span>}
                </div>
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(m.businessHeld, currency)}</td>
              <td className="px-3 py-2 text-right font-semibold">{formatCurrency(m.outstandingReimbursable, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
