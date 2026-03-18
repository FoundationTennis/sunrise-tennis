'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser, requireAdmin } from '@/lib/supabase/server'
import { sendNotificationToTarget } from '@/lib/push/send'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  validateFormData,
  createFamilyFormSchema,
  updateFamilyFormSchema,
  createPlayerFormSchema,
  updatePlayerFormSchema,
  createProgramFormSchema,
  updateProgramFormSchema,
  createSessionFormSchema,
  createInvitationFormSchema,
  attendanceStatusSchema,
} from '@/lib/utils/validation'

// ── Families ────────────────────────────────────────────────────────────

export async function createFamily(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, createFamilyFormSchema)
  if (!parsed.success) {
    redirect(`/admin/families/new?error=${encodeURIComponent(parsed.error)}`)
  }

  // Generate next display_id (C001, C002, etc.)
  const { data: lastFamily } = await supabase
    .from('families')
    .select('display_id')
    .order('display_id', { ascending: false })
    .limit(1)
    .single()

  let nextNum = 1
  if (lastFamily?.display_id) {
    const match = lastFamily.display_id.match(/C(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }
  const displayId = `C${String(nextNum).padStart(3, '0')}`

  const { family_name: familyName, contact_name: contactName, contact_phone: contactPhone, contact_email: contactEmail, address, referred_by: referredBy } = parsed.data

  const primaryContact = {
    name: contactName,
    phone: contactPhone || undefined,
    email: contactEmail || undefined,
  }

  const { data, error } = await supabase
    .from('families')
    .insert({
      display_id: displayId,
      family_name: familyName,
      primary_contact: primaryContact,
      address: address || null,
      referred_by: referredBy || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/admin/families/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/families')
  redirect(`/admin/families/${data.id}`)
}

export async function updateFamily(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, updateFamilyFormSchema)
  if (!parsed.success) {
    redirect(`/admin/families/${id}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { family_name: familyName, contact_name: contactName, contact_phone: contactPhone, contact_email: contactEmail, address, status, notes } = parsed.data

  const primaryContact = {
    name: contactName,
    phone: contactPhone || undefined,
    email: contactEmail || undefined,
  }

  const { error } = await supabase
    .from('families')
    .update({
      family_name: familyName,
      primary_contact: primaryContact,
      address: address || null,
      status,
      notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    redirect(`/admin/families/${id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/families/${id}`)
  revalidatePath('/admin/families')
  redirect(`/admin/families/${id}`)
}

// ── Players ─────────────────────────────────────────────────────────────

export async function createPlayer(familyId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, createPlayerFormSchema)
  if (!parsed.success) {
    redirect(`/admin/families/${familyId}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { first_name: firstName, last_name: lastName, dob, ball_color: ballColor, level, medical_notes: medicalNotes } = parsed.data

  const { error } = await supabase
    .from('players')
    .insert({
      family_id: familyId,
      first_name: firstName,
      last_name: lastName,
      dob: dob || null,
      ball_color: ballColor || null,
      level: level || null,
      medical_notes: medicalNotes || null,
      status: 'active',
    })

  if (error) {
    redirect(`/admin/families/${familyId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/families/${familyId}`)
  redirect(`/admin/families/${familyId}`)
}

export async function updatePlayer(playerId: string, familyId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, updatePlayerFormSchema)
  if (!parsed.success) {
    redirect(`/admin/families/${familyId}/players/${playerId}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { first_name: firstName, last_name: lastName, dob, ball_color: ballColor, level, medical_notes: medicalNotes, current_focus: currentFocus, short_term_goal: shortTermGoal, long_term_goal: longTermGoal, media_consent: mediaConsent } = parsed.data

  const { error } = await supabase
    .from('players')
    .update({
      first_name: firstName,
      last_name: lastName,
      dob: dob || null,
      ball_color: ballColor || null,
      level: level || null,
      medical_notes: medicalNotes || null,
      current_focus: currentFocus ? currentFocus.split(',').map((s) => s.trim()) : null,
      short_term_goal: shortTermGoal || null,
      long_term_goal: longTermGoal || null,
      media_consent: mediaConsent === 'on',
    })
    .eq('id', playerId)

  if (error) {
    redirect(`/admin/families/${familyId}/players/${playerId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/families/${familyId}/players/${playerId}`)
  revalidatePath(`/admin/families/${familyId}`)
  redirect(`/admin/families/${familyId}/players/${playerId}`)
}

// ── Invitations ────────────────────────────────────────────────────────

export async function createInvitation(familyId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, createInvitationFormSchema)
  if (!parsed.success) {
    redirect(`/admin/families/${familyId}?error=${encodeURIComponent(parsed.error)}`)
  }

  // Generate a URL-safe token
  const token = crypto.randomUUID()

  const user = await getSessionUser()

  const { error } = await supabase
    .from('invitations')
    .insert({
      family_id: familyId,
      email: parsed.data.email,
      token,
      status: 'pending',
      created_by: user?.id,
    })

  if (error) {
    redirect(`/admin/families/${familyId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/families/${familyId}`)
  redirect(`/admin/families/${familyId}?invited=${encodeURIComponent(token)}`)
}

// ── Programs ────────────────────────────────────────────────────────────

export async function createProgram(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, createProgramFormSchema)
  if (!parsed.success) {
    redirect(`/admin/programs/new?error=${encodeURIComponent(parsed.error)}`)
  }

  const { name, type, level, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, max_capacity: maxCapacity, per_session_dollars: perSessionDollars, term_fee_dollars: termFeeDollars, description } = parsed.data

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('programs')
    .insert({
      name,
      type: type as string,
      level: (level || '') as string,
      day_of_week: dayOfWeek ? parseInt(dayOfWeek, 10) : null,
      start_time: startTime || null,
      end_time: endTime || null,
      max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
      per_session_cents: perSessionDollars ? Math.round(parseFloat(perSessionDollars) * 100) : null,
      term_fee_cents: termFeeDollars ? Math.round(parseFloat(termFeeDollars) * 100) : null,
      description: description || null,
      slug,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/admin/programs/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/programs')
  redirect(`/admin/programs/${data.id}`)
}

export async function updateProgram(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, updateProgramFormSchema)
  if (!parsed.success) {
    redirect(`/admin/programs/${id}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { name, type, level, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, max_capacity: maxCapacity, per_session_dollars: perSessionDollars, term_fee_dollars: termFeeDollars, description, status } = parsed.data

  const { error } = await supabase
    .from('programs')
    .update({
      name,
      type: type as string,
      level: (level || undefined) as string | undefined,
      day_of_week: dayOfWeek ? parseInt(dayOfWeek, 10) : null,
      start_time: startTime || null,
      end_time: endTime || null,
      max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
      per_session_cents: perSessionDollars ? Math.round(parseFloat(perSessionDollars) * 100) : null,
      term_fee_cents: termFeeDollars ? Math.round(parseFloat(termFeeDollars) * 100) : null,
      description: description || null,
      status: status || undefined,
    })
    .eq('id', id)

  if (error) {
    redirect(`/admin/programs/${id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/programs/${id}`)
  revalidatePath('/admin/programs')
  redirect(`/admin/programs/${id}`)
}

// ── Sessions ───────────────────────────────────────────────────────────

export async function createSession(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = validateFormData(formData, createSessionFormSchema)
  if (!parsed.success) {
    redirect(`/admin/sessions?error=${encodeURIComponent(parsed.error)}`)
  }

  const { program_id: programId, date, start_time: startTime, end_time: endTime, session_type: sessionType, coach_id: coachId, venue_id: venueId } = parsed.data

  const { error } = await supabase
    .from('sessions')
    .insert({
      program_id: programId || null,
      date,
      start_time: startTime || null,
      end_time: endTime || null,
      session_type: sessionType,
      coach_id: coachId || null,
      venue_id: venueId || null,
      status: 'scheduled',
    })

  if (error) {
    redirect(`/admin/sessions?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/sessions')
  redirect('/admin/sessions')
}

export async function updateAttendance(sessionId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  // Parse attendance entries from form: attendance_PLAYERID = present|absent|late
  const entries: { playerId: string; status: string }[] = []
  formData.forEach((value, key) => {
    if (key.startsWith('attendance_')) {
      const playerId = key.replace('attendance_', '')
      const status = value as string
      // Validate each attendance status
      const statusResult = attendanceStatusSchema.safeParse(status)
      if (statusResult.success) {
        entries.push({ playerId, status: statusResult.data })
      }
    }
  })

  // Upsert attendance records
  for (const entry of entries) {
    await supabase
      .from('attendances')
      .upsert(
        { session_id: sessionId, player_id: entry.playerId, status: entry.status },
        { onConflict: 'session_id,player_id' }
      )
  }

  revalidatePath(`/admin/sessions/${sessionId}`)
  redirect(`/admin/sessions/${sessionId}`)
}

export async function cancelSession(sessionId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const reason = (formData.get('reason') as string)?.trim() || null

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
    })
    .eq('id', sessionId)

  if (error) {
    redirect(`/admin/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath('/admin/sessions')
  redirect('/admin/sessions')
}

// ── Admin Booking on Behalf ────────────────────────────────────────────

export async function adminBookPlayer(formData: FormData) {
  const user = await requireAdmin()
  const supabase = await createClient()

  const familyId = formData.get('family_id') as string
  const playerId = formData.get('player_id') as string
  const programId = formData.get('program_id') as string
  const bookingType = formData.get('booking_type') as string
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!familyId || !playerId || !programId) {
    redirect(`/admin/programs?error=${encodeURIComponent('Missing required fields')}`)
  }

  // Add to roster if term/casual enrolment
  const { data: existing } = await supabase
    .from('program_roster')
    .select('id')
    .eq('program_id', programId)
    .eq('player_id', playerId)
    .eq('status', 'enrolled')
    .single()

  if (!existing) {
    await supabase
      .from('program_roster')
      .insert({
        program_id: programId,
        player_id: playerId,
        status: 'enrolled',
      })
  }

  // Create booking record
  const { error } = await supabase
    .from('bookings')
    .insert({
      family_id: familyId,
      player_id: playerId,
      program_id: programId,
      booking_type: bookingType,
      status: 'confirmed',
      booked_by: user?.id,
      notes,
    })

  if (error) {
    redirect(`/admin/programs/${programId}?error=${encodeURIComponent(error.message)}`)
  }

  // Send booking confirmation notification to parent
  try {
    const { data: programInfo } = await supabase
      .from('programs')
      .select('name')
      .eq('id', programId)
      .single()

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: notification } = await serviceClient
      .from('notifications')
      .insert({
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        body: `Your child has been enrolled in ${programInfo?.name ?? 'a program'} by the admin.`,
        url: `/parent/programs/${programId}`,
        target_type: 'family',
        target_id: familyId,
        created_by: user?.id,
      })
      .select('id')
      .single()

    const userIds = await sendNotificationToTarget({
      title: 'Booking Confirmed',
      body: `Your child has been enrolled in ${programInfo?.name ?? 'a program'} by the admin.`,
      url: `/parent/programs/${programId}`,
      targetType: 'family',
      targetId: familyId,
    })

    if (notification && userIds.length > 0) {
      await serviceClient
        .from('notification_recipients')
        .insert(userIds.map((uid) => ({ notification_id: notification.id, user_id: uid })))
    }
  } catch (e) {
    console.error('Booking notification failed:', e instanceof Error ? e.message : 'Unknown error')
  }

  revalidatePath(`/admin/programs/${programId}`)
  revalidatePath('/admin/sessions')
  redirect(`/admin/programs/${programId}`)
}
