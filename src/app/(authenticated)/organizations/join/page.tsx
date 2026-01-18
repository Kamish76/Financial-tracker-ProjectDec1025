'use client'

import { useState, useTransition } from 'react'
import { Ticket, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinWithInviteCode } from './actions'
import { cleanInviteCode, formatInviteCode, isValidInviteCodeFormat } from '@/lib/types/invite'

export default function JoinOrganizationPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ organizationName: string; organizationId: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleJoinWithCode = () => {
    setError(null)
    setSuccess(null)

    const cleanedCode = cleanInviteCode(inviteCode)

    // Validate format
    if (!isValidInviteCodeFormat(cleanedCode)) {
      setError('Invalid invite code format. Code should be 12 characters (letters and numbers only).')
      return
    }

    startTransition(async () => {
      const result = await joinWithInviteCode({ code: cleanedCode })

      if (!result.success && result.errorMessage) {
        setError(result.errorMessage)
      } else if (result.success && result.organizationId && result.organizationName) {
        setSuccess({
          organizationName: result.organizationName,
          organizationId: result.organizationId,
        })
        // Redirect after short delay
        setTimeout(() => {
          router.push(`/organizations/${result.organizationId}`)
        }, 2000)
      }
    })
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/organizations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">Join an Organization</h1>
          <p className="text-muted-foreground mt-1">
            Enter an invite code to join a financial organization
          </p>
        </div>

        {success ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
              <CardTitle className="mb-2 text-green-900 dark:text-green-100">
                Successfully Joined!
              </CardTitle>
              <CardDescription className="text-center max-w-md text-green-700 dark:text-green-300">
                You are now a member of <strong>{success.organizationName}</strong>. Redirecting to organization...
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Enter Invite Code
              </CardTitle>
              <CardDescription>
                Ask an organization admin or owner for an invite code to join their organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="XXXX-XXXX-XXXX"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isPending) {
                        handleJoinWithCode()
                      }
                    }}
                    disabled={isPending}
                    className="font-mono text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: 12 characters (letters and numbers). Dashes optional.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleJoinWithCode}
                  disabled={isPending || !inviteCode.trim()}
                  className="w-full"
                >
                  {isPending ? 'Joining...' : 'Join Organization'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Don&apos;t have an invite code?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Contact an administrator or owner of the organization you want to join. They can generate an invite code for you from their organization settings.
            </p>
            <p className="text-sm text-muted-foreground">
              If you want to create your own organization, go back and click <strong>&quot;Create Organization&quot;</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

