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

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // Allow framework assets and public files through without auth checks.
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return supabaseResponse
  }

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
    } = await supabase.auth.getUser()

    const isPublicRoute = publicRoutes.some((route) => {
      if (route === '/') {
        return pathname === '/'
      }

      return pathname === route || pathname.startsWith(`${route}/`)
    })
    const isAuthRoute = authRoutes.some((route) => pathname === route)

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PROXY] ${pathname} - User: ${user?.email || 'none'}, isAuth: ${isAuthRoute}`)
    }

    // If user is authenticated and trying to access the public homepage or auth pages, redirect to organizations
    if (user && pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/organizations'
      return NextResponse.redirect(url)
    }

    // If user is authenticated and trying to access auth pages, redirect to target or organizations
    if (user && isAuthRoute) {
      const param =
        request.nextUrl.searchParams.get('next') ||
        request.nextUrl.searchParams.get('redirect') ||
        request.nextUrl.searchParams.get('redirectTo')
      const targetUrl =
        param && param.startsWith('/') && !param.startsWith('//') ? param : '/organizations'
      const url = request.nextUrl.clone()
      url.pathname = targetUrl.split('#')[0]
      url.hash = targetUrl.includes('#') ? `#${targetUrl.split('#')[1]}` : ''
      url.search = ''
      return NextResponse.redirect(url)
    }

    // If user is not authenticated and trying to access protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      // Add the original URL as both next and redirect parameters
      url.searchParams.set('next', pathname)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // IMPORTANT: Return response with updated cookies
    return supabaseResponse
  } catch (err) {
    console.error('[PROXY] Error checking session:', err)
    // On error, allow request to continue - don't block with error
    return supabaseResponse
  }
}
