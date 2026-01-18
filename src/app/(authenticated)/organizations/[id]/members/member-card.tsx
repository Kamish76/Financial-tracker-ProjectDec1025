'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Shield, Crown, User, Calendar, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { MemberWithProfile, OrganizationRole } from '@/lib/types/member'
import { ROLE_INFO, getMemberDisplayName, formatJoinedDate, formatDeactivatedDate, canManageMember } from '@/lib/types/member'
import { ChangeRoleDialog } from './change-role-dialog'
import { DeactivateMemberDialog } from './deactivate-member-dialog'
import { reactivateMember } from './actions'

type MemberCardProps = {
  member: MemberWithProfile
  currentUserId: string
  currentUserRole: OrganizationRole
  organizationId: string
  isActive: boolean
  onRefresh: () => void
}

export function MemberCard({
  member,
  currentUserId,
  currentUserRole,
  organizationId,
  isActive,
  onRefresh,
}: MemberCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

  const roleInfo = ROLE_INFO[member.role]
  const displayName = getMemberDisplayName(member)
  const isCurrentUser = member.user_id === currentUserId
  const canManage = canManageMember(currentUserRole, member.role, member.user_id, currentUserId)

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateMember({
        organizationId,
        targetUserId: member.user_id,
      })

      if (result.error) {
        alert(result.error)
      } else {
        onRefresh()
      }
    })
  }

  // Get role icon
  const getRoleIcon = () => {
    switch (member.role) {
      case 'owner':
        return <Crown className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">
                  {displayName}
                  {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                  {!isActive && <span className="text-muted-foreground ml-2">(Inactive)</span>}
                </h3>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getRoleIcon()}
                  <Badge variant="outline" className={roleInfo.color}>
                    {roleInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isActive ? (
                    <span>Joined {formatJoinedDate(member.created_at)}</span>
                  ) : (
                    <span>Deactivated {formatDeactivatedDate(member.deactivated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isActive && canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReactivate}
                disabled={isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                Reactivate
              </Button>
            )}

            {isActive && canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {member.role !== 'owner' && (
                    <>
                      <DropdownMenuItem onClick={() => setIsChangeRoleOpen(true)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsDeactivateOpen(true)}
                        className="text-red-600"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Deactivate Member
                      </DropdownMenuItem>
                    </>
                  )}
                  {member.role === 'owner' && (
                    <DropdownMenuItem disabled>
                      <Crown className="h-4 w-4 mr-2" />
                      Owner cannot be managed
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </Card>

      {/* Dialogs */}
      <ChangeRoleDialog
        open={isChangeRoleOpen}
        onOpenChange={setIsChangeRoleOpen}
        member={member}
        organizationId={organizationId}
        onSuccess={onRefresh}
      />

      <DeactivateMemberDialog
        open={isDeactivateOpen}
        onOpenChange={setIsDeactivateOpen}
        member={member}
        organizationId={organizationId}
        onSuccess={onRefresh}
      />
    </>
  )
}
