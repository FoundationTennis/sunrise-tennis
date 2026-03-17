import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a role (may have multiple)
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const roles = userRoles?.map(r => r.role) ?? []

  if (roles.length > 0) {
    // Redirect to highest-priority role
    const primaryRole = roles.includes('admin') ? 'admin' : roles[0]
    redirect(`/${primaryRole}`)
  }

  // No role yet — check if user signed up with an invite token
  const inviteToken = user.user_metadata?.invite_token as string | undefined

  if (inviteToken) {
    // Look up the invitation
    const { data: invitation } = await supabase
      .from('invitations')
      .select('id, family_id, status, expires_at')
      .eq('token', inviteToken)
      .eq('status', 'pending')
      .single()

    if (invitation) {
      const now = new Date()
      const expires = invitation.expires_at ? new Date(invitation.expires_at) : null
      const isValid = !expires || expires > now

      if (isValid) {
        // Create user_roles entry for this parent
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'parent',
            family_id: invitation.family_id,
          })

        if (!roleError) {
          // Mark invitation as claimed
          await supabase
            .from('invitations')
            .update({
              status: 'claimed',
              claimed_by: user.id,
              claimed_at: new Date().toISOString(),
            })
            .eq('id', invitation.id)

          // Clear the invite token from user metadata
          await supabase.auth.updateUser({
            data: { invite_token: null },
          })

          redirect('/parent')
        }
      }
    }
  }

  // No role assigned and no valid invite — show pending state
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-xl font-semibold text-gray-900">Welcome to Sunrise Tennis</h1>
      <p className="mt-2 text-sm text-gray-600">
        Your account is pending role assignment. An admin will set up your access shortly.
      </p>
    </div>
  )
}
