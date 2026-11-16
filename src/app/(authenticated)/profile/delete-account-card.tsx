'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteAccountCardProps {
  email: string
  userId: string
}

interface PendingDeletionInfo {
  id: string
  status: string
  scheduledDeletionAt: string
  requestedAt: string
  daysRemaining: number
  isPending: boolean
}

export function DeleteAccountCard({ email, userId }: DeleteAccountCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletionInfo | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const expectedPhrase = 'i confirm in deleting the account'

  // Fetch deletion request status on load
  useEffect(() => {
    let isMounted = true

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/delete-account?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`
        )
        if (response.ok) {
          const data = await response.json()
          if (isMounted && data.found && data.request?.isPending) {
            setPendingDeletion(data.request)
          }
        }
      } catch (err) {
        console.error('Failed to check deletion request status:', err)
      }
    }

    if (userId || email) {
      checkStatus()
    }

    return () => {
      isMounted = false
    }
  }, [userId, email])

  const deleteButtonDisabled =
    deleteConfirmEmail.toLowerCase().trim() !== email.toLowerCase().trim() ||
    deleteConfirmPhrase.toLowerCase().trim() !== expectedPhrase ||
    isDeleting

  const handleDeleteAccount = async () => {
    if (deleteButtonDisabled) return

    setIsDeleting(true)
    setStatusMessage(null)
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, confirmed: true }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setPendingDeletion(
          data.request || {
            id: data.ticketId,
            status: 'pending',
            scheduledDeletionAt: data.scheduledDeletionAt,
            requestedAt: data.requestedAt,
            daysRemaining: data.daysRemaining || 30,
            isPending: true,
          }
        )
        setDeleteDialogOpen(false)
        setDeleteConfirmEmail('')
        setDeleteConfirmPhrase('')
        setStatusMessage(
          'Account deletion request scheduled. You have a 30-day grace period to cancel before your account is permanently purged.'
        )
      } else {
        alert(data.error || 'Failed to schedule account deletion.')
      }
    } catch (error) {
      console.error('Error scheduling account deletion:', error)
      alert('An error occurred while scheduling your account deletion.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsCancelling(true)
    setStatusMessage(null)
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, action: 'cancel' }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setPendingDeletion(null)
        setStatusMessage('Your account deletion request has been successfully cancelled.')
      } else {
        alert(data.error || 'Failed to cancel deletion request.')
      }
    } catch (error) {
      console.error('Error cancelling account deletion:', error)
      alert('An error occurred while cancelling your deletion request.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card className="border border-border/70 shadow-sm" id="delete-account">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Danger Zone</CardTitle>
        <CardDescription>
          Account deletion, grace period management, and multi-tenant data settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage && (
          <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {pendingDeletion ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-amber-500/30 rounded-lg bg-amber-500/10 gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                  Account Scheduled for Deletion ({pendingDeletion.daysRemaining} days remaining)
                </h4>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1">
                  A deletion request was submitted on{' '}
                  {new Date(pendingDeletion.requestedAt).toLocaleDateString()}. Your account and
                  personal wallet data are scheduled to be permanently purged on{' '}
                  <strong>
                    {new Date(pendingDeletion.scheduledDeletionAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                  .
                </p>
                <p className="text-xs text-amber-800/70 dark:text-amber-400/70 mt-1">
                  All your data remains intact during this 30-day grace period. You can cancel at any
                  time before the scheduled date.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCancelDeletion}
              disabled={isCancelling}
              className="border-amber-600/50 hover:bg-amber-500/20 text-amber-950 dark:text-amber-100 shrink-0"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Deletion Request'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5 gap-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-destructive">Delete User Account</h4>
                <p className="text-sm text-muted-foreground">
                  Request account deletion with a 30-day buffer before personal wallet data is permanently
                  purged.
                </p>
              </div>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="shrink-0">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete User Account</DialogTitle>
                  <DialogDescription>
                    This will schedule your account (<strong>{email}</strong>) for deletion with a{' '}
                    <strong>30-day grace period</strong>. After 30 days, the following data will be
                    permanently removed:
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>
                      All Personal Wallet Mode sub-accounts, transactions, and categories (is_wallet =
                      true)
                    </li>
                    <li>
                      All member associations and access rights across multi-tenant business
                      organizations
                    </li>
                    <li>Your user profile, authentication credentials, and session tokens</li>
                    <li>
                      <em>Note:</em> Shared business records are preserved for legal and audit
                      compliance in anonymized form.
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-muted/60 border border-border/80 rounded-md text-xs text-muted-foreground">
                    💡 You will have 30 days to cancel this request from your profile settings before any
                    data is permanently deleted.
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Type <strong className="text-foreground">{email}</strong> to confirm
                      </Label>
                      <Input
                        value={deleteConfirmEmail}
                        onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                        placeholder={email}
                        className="border-destructive/50 focus-visible:ring-destructive/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Type <strong className="text-foreground">{expectedPhrase}</strong> to confirm
                      </Label>
                      <Input
                        value={deleteConfirmPhrase}
                        onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                        placeholder={expectedPhrase}
                        className="border-destructive/50 focus-visible:ring-destructive/50"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false)
                      setDeleteConfirmEmail('')
                      setDeleteConfirmPhrase('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteButtonDisabled}
                  >
                    {isDeleting ? 'Scheduling Deletion...' : 'Schedule Deletion'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
