"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleDollarSign } from "lucide-react"

import { addInitialTransaction } from "../actions"
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

type Member = {
  user_id: string
  email: string | null
  full_name: string | null
}

type AddInitialValueSheetProps = {
  organizationId: string
  members: Member[]
  currentUserEmail?: string | null
  currentUserName?: string | null
  currentUserId?: string | null
}

export function AddInitialValueSheet({ 
  organizationId, 
  members,
  currentUserEmail,
  currentUserName,
  currentUserId,
}: AddInitialValueSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [occurredAt, setOccurredAt] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [transactionType, setTransactionType] = useState<'income' | 'expense_business' | 'expense_personal'>('income')
  const [assignedToUserId, setAssignedToUserId] = useState<string>("")

  // Debug logging
  if (typeof window !== 'undefined' && open) {
    console.log('AddInitialValueSheet members:', members)
    console.log('Current user ID:', currentUserId)
    console.log('Filtered members:', members.filter(m => m.user_id !== currentUserId))
  }

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
    setTransactionType('income')
    setAssignedToUserId("")
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
      const result = await addInitialTransaction({
        organizationId,
        transactionType,
        amount: parsedAmount,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        occurredAt: dateValue,
        assignedToUserId: assignedToUserId === 'none' ? null : (assignedToUserId === 'current' ? currentUserId : assignedToUserId) || null,
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
          variant="default"
          size="sm"
          className="gap-2"
        >
          <CircleDollarSign className="h-4 w-4" />
          Add Initial Value
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add Initial Value</SheetTitle>
          <SheetDescription>
            Set up initial transactions for opening balances or capital contributions.
          </SheetDescription>
        </SheetHeader>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={transactionType === 'income' ? 'default' : 'outline'}
                onClick={() => setTransactionType('income')}
              >
                Income
              </Button>
              <Button
                type="button"
                size="sm"
                variant={transactionType === 'expense_business' ? 'default' : 'outline'}
                onClick={() => setTransactionType('expense_business')}
              >
                Expense (Biz)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={transactionType === 'expense_personal' ? 'default' : 'outline'}
                onClick={() => setTransactionType('expense_personal')}
              >
                Expense (Personal)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionType === 'income' && 'Initial revenue or capital injection'}
              {transactionType === 'expense_business' && 'Initial business expense'}
              {transactionType === 'expense_personal' && 'Initial out-of-pocket expense'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select member or organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Organization)</SelectItem>
                {currentUserEmail && (
                  <SelectItem value="current">
                    You ({currentUserEmail})
                  </SelectItem>
                )}
                {members
                  .filter((member) => member.user_id !== currentUserId)
                  .map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.email} {member.full_name ? `(${member.full_name})` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Assign to a member for capital tracking, or leave as &quot;Organization&quot;
              {members.length > 0 && ` (${members.length} members total, ${members.filter(m => m.user_id !== currentUserId).length} available)`}
            </p>
          </div>

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
              placeholder="e.g. Opening Balance, Capital, Equipment"
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
                {isPending ? "Saving..." : "Save Initial Value"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
