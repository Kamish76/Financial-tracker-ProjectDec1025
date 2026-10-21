'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getSafeRedirect(nextParam?: string | null): string {
  if (!nextParam) return '/organizations'
  try {
    const decoded = decodeURIComponent(nextParam).trim()
    if (
      decoded.startsWith('/') &&
      !decoded.startsWith('//') &&
      !decoded.startsWith('/\\')
    ) {
      return decoded
    }
  } catch {
    return '/organizations'
  }
  return '/organizations'
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
  redirectToParam?: string
) {
  const targetUrl = getSafeRedirect(redirectToParam)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('[AUTH_ACTION] Sign in attempt:', { email, error: error?.message, userId: data?.user?.id })

  if (error) {
    console.error('[AUTH_ACTION] Sign in error:', error.message)
    return { error: error.message }
  }

  if (!data?.user) {
    console.error('[AUTH_ACTION] No user returned after sign in')
    return { error: 'Sign in failed: no user data returned' }
  }

  console.log('[AUTH_ACTION] Sign in successful for user:', data.user.email)
  // Redirect to targetUrl on successful login
  // The server-side client has set the session cookies
  redirect(targetUrl)
}
