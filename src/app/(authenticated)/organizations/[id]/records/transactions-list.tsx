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
  switch (type) {
    case "income":
      return "bg-green-50"
    case "expense_business":
    case "expense_personal":
      return "bg-red-50"
    default:
      return "bg-gray-50"
  }
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
      return <Badge className="bg-green-100 text-green-800">Income</Badge>
    case "expense_business":
      return <Badge className="bg-orange-100 text-orange-800">Business Exp</Badge>
    case "expense_personal":
      return <Badge className="bg-red-100 text-red-800">Personal Exp</Badge>
    case "held_allocate":
      return <Badge className="bg-blue-100 text-blue-800">Held</Badge>
    case "held_return":
      return <Badge className="bg-purple-100 text-purple-800">Return</Badge>
    default:
      return <Badge>{type}</Badge>
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
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Member</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Funded By</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className={`${getTransactionColor(tx.type)} hover:bg-opacity-75 transition`}
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(tx.occurred_at)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {getTransactionBadge(tx.type)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {tx.description || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {tx.category_ref?.normalized_name || tx.category || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {tx.funded_by_user?.full_name || tx.funded_by_user?.email || "Organization"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <Badge variant="outline" className="capitalize">
                    {tx.funded_by_type}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
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
