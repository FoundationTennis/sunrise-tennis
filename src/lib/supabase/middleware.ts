import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() is required here to refresh the session token.
  // This is the ONLY place in the app that should call getUser().
  // All other code uses getSessionUser() which reads from the cookie (no network call).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicPaths = ['/', '/philosophy', '/contact', '/login', '/signup', '/verify']
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith('/api/public')
  )
  const isAuthCallback = pathname.startsWith('/auth/callback')

  // Unauthenticated user on protected route → login
  if (!user && !isPublicPath && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user on auth pages → redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based access: use cached roles cookie to avoid DB query per request
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/coach') || pathname.startsWith('/parent'))) {
    let roles: string[] = []

    // Try cached roles first
    const cachedRoles = request.cookies.get('x-user-roles')?.value
    if (cachedRoles) {
      roles = cachedRoles.split(',')
    } else {
      // First request or cache expired — query and cache
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      roles = userRoles?.map(r => r.role) ?? []

      // Cache for 5 minutes (roles rarely change)
      supabaseResponse.cookies.set('x-user-roles', roles.join(','), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300, // 5 minutes
        path: '/',
      })
    }

    // No roles assigned yet → show pending page
    if (roles.length === 0) {
      if (pathname !== '/dashboard') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    const isAdmin = roles.includes('admin')
    const routeRole = pathname.split('/')[1] // 'admin', 'coach', or 'parent'

    // Admins can access all portals (admin, coach, parent)
    // Others can only access their own portal
    if (!isAdmin && !roles.includes(routeRole)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${roles[0]}`
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
