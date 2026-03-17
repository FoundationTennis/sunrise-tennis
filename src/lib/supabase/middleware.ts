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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = userRole?.role

    // No role assigned yet → show pending page
    if (!role) {
      if (pathname !== '/dashboard') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // Enforce: admins can access everything, others only their own portal
    const routeRole = pathname.split('/')[1] // 'admin', 'coach', or 'parent'
    if (role !== 'admin' && role !== routeRole) {
      const url = request.nextUrl.clone()
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
