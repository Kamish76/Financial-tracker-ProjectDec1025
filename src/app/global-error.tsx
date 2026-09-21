'use client'

import { useEffect } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Fatal application error caught by global error boundary:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-5">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold mb-2">Application Error</h1>
          <p className="text-sm text-slate-400 mb-6">
            A critical system error prevented the application from rendering. Please reload the page to continue.
          </p>
          {error?.digest && (
            <p className="text-xs text-slate-500 font-mono mb-4">
              Digest: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reload application
          </button>
        </div>
      </body>
    </html>
  )
}
