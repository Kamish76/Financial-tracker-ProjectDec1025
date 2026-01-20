"use client"

import { useState, useTransition } from "react"
import { updateTransaction, deleteTransaction } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Transaction = any
type Category = {
  id: string
  normalized_name: string
  aliases?: string[]
}

type TransactionEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
  organizationId: string
  onSave: () => void
  categories: Category[]
}

export function TransactionEditDialog({
  open,
  onOpenChange,
  transaction,
  organizationId,
  onSave,
  categories,
}: TransactionEditDialogProps) {
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [description, setDescription] = useState(transaction.description || "")
  const [category, setCategory] = useState(
    transaction.category_ref?.normalized_name || transaction.category || ""
  )
  const [occurredAt, setOccurredAt] = useState(
    transaction.occurred_at?.split("T")[0] || ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = () => {
    setError(null)

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    startTransition(async () => {
      const result = await updateTransaction({
        organizationId,
        transactionId: transaction.id,
        amount: parsedAmount,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        occurredAt,
      })

      if (result.error) {
        setError(result.error)
      } else {
        onSave()
        onOpenChange(false)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteTransaction({
        organizationId,
        transactionId: transaction.id,
      })

      if (result.error) {
        setError(result.error)
      } else {
        onSave()
        onOpenChange(false)
      }

      setIsDeleting(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the transaction details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-sm font-semibold">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending || isDeleting}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description..."
              rows={3}
              disabled={isPending || isDeleting}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-sm font-semibold">
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter category..."
              disabled={isPending || isDeleting}
            />
          </div>

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
              disabled={isPending || isDeleting}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="mr-auto"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || isDeleting}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
