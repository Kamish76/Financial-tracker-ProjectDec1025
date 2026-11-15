"use client"

import { useState, useTransition } from "react"
import { deleteTransaction } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  MoreHorizontal,
  Receipt,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { TransactionRecord } from "./utils"

type Transaction = TransactionRecord

type TransactionsListProps = {
  transactions: Transaction[]
  organizationId: string
  isLoading: boolean
  isWallet?: boolean
  currency?: string
  userRole?: string
  onEdit: (transaction: Transaction) => void
  onDelete: () => void
}

function getInitials(label: string): string {
  const clean = label.trim()
  if (!clean) return "OG"
  const beforeAt = clean.split("@")[0] || clean
  const parts = beforeAt.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return beforeAt.slice(0, 2).toUpperCase()
}

function getRowVisuals(type: string) {
  switch (type) {
    case "income":
      return {
        Icon: ArrowDownLeft,
        iconBoxClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        amountClass: "text-emerald-600 dark:text-emerald-400",
        sign: "+",
      }
    case "expense_personal":
      return {
        Icon: ArrowUpRight,
        iconBoxClass: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
        amountClass: "text-amber-600 dark:text-amber-400",
        sign: "-",
      }
    case "expense_business":
    case "expense":
      return {
        Icon: ArrowUpRight,
        iconBoxClass: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
        amountClass: "text-rose-600 dark:text-rose-400",
        sign: "-",
      }
    case "held_allocate":
      return {
        Icon: ArrowLeftRight,
        iconBoxClass: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
        amountClass: "text-blue-600 dark:text-blue-400",
        sign: "+",
      }
    case "held_return":
    case "transfer":
      return {
        Icon: ArrowLeftRight,
        iconBoxClass: "bg-purple-500/12 text-purple-600 dark:text-purple-400",
        amountClass: "text-purple-600 dark:text-purple-400",
        sign: type === "transfer" ? "" : "-",
      }
    default:
      return {
        Icon: ArrowLeftRight,
        iconBoxClass: "bg-muted text-muted-foreground",
        amountClass: "text-foreground",
        sign: "",
      }
  }
}

const getTransactionBadge = (type: string) => {
  switch (type) {
    case "income":
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30"
        >
          Income
        </Badge>
      )
    case "expense_business":
      return (
        <Badge
          variant="outline"
          className="border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:bg-rose-950/30"
        >
          Business Exp
        </Badge>
      )
    case "expense_personal":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/30"
        >
          Personal Exp
        </Badge>
      )
    case "held_allocate":
      return (
        <Badge
          variant="outline"
          className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/30"
        >
          Held
        </Badge>
      )
    case "held_return":
      return (
        <Badge
          variant="outline"
          className="border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950/30"
        >
          Return
        </Badge>
      )
    case "transfer":
      return (
        <Badge
          variant="outline"
          className="border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950/30"
        >
          Transfer
        </Badge>
      )
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function FundedByBadge({ fundedByType }: { fundedByType: "business" | "personal" | null }) {
  if (!fundedByType) {
    return <span className="text-muted-foreground">—</span>
  }
  if (fundedByType === "personal") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        Out-of-Pocket
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
      Business
    </span>
  )
}

export function TransactionsList({
  transactions,
  organizationId,
  isLoading,
  isWallet,
  currency,
  userRole,
  onEdit,
  onDelete,
}: TransactionsListProps) {
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [isDeleting, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canManage = isWallet || !userRole || userRole === "owner" || userRole === "admin"
  const isOwner = isWallet || !userRole || userRole === "owner"

  const confirmDelete = () => {
    if (!transactionToDelete) return
    setDeleteError(null)

    startTransition(async () => {
      const result = await deleteTransaction({
        organizationId,
        transactionId: transactionToDelete.id,
      })

      if (result && "error" in result) {
        setDeleteError(result.error ?? "Unable to delete transaction")
      } else {
        setTransactionToDelete(null)
        onDelete()
      }
    })
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-border bg-card/70 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-14 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
          <Receipt className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-base font-semibold text-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Try clearing or adjusting your active filters, or add a new transaction to get started.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card Feed */}
      <div className="space-y-3 md:hidden">
        {transactions.map((tx) => {
          const canMutateRow = canManage && (!tx.is_initial || isOwner)
          const visuals = getRowVisuals(tx.type)
          const TxIcon = visuals.Icon
          const categoryLabel = tx.category_ref?.normalized_name || tx.category
          const memberName = tx.funded_by_user?.full_name || tx.funded_by_user?.email || "Organization"

          return (
            <div
              key={tx.id}
              className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visuals.iconBoxClass}`}
                  >
                    <TxIcon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {tx.description || categoryLabel || "Transaction"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.occurred_at)}
                      {tx.is_initial && " · Initial"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-mono text-sm font-bold tabular-nums ${visuals.amountClass}`}>
                    {visuals.sign ? `${visuals.sign} ` : ""}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                  {canManage && canMutateRow && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tx)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTransactionToDelete(tx)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
                {getTransactionBadge(tx.type)}
                {categoryLabel && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {categoryLabel}
                  </span>
                )}
                {!isWallet && <FundedByBadge fundedByType={tx.funded_by_type} />}
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent-strong text-[10px] font-bold">
                    {getInitials(memberName)}
                  </span>
                  <span className="truncate max-w-[130px]">{memberName}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Ledger Table */}
      <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                {!isWallet && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funded By</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                {canManage && (
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {transactions.map((tx) => {
                const canMutateRow = canManage && (!tx.is_initial || isOwner)
                const visuals = getRowVisuals(tx.type)
                const TxIcon = visuals.Icon
                const categoryLabel = tx.category_ref?.normalized_name || tx.category
                const memberName = tx.funded_by_user?.full_name || tx.funded_by_user?.email || "Organization"

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-muted/35 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{formatDate(tx.occurred_at)}</span>
                        {tx.is_initial && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Init
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {getTransactionBadge(tx.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visuals.iconBoxClass}`}
                        >
                          <TxIcon className="h-3.5 w-3.5" aria-hidden />
                        </div>
                        <span className="font-medium text-foreground">
                          {tx.description || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {categoryLabel ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {categoryLabel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {tx.transfer_to_account_ref?.name ? (
                        <div className="inline-flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300">
                          <span className="rounded-md bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 text-xs border border-purple-200 dark:border-purple-800">
                            {tx.account_ref?.name || "Cash"} → {tx.transfer_to_account_ref.name}
                          </span>
                        </div>
                      ) : tx.account_ref?.name ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {tx.account_ref.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-strong text-[10px] font-bold">
                          {getInitials(memberName)}
                        </span>
                        <span className="truncate max-w-[160px] text-foreground/90 font-medium">
                          {memberName}
                        </span>
                      </div>
                    </td>
                    {!isWallet && (
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <FundedByBadge fundedByType={tx.funded_by_type} />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm font-bold text-right whitespace-nowrap">
                      <span className={`font-mono tabular-nums ${visuals.amountClass}`}>
                        {visuals.sign ? `${visuals.sign} ` : ""}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-sm text-center">
                        {canMutateRow ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(tx)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTransactionToDelete(tx)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">Owner only</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!transactionToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setTransactionToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone and will affect your balances.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-sm text-destructive">
              {deleteError}
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setTransactionToDelete(null)
                setDeleteError(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
