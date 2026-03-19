'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { validateFormData, teamMessageFormSchema } from '@/lib/utils/validation'

async function getParentFamilyId(): Promise<{ userId: string; familyId: string } | null> {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) return null

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!userRole?.family_id) return null
  return { userId: user.id, familyId: userRole.family_id }
}

export async function respondToAvailability(teamId: string, formData: FormData) {
  const supabase = await createClient()
  const auth = await getParentFamilyId()
  if (!auth) redirect('/login')

  // Get family's players on this team
  const { data: familyPlayers } = await supabase
    .from('players')
    .select('id')
    .eq('family_id', auth.familyId)

  const playerIds = new Set(familyPlayers?.map((p) => p.id) ?? [])

  // Process form data: entries like `status_PLAYERID_DATE = available|unavailable|maybe`
  const updates: { playerId: string; matchDate: string; status: string; note: string }[] = []
  formData.forEach((value, key) => {
    if (key.startsWith('status_')) {
      const parts = key.split('_')
      const playerId = parts[1]
      const matchDate = parts.slice(2).join('-') // Rejoin date parts
      if (playerIds.has(playerId)) {
        const status = (value as string).trim()
        // Only accept known statuses
        if (['available', 'unavailable', 'maybe', 'pending'].includes(status)) {
          const noteKey = `note_${playerId}_${parts.slice(2).join('_')}`
          updates.push({
            playerId,
            matchDate,
            status,
            note: ((formData.get(noteKey) as string) || '').trim().slice(0, 500),
          })
        }
      }
    }
  })

  for (const update of updates) {
    await supabase
      .from('availability')
      .update({
        status: update.status,
        responded_at: new Date().toISOString(),
        note: update.note || null,
      })
      .eq('team_id', teamId)
      .eq('player_id', update.playerId)
      .eq('match_date', update.matchDate)
  }

  revalidatePath(`/parent/teams/${teamId}`)
  redirect(`/parent/teams/${teamId}?success=Availability updated`)
}

export async function sendTeamMessage(teamId: string, formData: FormData) {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) redirect('/login')

  // Rate limit: 10 messages per minute per user
  const { checkRateLimitAsync } = await import('@/lib/utils/rate-limit')
  if (!await checkRateLimitAsync(`msg:${user.id}`, 10, 60_000)) {
    redirect(`/parent/teams/${teamId}/chat?error=${encodeURIComponent('Sending too fast. Please wait a moment.')}`)
  }

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
    redirect(`/parent/teams/${teamId}/chat?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/parent/teams/${teamId}/chat`)
  redirect(`/parent/teams/${teamId}/chat`)
}
