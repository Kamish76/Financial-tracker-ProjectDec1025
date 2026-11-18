'use client'

import { useState, useTransition } from 'react'
import { Link2, PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { createWalletAccount } from '@/lib/wallet-accounts'
import type { LinkableOrganization } from '@/lib/wallet-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  linkableOrgs?: LinkableOrganization[]
  currency?: string
  onSuccess?: () => void
}

export function CreateAccountSheet({
  organizationId,
  linkableOrgs = [],
  currency,
  onSuccess,
}: CreateAccountSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [startingValue, setStartingValue] = useState('0')
  const [linkedOrgId, setLinkedOrgId] = useState<string>('none')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLinked = linkedOrgId !== 'none'

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      resetForm()
    }
  }

  const resetForm = () => {
    setName('')
    setStartingValue('0')
    setLinkedOrgId('none')
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

    const val = isLinked ? 0 : parseFloat(startingValue || '0')
    if (isNaN(val)) {
      setError('Please enter a valid starting balance number')
      return
    }

    startTransition(async () => {
      const res = await createWalletAccount(
        organizationId,
        trimmedName,
        val,
        isLinked ? linkedOrgId : null
      )
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
                Add a new account to your personal wallet to organize cash, checking, savings, or linked organization withholding.
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
                  placeholder="e.g. Main Checking, Cash, Business Withholding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              {linkableOrgs.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="link-org-select" className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Link to Organization Balance (Optional)
                  </Label>
                  <Select
                    value={linkedOrgId}
                    onValueChange={setLinkedOrgId}
                    disabled={isPending}
                  >
                    <SelectTrigger id="link-org-select">
                      <SelectValue placeholder="None (Manual Balance)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Manual Balance)</SelectItem>
                      {linkableOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} (Negated Business Held)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLinked && (
                    <p className="text-xs text-muted-foreground">
                      This sub-account mirrors your negated Business Held balance from the selected organization and is read-only for direct wallet income/expenses.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="starting-value">Starting Value ({currency || 'USD'})</Label>
                <Input
                  id="starting-value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={isLinked ? '0' : startingValue}
                  onChange={(e) => setStartingValue(e.target.value)}
                  disabled={isPending || isLinked}
                  required={!isLinked}
                />
                <p className="text-xs text-muted-foreground">
                  {isLinked
                    ? 'Locked while linked — balance automatically syncs from the organization.'
                    : 'The initial opening balance of this account before any recorded transactions.'}
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
