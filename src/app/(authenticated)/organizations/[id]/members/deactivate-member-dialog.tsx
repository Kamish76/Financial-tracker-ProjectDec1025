'use client'

import { useState, useTransition } from 'react'
import { UserMinus, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { MemberWithProfile } from '@/lib/types/member'
import { getMemberDisplayName } from '@/lib/types/member'
import { deactivateMember } from './actions'

type DeactivateMemberDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberWithProfile
  organizationId: string
  onSuccess: () => void
}

export function DeactivateMemberDialog({
  open,
  onOpenChange,
  member,
  organizationId,
  onSuccess,
}: DeactivateMemberDialogProps) {
  const [confirmation, setConfirmation] = useState('')
  const [isPending, startTransition] = useTransition()

  const displayName = getMemberDisplayName(member)

  const handleSubmit = () => {
    if (confirmation !== displayName) {
      return
    }

    startTransition(async () => {
      const result = await deactivateMember({
        organizationId,
        targetUserId: member.user_id,
      })

      if (result.error) {
        alert(result.error)
      } else {
        setConfirmation('')
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmation('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserMinus className="h-5 w-5" />
            Deactivate Member
          </DialogTitle>
          <DialogDescription>
            This action will deactivate {displayName} from the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Data Preservation (Soft Delete)
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>All financial records remain intact</li>
                  <li>Transaction history preserved</li>
                  <li>Member can be reactivated later</li>
                  <li>Member will no longer have access</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-mono font-semibold">{displayName}</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={displayName}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || confirmation !== displayName}
          >
            {isPending ? 'Deactivating...' : 'Deactivate Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
