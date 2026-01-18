'use client'

import { useState, useTransition } from 'react'
import { Shield, Crown, User } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MemberWithProfile, OrganizationRole } from '@/lib/types/member'
import { getMemberDisplayName, ROLE_INFO } from '@/lib/types/member'
import { updateMemberRole } from './actions'

type ChangeRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberWithProfile
  organizationId: string
  onSuccess: () => void
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  member,
  organizationId,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [newRole, setNewRole] = useState<OrganizationRole>(member.role)
  const [isPending, startTransition] = useTransition()

  const displayName = getMemberDisplayName(member)

  const handleSubmit = () => {
    if (newRole === member.role) {
      onOpenChange(false)
      return
    }

    startTransition(async () => {
      const result = await updateMemberRole({
        organizationId,
        targetUserId: member.user_id,
        newRole,
      })

      if (result.error) {
        alert(result.error)
      } else {
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Member Role
          </DialogTitle>
          <DialogDescription>
            Change the role for {displayName}. This will update their permissions in the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              {member.role === 'owner' && <Crown className="h-4 w-4" />}
              {member.role === 'admin' && <Shield className="h-4 w-4" />}
              {member.role === 'member' && <User className="h-4 w-4" />}
              <span className="font-medium">{ROLE_INFO[member.role].label}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-role">New Role</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as OrganizationRole)}>
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin" disabled={member.role === 'owner'}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="member" disabled={member.role === 'owner'}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Member
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {member.role === 'owner' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Owner Protection:</strong> The owner role cannot be changed. Use the "Transfer
                Ownership" feature in settings to change the organization owner.
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Admin:</strong> Can manage members, create events, and edit organization settings.</p>
            <p><strong>Member:</strong> Can view organization content and participate in events.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || newRole === member.role || member.role === 'owner'}
          >
            {isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
