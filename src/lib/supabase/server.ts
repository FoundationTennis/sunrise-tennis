import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'
import type { User } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the current user from the session cookie — no network call.
 * Middleware already verifies the JWT on every request, so reading
 * from the cookie here is safe. RLS enforces data-level security.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

/**
 * Require the current user to have admin role.
 * Throws a redirect to /dashboard if not admin.
 * Use as the first line in admin server actions for defense-in-depth
 * (middleware + RLS are the primary barriers, this is the safety net).
 */
export async function requireAdmin(): Promise<User> {
  const { redirect } = await import('next/navigation')
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) return redirect('/login') as never

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!data) return redirect('/dashboard') as never
  return user
}
