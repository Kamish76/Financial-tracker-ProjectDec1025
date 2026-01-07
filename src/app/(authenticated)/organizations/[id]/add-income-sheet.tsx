"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"

import { addIncome } from "./actions"
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
import { supabase } from "@/lib/supabaseClient"

type AddIncomeSheetProps = {
  organizationId: string
}

export function AddIncomeSheet({ organizationId }: AddIncomeSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [occurredAt, setOccurredAt] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [fundedByUserId, setFundedByUserId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)

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
    setFundedByUserId(null)
  }

  // Removed member dropdown: contributor defaults to current user when personal

  // Load current user and default contributor to self when personal
  useEffect(() => {
    if (!open) return
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      setCurrentUserId(u?.id ?? null)
      const name = (u?.user_metadata?.full_name as string | undefined) || (u?.email as string | undefined) || null
      setCurrentUserName(name)
      if (!fundedByUserId && u?.id) {
        setFundedByUserId(u.id)
      }
    })
  }, [open])

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
      const result = await addIncome({
        organizationId,
        amount: parsedAmount,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        occurredAt: dateValue,
        fundedByType: 'business',
        fundedByUserId: fundedByUserId || undefined,
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
          className="w-full justify-start gap-2"
          data-intent="add-income"
          aria-label="Open add income modal"
        >
          <PlusCircle className="h-4 w-4" />
          Add income
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add income</SheetTitle>
          <SheetDescription>Log new income. Cash is held by the member who records it.</SheetDescription>
        </SheetHeader>
          <div className="space-y-2">
            <Label>Holder</Label>
            <div className="text-sm text-muted-foreground">
              {currentUserName ? `Me (${currentUserName})` : 'Me'}
            </div>
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
              placeholder="e.g. Sales, Donation"
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
                {isPending ? "Saving..." : "Save income"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
