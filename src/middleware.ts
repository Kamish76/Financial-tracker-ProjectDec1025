import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/callback',
]

// Define auth routes that should redirect to authenticated area if user is already logged in
const authRoutes = [
  '/auth',
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

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

    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some((route) => pathname === route)

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] ${pathname} - User: ${user?.email || 'none'}, isAuth: ${isAuthRoute}`)
    }

    // If user is authenticated and trying to access auth pages, redirect to organizations
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/organizations'
      return NextResponse.redirect(url)
    }

    // If user is not authenticated and trying to access protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      // Add the original URL as a redirect parameter
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // IMPORTANT: Return response with updated cookies
    return supabaseResponse
  } catch (err) {
    console.error('[MIDDLEWARE] Error checking session:', err)
    // On error, allow request to continue - don't block with error
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
