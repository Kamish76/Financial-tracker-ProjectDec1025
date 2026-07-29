'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, FileText, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createOrganization, createWallet } from './actions'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWalletMode = searchParams.get('mode') === 'wallet'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const disabled = useMemo(() => {
    return name.trim().length < 3 || status === 'submitting'
  }, [name, status])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)

    const result = isWalletMode
      ? await createWallet(name, description || null)
      : await createOrganization(name, description || null)

    if (result?.error) {
      setError(result.error)
      setStatus('idle')
      return
    }

    // If no error, the server action will redirect
    setStatus('done')
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back navigation */}
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Link>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>{isWalletMode ? 'Create Personal Wallet' : 'Create Organization'}</CardTitle>
                <CardDescription>
                  {isWalletMode
                    ? 'Set up a private wallet to track your personal finances with a separate UI.'
                    : 'Set up a new organization to manage finances with your team'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-4 w-4 text-accent" aria-hidden />
                  {isWalletMode ? 'Wallet Name' : 'Organization Name'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError(null)
                  }}
                  placeholder={isWalletMode ? 'My Personal Wallet' : 'Acme Corporation'}
                  required
                  minLength={3}
                  maxLength={100}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {isWalletMode
                    ? 'Must be at least 3 characters. This wallet stays private to you.'
                    : 'Must be at least 3 characters. This will be visible to all members.'}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4 text-accent" aria-hidden />
                  Description
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    setError(null)
                  }}
                  placeholder={
                    isWalletMode
                      ? 'Optional note for your personal wallet...'
                      : 'A brief description of your organization and its purpose...'
                  }
                  className={cn(
                    'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    'ring-offset-background placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                  )}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {isWalletMode
                    ? 'This stays private and is only used inside your wallet UI.'
                    : 'Help members understand what this organization is for.'}
                </p>
              </div>

              {/* Info box */}
              <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-2 text-sm text-foreground">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                {isWalletMode
                  ? 'You will be the owner of this personal wallet'
                  : 'You will be the owner of this organization'}
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Submit button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/organizations')}
                  disabled={status === 'submitting'}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={disabled}>
                  {status === 'submitting'
                    ? 'Creating...'
                    : status === 'done'
                    ? 'Created!'
                    : isWalletMode
                    ? 'Create Personal Wallet'
                    : 'Create Organization'}
                  <ArrowRight
                    className={cn('ml-2 h-4 w-4 transition', status !== 'submitting' && 'translate-x-0.5')}
                    aria-hidden
                  />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
