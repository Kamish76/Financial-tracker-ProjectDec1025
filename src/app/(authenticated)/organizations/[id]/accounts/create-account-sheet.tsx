'use client'

import { useState, useTransition } from 'react'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { createWalletAccount } from '@/lib/wallet-accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type CreateAccountSheetProps = {
  organizationId: string
  onSuccess?: () => void
}

export function CreateAccountSheet({ organizationId, onSuccess }: CreateAccountSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [startingValue, setStartingValue] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      resetForm()
    }
  }

  const resetForm = () => {
    setName('')
    setStartingValue('0')
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter an account name (at least 2 characters)')
      return
    }

    const val = parseFloat(startingValue || '0')
    if (isNaN(val)) {
      setError('Please enter a valid starting balance number')
      return
    }

    startTransition(async () => {
      const res = await createWalletAccount(organizationId, trimmedName, val)
      if (res.error) {
        setError(res.error)
        return
      }

      setOpen(false)
      resetForm()
      router.refresh()
      onSuccess?.()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Sub Account
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Create Sub Account</SheetTitle>
              <SheetDescription>
                Add a new account to your personal wallet to organize cash, checking, savings, or cards.
              </SheetDescription>
            </SheetHeader>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  placeholder="e.g. Main Checking, Cash, Savings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="starting-value">Starting Value ($)</Label>
                <Input
                  id="starting-value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={startingValue}
                  onChange={(e) => setStartingValue(e.target.value)}
                  disabled={isPending}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The initial opening balance of this account before any recorded transactions.
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
