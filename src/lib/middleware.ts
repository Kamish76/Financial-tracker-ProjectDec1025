import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/callback',
  '/privacy',
  '/delete-account',
  '/account-deletion',
]

// Define auth routes that should redirect to authenticated area if user is already logged in
const authRoutes = [
  '/auth',
]

// Strict static asset file extension whitelist
const STATIC_ASSET_REGEX = /\.(ico|png|jpg|jpeg|svg|css|js|webp|woff|woff2|ttf|eot)$/i

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // Allow framework assets and public files through without auth checks.
  // Fix dot-path bypass: Only match framework routes and whitelisted static extensions.
  if (pathname.startsWith('/_next/') || STATIC_ASSET_REGEX.test(pathname)) {
    return supabaseResponse
  }

  const isPublicRoute = publicRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  })
  const isAuthRoute = authRoutes.some((route) => pathname === route)
  const destination = pathname + (request.nextUrl.search || '')

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              supabaseResponse.cookies.set(name, value, options as any)
            )
          },
        },
      }
    )

    // IMPORTANT: Refresh session to check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PROXY] ${pathname} - User: ${user?.email || 'none'}, isAuth: ${isAuthRoute}`)
    }

    // If session lookup returned an error, treat as unauthenticated
    if (authError && !isPublicRoute) {
      console.warn('[PROXY] Auth error in middleware:', authError.message)
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.search = ''
      url.searchParams.set('next', destination)
      url.searchParams.set('redirect', destination)
      return NextResponse.redirect(url)
    }

    // If user is authenticated and trying to access the public homepage, redirect to organizations
    if (user && pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/organizations'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // If user is authenticated and trying to access auth pages, redirect to target or organizations
    if (user && isAuthRoute) {
      const param =
        request.nextUrl.searchParams.get('next') ||
        request.nextUrl.searchParams.get('redirect') ||
        request.nextUrl.searchParams.get('redirectTo')

      let targetUrl = '/organizations'
      if (param) {
        try {
          const decoded = decodeURIComponent(param).trim()
          if (
            decoded.startsWith('/') &&
            !decoded.startsWith('//') &&
            !decoded.startsWith('/\\')
          ) {
            targetUrl = decoded
          }
        } catch {
          targetUrl = '/organizations'
        }
      }

      const redirectUrl = new URL(targetUrl, request.nextUrl.origin)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is not authenticated and trying to access protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.search = ''
      // Add the original URL as both next and redirect parameters (AGENTS.md Rule 3)
      url.searchParams.set('next', destination)
      url.searchParams.set('redirect', destination)
      return NextResponse.redirect(url)
    }

    // IMPORTANT: Return response with updated cookies
    return supabaseResponse
  } catch (err) {
    console.error('[PROXY] Error checking session:', err)
    // Fail-secure: If the route is protected, redirect to /auth instead of failing open
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.search = ''
      url.searchParams.set('next', destination)
      url.searchParams.set('redirect', destination)
      url.searchParams.set('error', 'session_error')
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }
}
