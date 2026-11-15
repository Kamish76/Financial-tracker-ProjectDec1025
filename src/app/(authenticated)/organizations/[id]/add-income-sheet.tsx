"use client"

import { PlusCircle } from "lucide-react"
import { OrgTransactionDrawer } from "./org-transaction-drawer"

type AddIncomeSheetProps = {
  organizationId: string
  currency?: string
}

export function AddIncomeSheet({ organizationId, currency }: AddIncomeSheetProps) {
  return (
    <OrgTransactionDrawer
      organizationId={organizationId}
      currency={currency}
      initialTab="income"
      trigger={
        <button
          type="button"
          data-intent="add-income"
          aria-label="Open add income modal"
          className="group flex w-full items-center gap-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-3.5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/[0.1] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-105">
            <PlusCircle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Add income</p>
            <p className="text-xs text-muted-foreground truncate">Log revenue or donations</p>
          </div>
        </button>
      }
    />
  )
}
