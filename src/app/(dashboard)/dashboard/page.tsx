import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (userRole?.role) {
    redirect(`/${userRole.role}`)
  }

  // No role assigned yet — show pending state
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-xl font-semibold text-gray-900">Welcome to Sunrise Tennis</h1>
      <p className="mt-2 text-sm text-gray-600">
        Your account is pending role assignment. An admin will set up your access shortly.
      </p>
    </div>
  )
}
