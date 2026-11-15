import { Crown, Shield, User } from 'lucide-react'
import type { MemberBalance } from '@/lib/finance'
import { formatCurrency } from '@/lib/utils'

type Props = {
  members: MemberBalance[]
  currency?: string
}

function getInitials(label: string): string {
  const clean = label.trim()
  if (!clean) return '?'
  const beforeAt = clean.split('@')[0] || clean
  const parts = beforeAt.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return beforeAt.slice(0, 2).toUpperCase()
}

function RoleBadge({ role }: { role?: string | null }) {
  const normalized = (role || 'member').toLowerCase()
  const config =
    normalized === 'owner'
      ? {
          icon: Crown,
          label: 'Owner',
          className: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
        }
      : normalized === 'admin'
      ? {
          icon: Shield,
          label: 'Admin',
          className: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25',
        }
      : {
          icon: User,
          label: role || 'Member',
          className: 'bg-muted text-muted-foreground border-border/70',
        }

  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${config.className}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {config.label}
    </span>
  )
}

export function MemberBalancesTable({ members, currency }: Props) {
  if (!members || members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground text-center">
        No members found for this organization.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/50">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border/70">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Member
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Business Held
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outstanding
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {members.map((m) => {
            const displayLabel = m.email ?? m.user_id
            const hasOutstanding = m.outstandingReimbursable > 0

            return (
              <tr key={m.user_id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-strong text-xs font-bold">
                      {getInitials(displayLabel)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground font-medium truncate">
                          {displayLabel}
                        </span>
                        {m.is_active === false && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>
                      {m.role && <RoleBadge role={m.role} />}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium tabular-nums text-foreground">
                  {formatCurrency(m.businessHeld, currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  {hasOutstanding ? (
                    <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/12 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-amber-700 dark:text-amber-300">
                      {formatCurrency(m.outstandingReimbursable, currency)}
                    </span>
                  ) : (
                    <span className="font-mono text-sm font-medium tabular-nums text-muted-foreground">
                      {formatCurrency(m.outstandingReimbursable, currency)}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
