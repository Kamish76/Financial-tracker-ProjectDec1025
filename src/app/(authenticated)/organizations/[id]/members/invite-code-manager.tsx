'use client'

import { useState, useEffect, useTransition } from 'react'
import { Ticket, Plus, Copy, X, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { InviteCodeWithCreator } from '@/lib/types/invite'
import {
  formatInviteCode,
  formatCreatedDate,
  formatRemainingUses,
  getInviteCodeBadge,
  isInviteCodeUsable,
} from '@/lib/types/invite'
import { createInviteCode, revokeInviteCode, getInviteCodes } from './actions'

type InviteCodeManagerProps = {
  organizationId: string
}

export function InviteCodeManager({ organizationId }: InviteCodeManagerProps) {
  const [inviteCodes, setInviteCodes] = useState<InviteCodeWithCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [maxUses, setMaxUses] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Fetch invite codes
  const fetchInviteCodes = async () => {
    setIsLoading(true)
    const result = await getInviteCodes(organizationId)
    if (result.inviteCodes) {
      setInviteCodes(result.inviteCodes)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchInviteCodes()
  }, [organizationId])

  const handleCreateCode = () => {
    startTransition(async () => {
      const maxUsesNumber = maxUses ? parseInt(maxUses) : null
      const result = await createInviteCode({
        organizationId,
        maxUses: maxUsesNumber,
      })

      if (result.error) {
        alert(result.error)
      } else {
        setIsCreateDialogOpen(false)
        setMaxUses('')
        fetchInviteCodes()
      }
    })
  }

  const handleRevokeCode = (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite code?')) {
      return
    }

    startTransition(async () => {
      const result = await revokeInviteCode({
        inviteId,
        organizationId,
      })

      if (result.error) {
        alert(result.error)
      } else {
        fetchInviteCodes()
      }
    })
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Invite Codes
            </CardTitle>
            <CardDescription>
              Generate and manage invite codes for new members
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Code</DialogTitle>
                <DialogDescription>
                  Generate a new invite code for users to join this organization
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="max-uses">
                    Maximum Uses (optional)
                  </Label>
                  <Input
                    id="max-uses"
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    disabled={isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for unlimited uses. Code never expires.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCode} disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Code'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading invite codes...
          </div>
        ) : inviteCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active invite codes</p>
            <p className="text-sm mt-2">Create a code to invite new members</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inviteCodes.map((code) => {
              const badge = getInviteCodeBadge(code)
              const usable = isInviteCodeUsable(code)

              return (
                <Card key={code.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-semibold bg-muted px-3 py-1 rounded">
                          {formatInviteCode(code.code)}
                        </code>
                        <Badge className={badge.color}>{badge.label}</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <strong>Uses:</strong> {code.current_uses} / {formatRemainingUses(code)}
                        </span>
                        <span>
                          <strong>Created:</strong> {formatCreatedDate(code.created_at)}
                        </span>
                        {code.creator && (
                          <span>
                            <strong>By:</strong> {code.creator.full_name || 'Unknown'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(code.code)}
                        disabled={!usable}
                      >
                        {copiedCode === code.code ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeCode(code.id)}
                        disabled={!code.is_active}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
