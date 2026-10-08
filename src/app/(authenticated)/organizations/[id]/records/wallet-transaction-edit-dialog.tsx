"use client"

import { useState, useTransition } from "react"
import { updateTransaction } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { TransactionRecord } from "./utils"
import type { AccountWithBalance } from "@/lib/wallet-types"

type Transaction = TransactionRecord
type Category = {
  id: string
  normalized_name: string
  aliases?: string[]
}

type WalletTransactionEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
  organizationId: string
  onSave: () => void
  categories?: Category[]
  accounts?: AccountWithBalance[]
  currency?: string
}

export function WalletTransactionEditDialog({
  open,
  onOpenChange,
  transaction,
  organizationId,
  onSave,
  categories = [],
  accounts = [],
  currency,
}: WalletTransactionEditDialogProps) {
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [description, setDescription] = useState(transaction.description || "")
  const [category, setCategory] = useState(
    transaction.category_ref?.normalized_name || transaction.category || ""
  )
  const [accountId, setAccountId] = useState(transaction.account_id || accounts[0]?.id || "")
  const [transferToAccountId, setTransferToAccountId] = useState(
    transaction.transfer_to_account_id || ""
  )
  const [occurredAt, setOccurredAt] = useState(
    transaction.occurred_at?.split("T")[0] || ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    setError(null)

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    if (transaction.type === 'transfer' && accountId === transferToAccountId) {
      setError("Transfer source and destination accounts must be different")
      return
    }

    startTransition(async () => {
      const result = await updateTransaction({
        organizationId,
        transactionId: transaction.id,
        amount: parsedAmount,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        accountId: accountId || null,
        transferToAccountId: transaction.type === 'transfer' ? transferToAccountId || null : null,
        occurredAt,
      })

      if ('error' in result) {
        setError(result.error ?? "Unable to update transaction")
      } else {
        onSave()
        onOpenChange(false)
      }
    })
  }

  const getTypeLabel = (type: string) => {
    if (type === 'income') return 'Income'
    if (type === 'transfer') return 'Transfer'
    return 'Expense'
  }

  const getTypeBadgeClass = (type: string) => {
    if (type === 'income') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
    if (type === 'transfer') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle>Edit Wallet Transaction</DialogTitle>
            <Badge variant="outline" className={getTypeBadgeClass(transaction.type)}>
              {getTypeLabel(transaction.type)}
            </Badge>
          </div>
          <DialogDescription>
            Update details for this wallet transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-sm font-semibold">
              Amount ({currency || '$'})
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
            />
          </div>

          {/* Account Selector */}
          {accounts.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">
                {transaction.type === 'transfer' ? 'From Account' : 'Account'}
              </Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Transfer Destination Account */}
          {transaction.type === 'transfer' && accounts.length > 1 && (
            <div>
              <Label className="text-sm font-semibold">To Account</Label>
              <Select value={transferToAccountId} onValueChange={setTransferToAccountId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((acc) => acc.id !== accountId)
                    .map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description / Notes */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold">
              Notes / Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional transaction notes..."
              rows={2}
              disabled={isPending}
            />
          </div>

          {/* Category */}
          {transaction.type !== 'transfer' && (
            <div>
              <Label htmlFor="category" className="text-sm font-semibold">
                Category
              </Label>
              {categories.length > 0 ? (
                <div className="space-y-1.5">
                  <Select
                    value={categories.some((c) => c.normalized_name === category) ? category : 'custom'}
                    onValueChange={(val) => {
                      if (val !== 'custom') {
                        setCategory(val)
                      }
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.normalized_name}>
                          {cat.normalized_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom / Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!categories.some((c) => c.normalized_name === category) || category === '') && (
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Type custom category..."
                      disabled={isPending}
                      className="mt-1.5"
                    />
                  )}
                </div>
              ) : (
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter category..."
                  disabled={isPending}
                />
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="occurredAt" className="text-sm font-semibold">
              Date
            </Label>
            <Input
              id="occurredAt"
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
