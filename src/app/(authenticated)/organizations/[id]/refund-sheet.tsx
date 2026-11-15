"use client"

import { RefreshCw } from "lucide-react"
import { OrgTransactionDrawer } from "./org-transaction-drawer"

type RefundSheetProps = {
  organizationId: string
  currency?: string
}

export function RefundSheet({ organizationId, currency }: RefundSheetProps) {
  return (
    <OrgTransactionDrawer
      organizationId={organizationId}
      currency={currency}
      initialTab="refund"
      trigger={
        <button
          type="button"
          data-intent="refund"
          aria-label="Open refund modal"
          className="group flex w-full items-center gap-3.5 rounded-xl border border-purple-500/25 bg-purple-500/[0.05] p-3.5 text-left transition-all hover:border-purple-500/50 hover:bg-purple-500/[0.1] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-105">
            <RefreshCw className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Refund</p>
            <p className="text-xs text-muted-foreground truncate">Reimburse personal claims</p>
          </div>
        </button>
      }
    />
  )
}
