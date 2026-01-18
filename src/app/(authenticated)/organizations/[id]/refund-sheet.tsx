"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { createRefund } from "./actions"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type RefundSheetProps = {
  organizationId: string
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function RefundSheet({ organizationId }: RefundSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationAmount, setConfirmationAmount] = useState<number | null>(null)

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      resetForm()
    }
  }

  const resetForm = () => {
    setAmount("")
    setDescription("")
    setError(null)
    setShowConfirmation(false)
    setConfirmationAmount(null)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    // Show confirmation dialog before submitting
    setConfirmationAmount(parsedAmount)
    setShowConfirmation(true)
  }

  const handleConfirm = () => {
    setShowConfirmation(false)

    if (confirmationAmount === null) {
      return
    }

    startTransition(async () => {
      const result = await createRefund({
        organizationId,
        amount: confirmationAmount,
        description: description.trim() || undefined,
      })

      if (result?.error) {
        setError(result.error)
        setConfirmationAmount(null)
        return
      }

      resetForm()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            data-intent="refund"
            aria-label="Open refund modal"
          >
            <RefreshCw className="h-4 w-4" />
            Refund
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Refund</SheetTitle>
            <SheetDescription>
              Record a refund for your outstanding personal contributions. This will deduct from your outstanding balance.
            </SheetDescription>
          </SheetHeader>

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
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g. Reimbursed via check"
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
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="sm:w-auto"
                  disabled={isPending || !amount}
                >
                  {isPending ? "Processing..." : "Continue"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to record this refund? This will immediately deduct from your outstanding balance.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-sm text-muted-foreground">Refund amount</div>
            <div className="mt-1 text-2xl font-semibold">
              {confirmationAmount !== null ? formatter.format(confirmationAmount) : "$0.00"}
            </div>
          </div>

          {description && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Notes</div>
              <div className="text-sm">{description}</div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowConfirmation(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Processing..." : "Confirm refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
