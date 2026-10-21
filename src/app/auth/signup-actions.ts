'use server'

import { createClient } from '@/lib/supabase/server'

export async function signUpWithEmailPassword(
  email: string,
  password: string
) {
  const supabase = await createClient()

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
