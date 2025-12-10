'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function signUpWithEmailPassword(
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  console.log('[SIGNUP_ACTION] Sign up attempt:', { email, error: error?.message, userId: data?.user?.id })

  if (error) {
    console.error('[SIGNUP_ACTION] Sign up error:', error.message)
    return { error: error.message }
  }

  if (!data?.user) {
    console.error('[SIGNUP_ACTION] No user returned after sign up')
    return { error: 'Sign up failed: no user data returned' }
  }

  console.log('[SIGNUP_ACTION] Sign up successful for user:', data.user.email)
  
  return { 
    success: true,
    user: data.user,
    message: 'Account created! Please check your email to verify your account before logging in.'
  }
}
