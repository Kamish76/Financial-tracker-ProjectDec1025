"use client"

import { ReceiptText } from "lucide-react"
import { isWalletOrganization } from "@/lib/wallet"
import { OrgTransactionDrawer } from "./org-transaction-drawer"

type AddExpenseSheetProps = {
  organizationId: string
  organizationDescription?: string | null
  currency?: string
}

export function AddExpenseSheet({
  organizationId,
  organizationDescription,
  currency,
}: AddExpenseSheetProps) {
  const isWallet = isWalletOrganization(organizationDescription)

  return (
    <OrgTransactionDrawer
      organizationId={organizationId}
      organizationDescription={organizationDescription}
      currency={currency}
      initialTab="expense"
      trigger={
        <button
          type="button"
          data-intent="add-expense"
          aria-label="Open add expense modal"
          className="group flex w-full items-center gap-3.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-3.5 text-left transition-all hover:border-rose-500/50 hover:bg-rose-500/[0.1] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-105">
            <ReceiptText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isWallet ? "Add wallet expense" : "Add expense"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isWallet ? "Record personal spending" : "Business or out-of-pocket"}
            </p>
          </div>
        </button>
      }
    />
  )
}
