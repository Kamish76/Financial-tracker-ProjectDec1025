'use client'

import { useState, useTransition } from 'react'
import { Archive, ArchiveRestore, Link2, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { toggleArchiveWalletAccount, updateWalletAccount } from '@/lib/wallet-accounts'
import type { LinkableOrganization, WalletAccount } from '@/lib/wallet-types'
import { formatCurrency } from '@/lib/utils'
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

type EditAccountSheetProps = {
  account: WalletAccount
  linkableOrgs?: LinkableOrganization[]
  currency?: string
  onSuccess?: () => void
}

export function EditAccountSheet({
  account,
  linkableOrgs = [],
  currency,
  onSuccess,
}: EditAccountSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(account.name)
  const [startingValue, setStartingValue] = useState(String(account.starting_value))
  const [linkedOrgId, setLinkedOrgId] = useState<string>(account.linked_org_id || 'none')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLinked = linkedOrgId !== 'none'

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setName(account.name)
      setStartingValue(String(account.starting_value))
      setLinkedOrgId(account.linked_org_id || 'none')
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
    if (!isLinked && isNaN(val)) {
      setError('Please enter a valid starting balance number')
      return
    }

    startTransition(async () => {
      const res = await updateWalletAccount(
        account.id,
        trimmedName,
        isNaN(val) ? account.starting_value : val,
        isLinked ? linkedOrgId : null
      )
      if (res.error) {
        setError(res.error)
        return
      }

      setOpen(false)
      router.refresh()
      onSuccess?.()
    })
  }

  const handleToggleArchive = () => {
    setError(null)
    startTransition(async () => {
      const res = await toggleArchiveWalletAccount(account.id, !account.is_active)
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
                Update the account name, organization link, or manual starting balance for {account.name}.
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

              {(linkableOrgs.length > 0 || account.linked_org_id) && (
                <div className="space-y-2">
                  <Label
                    htmlFor={`edit-link-org-${account.id}`}
                    className="flex items-center gap-1.5"
                  >
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Link to Organization Balance
                  </Label>
                  <Select
                    value={linkedOrgId}
                    onValueChange={setLinkedOrgId}
                    disabled={isPending}
                  >
                    <SelectTrigger id={`edit-link-org-${account.id}`}>
                      <SelectValue placeholder="None (Manual Balance)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Manual Balance)</SelectItem>
                      {linkableOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} (Negated Business Held)
                        </SelectItem>
                      ))}
                      {account.linked_org_id &&
                        !linkableOrgs.some((o) => o.id === account.linked_org_id) && (
                          <SelectItem value={account.linked_org_id}>
                            {account.linked_org_name || 'Linked Organization'}
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {isLinked
                      ? 'Balance automatically mirrors your negated Business Held from this organization. Your original manual starting value is preserved if you unlink later.'
                      : 'Unlinked — balance uses your manual Starting Value + wallet transactions.'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`edit-starting-value-${account.id}`}>
                  Starting Value ({currency || 'USD'})
                </Label>
                <Input
                  id={`edit-starting-value-${account.id}`}
                  type="number"
                  step="0.01"
                  value={startingValue}
                  onChange={(e) => setStartingValue(e.target.value)}
                  disabled={isPending || isLinked}
                  required={!isLinked}
                />
                {isLinked && (
                  <p className="text-xs text-muted-foreground">
                    Locked while linked. Preserved manual starting value:{' '}
                    {formatCurrency(account.starting_value, currency)}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2.5">
                <div>
                  <p className="text-sm font-medium">Archive / Hide Balance</p>
                  <p className="text-xs text-muted-foreground">
                    Hides this sub-account&apos;s current balance from your combined wallet total while keeping all past transactions intact.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleToggleArchive}
                  disabled={isPending}
                >
                  {account.is_active ? (
                    <>
                      <Archive className="h-4 w-4" />
                      Hide Balance (Archive)
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      Show Balance (Restore)
                    </>
                  )}
                </Button>
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
