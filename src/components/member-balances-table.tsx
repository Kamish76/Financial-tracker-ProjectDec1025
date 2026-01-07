import type { MemberBalance } from '@/lib/finance'

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

type Props = {
  members: MemberBalance[]
}

export function MemberBalancesTable({ members }: Props) {
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
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Personal Contributed</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Reimbursed Paid</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.user_id} className="border-t">
              <td className="px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">{m.email ?? m.user_id}</span>
                  {m.role && <span className="text-xs text-muted-foreground">{m.role}</span>}
                </div>
              </td>
              <td className="px-3 py-2 text-right">{formatter.format(m.businessHeld)}</td>
              <td className="px-3 py-2 text-right">{formatter.format(m.contributedPersonal)}</td>
              <td className="px-3 py-2 text-right">{formatter.format(m.reimbursementsPaid)}</td>
              <td className="px-3 py-2 text-right font-semibold">{formatter.format(m.outstandingReimbursable)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
