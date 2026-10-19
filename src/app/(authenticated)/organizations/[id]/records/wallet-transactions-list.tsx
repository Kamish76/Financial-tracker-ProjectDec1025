"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteTransaction } from "./actions"
import type { TransactionRecord } from "./utils"
import { formatCurrency } from "@/lib/utils"

type Transaction = TransactionRecord

type WalletTransactionsListProps = {
  transactions: Transaction[]
  organizationId: string
  isLoading: boolean
  currency?: string
  onEdit: (transaction: Transaction) => void
  onDelete: () => void
}

function getWalletBadge(type: string) {
  switch (type) {
    case "income":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">Income</Badge>
    case "expense_personal":
    case "expense_business":
    case "expense":
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">Expense</Badge>
    case "transfer":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400">Transfer</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getWalletIcon(type: string) {
  switch (type) {
    case "income":
      return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+</span>
    case "expense_personal":
    case "expense_business":
    case "expense":
      return <span className="text-rose-600 dark:text-rose-400 font-semibold">-</span>
    default:
      return null
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function WalletTransactionsList({
  transactions,
  organizationId,
  isLoading,
  currency,
  onEdit,
  onDelete,
}: WalletTransactionsListProps) {
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [isDeleting, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDelete = () => {
    if (!transactionToDelete) return
    setDeleteError(null)

    startTransition(async () => {
      const result = await deleteTransaction({
        organizationId,
        transactionId: transactionToDelete.id,
      })

      if (result && 'error' in result) {
        setDeleteError(result.error ?? "Unable to delete transaction")
      } else {
        setTransactionToDelete(null)
        onDelete()
      }
    })
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">No transactions found</div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes / Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-foreground">
                  {formatDate(tx.occurred_at)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {getWalletBadge(tx.type)}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {tx.description || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {tx.category_ref?.normalized_name || tx.category || "—"}
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
                <td className="px-6 py-4 text-sm font-semibold text-right">
                  <div className="flex items-center justify-end gap-2">
                    {getWalletIcon(tx.type)}
                    <span className={
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : tx.type === 'transfer'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }>
                      {tx.type === 'income' ? '+ ' : tx.type === 'transfer' ? '' : '- '}
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-center">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!transactionToDelete} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setTransactionToDelete(null)
          setDeleteError(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wallet transaction? This action cannot be undone and will affect your balances.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
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
    </div>
  )
}
