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

  // Role-based access: query user_roles to enforce route access
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/coach') || pathname.startsWith('/parent'))) {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roles = userRoles?.map(r => r.role) ?? []

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
