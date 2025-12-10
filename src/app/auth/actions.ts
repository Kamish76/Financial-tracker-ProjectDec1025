'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signInWithEmailPassword(
  email: string,
  password: string
) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

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
  // Redirect to organizations on successful login
  // The server-side client has set the session cookies
  redirect('/organizations')
}
