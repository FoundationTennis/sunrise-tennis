'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'

// ── Lesson Notes ────────────────────────────────────────────────────────

export async function createLessonNote(sessionId: string, formData: FormData) {
  const supabase = await createClient()
  const user = await getSessionUser()

  // Get coach_id directly from coaches table (works for admin+coach users)
  const { data: coachRecord } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', user?.id ?? '')
    .single()

  const playerId = formData.get('player_id') as string
  const focus = formData.get('focus') as string
  const progress = formData.get('progress') as string
  const drillsUsed = formData.get('drills_used') as string
  const videoUrl = formData.get('video_url') as string
  const nextPlan = formData.get('next_plan') as string
  const notes = formData.get('notes') as string

  if (!playerId) {
    redirect(`/coach/schedule/${sessionId}?error=${encodeURIComponent('Player is required')}`)
  }

  const { error } = await supabase
    .from('lesson_notes')
    .insert({
      session_id: sessionId,
      player_id: playerId,
      coach_id: coachRecord?.id ?? null,
      focus: focus || null,
      progress: progress || null,
      drills_used: drillsUsed ? drillsUsed.split(',').map(s => s.trim()) : null,
      video_url: videoUrl || null,
      next_plan: nextPlan || null,
      notes: notes || null,
    })

  if (error) {
    redirect(`/coach/schedule/${sessionId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/coach/schedule/${sessionId}`)
  redirect(`/coach/schedule/${sessionId}`)
}

// ── Mark Attendance (coach) ────────────────────────────────────────────

export async function coachUpdateAttendance(sessionId: string, formData: FormData) {
  const supabase = await createClient()

  const entries: { playerId: string; status: string }[] = []
  formData.forEach((value, key) => {
    if (key.startsWith('attendance_')) {
      entries.push({ playerId: key.replace('attendance_', ''), status: value as string })
    }
  })

  for (const entry of entries) {
    await supabase
      .from('attendances')
      .upsert(
        { session_id: sessionId, player_id: entry.playerId, status: entry.status },
        { onConflict: 'session_id,player_id' }
      )
  }

  // Mark session as completed if not already
  await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)
    .eq('status', 'scheduled')

  revalidatePath(`/coach/schedule/${sessionId}`)
  redirect(`/coach/schedule/${sessionId}`)
}
