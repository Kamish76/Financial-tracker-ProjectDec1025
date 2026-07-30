'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
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
import { supabase } from '@/lib/supabaseClient'

interface DeleteAccountCardProps {
  email: string
  userId: string
}

export function DeleteAccountCard({ email, userId }: DeleteAccountCardProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const expectedPhrase = 'i confirm in deleting the account'

  const deleteButtonDisabled =
    deleteConfirmEmail.toLowerCase().trim() !== email.toLowerCase().trim() ||
    deleteConfirmPhrase.toLowerCase().trim() !== expectedPhrase ||
    isDeleting

  const handleDeleteAccount = async () => {
    if (deleteButtonDisabled) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      })

      if (response.ok) {
        await supabase.auth.signOut()
        setDeleteDialogOpen(false)
        router.push('/auth')
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user account.')
      }
    } catch (error) {
      console.error('Error deleting user account:', error)
      alert('An error occurred while deleting your account.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border border-border/70 shadow-sm" id="delete-account">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions regarding your OrgFinance user account and associated multi-tenant data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5 gap-4">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-destructive">Delete User Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your user account, personal wallet data, and revoke all organization memberships.
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
                  This action <strong>cannot be undone</strong>. This will permanently delete your account (
                  <strong>{email}</strong>) and remove all associated data including:
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>All Personal Wallet Mode sub-accounts, transactions, and categories (is_wallet = true)</li>
                  <li>All member associations and access rights across multi-tenant business organizations</li>
                  <li>Your user profile, authentication credentials, and session tokens</li>
                  <li>
                    <em>Note:</em> In accordance with accounting rules, transactions created in shared business
                    organizations are preserved in anonymized form.
                  </li>
                </ul>
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
                  {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
