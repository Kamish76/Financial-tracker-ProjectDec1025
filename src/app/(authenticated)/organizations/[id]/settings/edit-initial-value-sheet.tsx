"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

import { updateInitialTransaction } from "../actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Add backdrop blur overlay styles
const selectContentStyle = {
  backdropFilter: "blur(4px)",
  backgroundColor: "rgba(13, 20, 33, 0.9)",
}

type Member = {
  user_id: string
  email: string | null
  full_name: string | null
}

type InitialTransaction = {
  id: string
  type: string
  amount: number
  category: string | null
  description: string | null
  occurred_at: string
  assigned_to_user_id: string | null
  assigned_to_email: string | null
  assigned_to_name: string | null
}

type EditInitialValueSheetProps = {
  organizationId: string
  members: Member[]
  currentUserEmail?: string | null
  currentUserId?: string | null
  initialTransaction: InitialTransaction
}

export function EditInitialValueSheet({
  organizationId,
  members,
  currentUserEmail,
  currentUserId,
  initialTransaction,
}: EditInitialValueSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(initialTransaction.amount.toString())
  const [category, setCategory] = useState(initialTransaction.category || "")
  const [description, setDescription] = useState(initialTransaction.description || "")
  const [occurredAt, setOccurredAt] = useState<string>(initialTransaction.occurred_at.slice(0, 10))
  const [assignedToUserId, setAssignedToUserId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const defaultDate = useMemo(() => initialTransaction.occurred_at.slice(0, 10), [initialTransaction.occurred_at])

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setAmount(initialTransaction.amount.toString())
      setCategory(initialTransaction.category || "")
      setDescription(initialTransaction.description || "")
      setOccurredAt(initialTransaction.occurred_at.slice(0, 10))
      setAssignedToUserId(
        initialTransaction.assigned_to_user_id
          ? initialTransaction.assigned_to_user_id === currentUserId
            ? "current"
            : initialTransaction.assigned_to_user_id
          : "none"
      )
      setError(null)
    }
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
      const result = await updateInitialTransaction({
        organizationId,
        transactionId: initialTransaction.id,
        amount: parsedAmount,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        occurredAt: dateValue,
        assignedToUserId:
          assignedToUserId === "none"
            ? null
            : assignedToUserId === "current"
            ? currentUserId
            : assignedToUserId || null,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Initial Value</SheetTitle>
          <SheetDescription>
            Update amount, date, assignment, or notes. Type is fixed for initial transactions.
          </SheetDescription>
        </SheetHeader>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {initialTransaction.type === "income" && "Income"}
              {initialTransaction.type === "expense_business" && "Expense (Biz)"}
              {initialTransaction.type === "expense_personal" && "Expense (Personal)"}
            </div>
            <p className="text-xs text-muted-foreground">Type cannot be changed after creation.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`assignedTo-${initialTransaction.id}`}>Assign To</Label>
            <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
              <SelectTrigger id={`assignedTo-${initialTransaction.id}`}>
                <SelectValue placeholder="Select member or organization" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-sm bg-background/95 border border-border">
                <SelectItem value="none">None (Organization)</SelectItem>
                {currentUserEmail && (
                  <SelectItem value="current">You ({currentUserEmail})</SelectItem>
                )}
                {members
                  .filter((member) => member.user_id !== currentUserId)
                  .map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.email} {member.full_name ? `(${member.full_name})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`amount-${initialTransaction.id}`}>Amount</Label>
            <Input
              id={`amount-${initialTransaction.id}`}
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
            <Label htmlFor={`occurredAt-${initialTransaction.id}`}>Date</Label>
            <Input
              id={`occurredAt-${initialTransaction.id}`}
              name="occurredAt"
              type="date"
              required
              value={occurredAt || defaultDate}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`category-${initialTransaction.id}`}>Category</Label>
            <Input
              id={`category-${initialTransaction.id}`}
              name="category"
              placeholder="e.g. Opening Balance, Capital, Equipment"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`description-${initialTransaction.id}`}>Description</Label>
            <Input
              id={`description-${initialTransaction.id}`}
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
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="sm:w-auto">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
