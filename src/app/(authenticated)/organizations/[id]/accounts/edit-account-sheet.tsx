'use client'

import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { updateWalletAccount } from '@/lib/wallet-accounts'
import type { WalletAccount } from '@/lib/wallet-accounts'
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

type EditAccountSheetProps = {
  account: WalletAccount
  onSuccess?: () => void
}

export function EditAccountSheet({ account, onSuccess }: EditAccountSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(account.name)
  const [startingValue, setStartingValue] = useState(String(account.starting_value))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setName(account.name)
      setStartingValue(String(account.starting_value))
    } else {
      setError(null)
    }
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
      const res = await updateWalletAccount(account.id, trimmedName, val)
      if (res.error) {
        setError(res.error)
        return
      }

      setOpen(false)
      router.refresh()
      onSuccess?.()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit account">
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Edit Sub Account</SheetTitle>
              <SheetDescription>
                Update the account name or starting baseline value for {account.name}.
              </SheetDescription>
            </SheetHeader>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`edit-account-name-${account.id}`}>Account Name</Label>
                <Input
                  id={`edit-account-name-${account.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-starting-value-${account.id}`}>Starting Value ($)</Label>
                <Input
                  id={`edit-starting-value-${account.id}`}
                  type="number"
                  step="0.01"
                  value={startingValue}
                  onChange={(e) => setStartingValue(e.target.value)}
                  disabled={isPending}
                  required
                />
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
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
