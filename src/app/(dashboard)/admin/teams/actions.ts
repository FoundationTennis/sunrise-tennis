'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser, requireAdmin } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendNotificationToTarget, sendPushToUser } from '@/lib/push/send'
import { validateFormData, createTeamFormSchema, updateTeamFormSchema, addTeamMemberFormSchema, teamMessageFormSchema } from '@/lib/utils/validation'

export async function createTeam(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, createTeamFormSchema)
  if (!parsed.success) {
    redirect(`/admin/teams/new?error=${encodeURIComponent(parsed.error)}`)
  }

  const { name, season, program_id: programId, coach_id: coachId } = parsed.data

  const { data, error } = await supabase
    .from('teams')
    .insert({
      name,
      season: season || null,
      program_id: programId || null,
      coach_id: coachId || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/admin/teams/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/teams')
  redirect(`/admin/teams/${data.id}`)
}

export async function updateTeam(teamId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, updateTeamFormSchema)
  if (!parsed.success) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { name, season, coach_id: coachId, status } = parsed.data

  const { error } = await supabase
    .from('teams')
    .update({
      name,
      season: season || null,
      coach_id: coachId || null,
      status: status || undefined,
    })
    .eq('id', teamId)

  if (error) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/teams/${teamId}`)
  redirect(`/admin/teams/${teamId}`)
}

export async function addTeamMember(teamId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, addTeamMemberFormSchema)
  if (!parsed.success) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { player_id: playerId, role } = parsed.data

  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      player_id: playerId,
      role: role || 'member',
    })

  if (error) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/teams/${teamId}`)
  redirect(`/admin/teams/${teamId}`)
}

export async function removeTeamMember(teamId: string, formData: FormData) {
  await requireAdmin()
  const memberId = (formData.get('member_id') as string)?.trim()
  if (!memberId) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent('Member ID is required')}`)
  }

  // Use service role to delete team member (no DELETE policy, so use service role)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await serviceClient
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('team_id', teamId)

  if (error) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/teams/${teamId}`)
  redirect(`/admin/teams/${teamId}`)
}

export async function sendAvailabilityCheck(teamId: string, formData: FormData) {
  const user = await requireAdmin()
  const supabase = await createClient()

  const matchDate = (formData.get('match_date') as string)?.trim()
  if (!matchDate) redirect(`/admin/teams/${teamId}?error=Match date is required`)

  // Get team members
  const { data: members } = await supabase
    .from('team_members')
    .select('player_id')
    .eq('team_id', teamId)

  if (!members?.length) {
    redirect(`/admin/teams/${teamId}?error=No team members`)
  }

  // Use service role for upserts
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Create/reset availability records for each member
  for (const member of members) {
    await serviceClient
      .from('availability')
      .upsert(
        {
          team_id: teamId,
          player_id: member.player_id,
          match_date: matchDate,
          status: 'pending',
          responded_at: null,
          note: null,
        },
        { onConflict: 'team_id,player_id,match_date' },
      )
  }

  // Get team name for notification
  const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()

  // Send notification to team
  const { data: notification } = await supabase
    .from('notifications')
    .insert({
      type: 'availability_check',
      title: `Availability check: ${team?.name ?? 'Team'}`,
      body: `Are you available for ${matchDate}? Please respond.`,
      url: `/parent/teams/${teamId}`,
      target_type: 'team',
      target_id: teamId,
      created_by: user.id,
    })
    .select('id')
    .single()

  const userIds = await sendNotificationToTarget({
    title: `Availability check: ${team?.name ?? 'Team'}`,
    body: `Are you available for ${matchDate}? Please respond.`,
    url: `/parent/teams/${teamId}`,
    targetType: 'team',
    targetId: teamId,
  })

  // Create recipient records
  if (notification && userIds.length > 0) {
    await serviceClient
      .from('notification_recipients')
      .insert(userIds.map((uid) => ({ notification_id: notification.id, user_id: uid })))
  }

  revalidatePath(`/admin/teams/${teamId}`)
  redirect(`/admin/teams/${teamId}?success=Availability check sent`)
}

export async function sendTeamMessage(teamId: string, formData: FormData) {
  const user = await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, teamMessageFormSchema)
  if (!parsed.success) return

  const { body } = parsed.data

  const { error } = await supabase
    .from('team_messages')
    .insert({
      team_id: teamId,
      sender_id: user.id,
      body,
    })

  if (error) {
    redirect(`/admin/teams/${teamId}/chat?error=${encodeURIComponent(error.message)}`)
  }

  // Send push to team members
  const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
  await sendNotificationToTarget({
    title: `${team?.name ?? 'Team'} chat`,
    body: body.slice(0, 100),
    url: `/parent/teams/${teamId}/chat`,
    targetType: 'team',
    targetId: teamId,
  })

  revalidatePath(`/admin/teams/${teamId}/chat`)
  redirect(`/admin/teams/${teamId}/chat`)
}
