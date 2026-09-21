'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error caught by segment error boundary:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-6 text-sm">
        An unexpected error occurred while loading this view. You can try reloading or return to the dashboard.
      </p>
      {error?.digest && (
        <p className="text-xs text-muted-foreground/75 font-mono mb-4">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/organizations">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
