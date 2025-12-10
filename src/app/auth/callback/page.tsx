'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL params
        const code = searchParams.get('code')
        const error_param = searchParams.get('error')
        const error_description = searchParams.get('error_description')

        console.log('[AUTH_CALLBACK] URL params:', { code: code ? 'present' : 'missing', error: error_param })

        // Check for OAuth errors
        if (error_param) {
          console.error('[AUTH_CALLBACK] OAuth error from provider:', error_description)
          setError(`Authentication failed: ${error_description || error_param}`)
          return
        }

        // Wait for Supabase JS client to handle the callback
        // It should automatically process the code and set the session
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Now check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log('[AUTH_CALLBACK] Session after wait:', { 
          hasSession: !!session,
          user: session?.user?.email,
          error: sessionError?.message
        })

        if (!session?.user) {
          console.error('[AUTH_CALLBACK] No session established')
          // If there's still no session but we had a code, something went wrong
          if (code) {
            console.log('[AUTH_CALLBACK] Code was present but session not established - retrying')
            // Try once more
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: { session: session2 } } = await supabase.auth.getSession()
            if (!session2?.user) {
              setError('Failed to complete authentication. Please try again.')
              return
            }
          } else {
            setError('Authentication failed. Please try again.')
            return
          }
        }

        console.log('[AUTH_CALLBACK] Successfully authenticated as:', session?.user?.email || session2?.user?.email)
        
        // Wait before redirecting
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push('/organizations')
      } catch (err) {
        console.error('[AUTH_CALLBACK] Unexpected error:', err)
        setError('An error occurred during authentication')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button
            onClick={() => router.push('/auth')}
            className="mt-4 px-4 py-2 bg-accent text-white rounded hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Signing you in...</h1>
        <p className="text-muted-foreground mt-2">Please wait...</p>
        <div className="mt-8">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
