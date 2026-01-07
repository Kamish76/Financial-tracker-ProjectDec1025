"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ReceiptText } from "lucide-react"

import { addExpense } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type AddExpenseSheetProps = {
  organizationId: string
}

export function AddExpenseSheet({ organizationId }: AddExpenseSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [occurredAt, setOccurredAt] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expenseType, setExpenseType] = useState<'business' | 'personal'>('business')

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      resetForm()
    }
  }

  const resetForm = () => {
    setAmount("")
    setCategory("")
    setDescription("")
    setOccurredAt("")
    setError(null)
    setExpenseType('business')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)
    const dateValue = occurredAt || defaultDate

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    if (!dateValue) {
      setError("Date is required")
      return
    }

    startTransition(async () => {
      const result = await addExpense({
        organizationId,
        amount: parsedAmount,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        occurredAt: dateValue,
        expenseType,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      resetForm()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-2"
          data-intent="add-expense"
          aria-label="Open add expense modal"
        >
          <ReceiptText className="h-4 w-4" />
          Add expense
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add expense</SheetTitle>
          <SheetDescription>Log a business or personal expense paid by you.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          <Label>Expense Type</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={expenseType === 'business' ? 'default' : 'outline'}
              onClick={() => setExpenseType('business')}
            >
              Business
            </Button>
            <Button
              type="button"
              variant={expenseType === 'personal' ? 'default' : 'outline'}
              onClick={() => setExpenseType('personal')}
            >
              Personal
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {expenseType === 'business' 
              ? 'Paid from business funds you hold' 
              : 'Paid out-of-pocket (eligible for reimbursement)'}
          </p>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurredAt">Date</Label>
            <Input
              id="occurredAt"
              name="occurredAt"
              type="date"
              required
              value={occurredAt || defaultDate}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              placeholder="e.g. Supplies, Equipment, Capital"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <SheetFooter className="pt-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="ghost"
                className="sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="sm:w-auto"
              >
                {isPending ? "Saving..." : "Save expense"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
