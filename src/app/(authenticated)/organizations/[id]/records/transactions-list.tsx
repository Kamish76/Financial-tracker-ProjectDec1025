"use client"

import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Transaction = any

type TransactionsListProps = {
  transactions: Transaction[]
  organizationId: string
  isLoading: boolean
  onEdit: (transaction: Transaction) => void
}

const getTransactionColor = (type: string) => {
  // Use CSS variables from shadcn for consistent theming
  return "hover:bg-muted/30 transition-colors"
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "income":
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    case "expense_business":
    case "expense_personal":
      return <ArrowUpRight className="h-4 w-4 text-red-600" />
    default:
      return null
  }
}

const getTransactionBadge = (type: string) => {
  switch (type) {
    case "income":
      return <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30">Income</Badge>
    case "expense_business":
      return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/30">Business Exp</Badge>
    case "expense_personal":
      return <Badge variant="outline" className="border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:bg-rose-950/30">Personal Exp</Badge>
    case "held_allocate":
      return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/30">Held</Badge>
    case "held_return":
      return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950/30">Return</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

export function TransactionsList({
  transactions,
  organizationId,
  isLoading,
  onEdit,
}: TransactionsListProps) {
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funded By</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className={`${getTransactionColor(tx.type)} transition-colors`}
              >
                <td className="px-6 py-4 text-sm text-foreground">
                  {formatDate(tx.occurred_at)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {getTransactionBadge(tx.type)}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {tx.description || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {tx.category_ref?.normalized_name || tx.category || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {tx.funded_by_user?.full_name || tx.funded_by_user?.email || "Organization"}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  <span className="capitalize">{tx.funded_by_type}</span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-foreground">
                  <div className="flex items-center justify-end gap-2">
                    {getTransactionIcon(tx.type)}
                    {formatCurrency(tx.amount)}
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
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                      {(tx.type === "expense_business" || tx.type === "expense_personal") && (
                        <DropdownMenuItem>Create Refund</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
