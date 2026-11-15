"use client"

import { useState, useTransition } from "react"
import { AlertCircle } from "lucide-react"
import { updateTransaction } from "../actions"
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

import type { TransactionRecord } from "./utils"

type Transaction = TransactionRecord
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
  categories?: Category[]
}

export function TransactionEditDialog({
  open,
  onOpenChange,
  transaction,
  organizationId,
  onSave,
  categories = [],
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

      if ("error" in result) {
        setError(result.error ?? "Unable to update transaction")
      } else {
        onSave()
        onOpenChange(false)
      }
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
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              disabled={isPending}
              className="font-mono text-lg font-bold tabular-nums h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description..."
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </Label>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {categories.slice(0, 10).map((cat) => {
                  const selected = category.trim().toLowerCase() === cat.normalized_name.toLowerCase()
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => setCategory(cat.normalized_name)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        selected
                          ? "border-accent-strong bg-accent/15 text-accent-strong font-semibold"
                          : "border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {cat.normalized_name}
                    </button>
                  )
                })}
              </div>
            )}
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter category..."
              disabled={isPending}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="occurredAt" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
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
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
