'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push/send'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validateFormData, enrolFormSchema } from '@/lib/utils/validation'
import { createCharge, getTermPrice, getSessionPrice } from '@/lib/utils/billing'

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

export async function enrolInProgram(programId: string, familyId: string, formData: FormData) {
  const supabase = await createClient()
  const auth = await getParentFamilyId()
  if (!auth || auth.familyId !== familyId) redirect('/login')

  const parsed = validateFormData(formData, enrolFormSchema)
  if (!parsed.success) {
    redirect(`/parent/programs/${programId}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { player_id: playerId, booking_type: bookingType, payment_option: paymentOption, notes } = parsed.data

  // Verify player belongs to this family
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('family_id', familyId)
    .single()

  if (!player) {
    redirect(`/parent/programs/${programId}?error=${encodeURIComponent('Player not found')}`)
  }

  // Check not already enrolled
  const { data: existing } = await supabase
    .from('program_roster')
    .select('id')
    .eq('program_id', programId)
    .eq('player_id', playerId)
    .eq('status', 'enrolled')
    .single()

  if (existing) {
    redirect(`/parent/programs/${programId}?error=${encodeURIComponent('Player is already enrolled in this program')}`)
  }

  // Check capacity and get program details
  const [{ data: program }, { count: enrolledCount }] = await Promise.all([
    supabase.from('programs').select('max_capacity, name, type, term_fee_cents, per_session_cents, early_pay_discount_pct').eq('id', programId).single(),
    supabase.from('program_roster').select('*', { count: 'exact', head: true }).eq('program_id', programId).eq('status', 'enrolled'),
  ])

  if (program?.max_capacity && enrolledCount !== null && enrolledCount >= program.max_capacity) {
    redirect(`/parent/programs/${programId}?error=${encodeURIComponent('This program is full')}`)
  }

  // Add to roster
  const { error: rosterError } = await supabase
    .from('program_roster')
    .insert({
      program_id: programId,
      player_id: playerId,
      status: 'enrolled',
    })

  if (rosterError) {
    redirect(`/parent/programs/${programId}?error=${encodeURIComponent(rosterError.message)}`)
  }

  // ── Financial logic ──────────────────────────────────────────────────

  const isTermEnrollment = bookingType === 'term_enrollment' || bookingType === 'term'
  const effectivePaymentOption = isTermEnrollment ? (paymentOption || 'pay_later') : null

  // Count remaining sessions for pro-rata
  const { count: remainingSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId)
    .gte('date', new Date().toISOString().split('T')[0])
    .eq('status', 'scheduled')

  const sessionsTotal = remainingSessions ?? 0

  // Resolve pricing (family override > program default)
  let priceCents = 0
  let discountCents = 0

  if (isTermEnrollment && effectivePaymentOption === 'pay_now') {
    // Term fee (may be overridden per family)
    const termPrice = await getTermPrice(supabase, familyId, programId, program?.type)
    const sessionPrice = await getSessionPrice(supabase, familyId, programId, program?.type)

    // Use term fee if set, otherwise per-session * remaining sessions
    priceCents = termPrice > 0 ? termPrice : sessionPrice * sessionsTotal

    // Apply early-pay discount
    const discountPct = program?.early_pay_discount_pct ?? 0
    if (discountPct > 0 && priceCents > 0) {
      discountCents = Math.round(priceCents * (discountPct / 100))
    }
  } else if (isTermEnrollment && effectivePaymentOption === 'pay_later') {
    // No charge now — charges created per-session via attendance
    const sessionPrice = await getSessionPrice(supabase, familyId, programId, program?.type)
    priceCents = sessionPrice * sessionsTotal
  } else if (bookingType === 'casual') {
    priceCents = await getSessionPrice(supabase, familyId, programId, program?.type)
  }
  // trial = free, priceCents stays 0

  // Create booking record with financial data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      family_id: familyId,
      player_id: playerId,
      program_id: programId,
      booking_type: bookingType,
      status: 'confirmed',
      booked_by: auth.userId,
      notes: notes || null,
      payment_option: effectivePaymentOption,
      price_cents: priceCents,
      discount_cents: discountCents,
      sessions_total: sessionsTotal,
      sessions_charged: 0,
    })
    .select('id')
    .single()

  if (bookingError) {
    console.error('Booking record failed:', bookingError.message)
  }

  // Create charge for pay-now term enrollment
  if (isTermEnrollment && effectivePaymentOption === 'pay_now' && priceCents > 0 && booking) {
    const chargeAmount = priceCents - discountCents
    const discountDesc = discountCents > 0
      ? ` (${program?.early_pay_discount_pct}% early payment discount applied)`
      : ''

    await createCharge(supabase, {
      familyId,
      playerId,
      type: 'term_enrollment',
      sourceType: 'enrollment',
      sourceId: booking.id,
      programId,
      bookingId: booking.id,
      description: `${program?.name ?? 'Program'} - Term enrolment${discountDesc}`,
      amountCents: chargeAmount,
      status: 'confirmed',
      createdBy: auth.userId,
    })
  }

  // Create charge for casual booking
  if (bookingType === 'casual' && priceCents > 0 && booking) {
    await createCharge(supabase, {
      familyId,
      playerId,
      type: 'casual',
      sourceType: 'enrollment',
      sourceId: booking.id,
      programId,
      bookingId: booking.id,
      description: `${program?.name ?? 'Program'} - Casual session`,
      amountCents: priceCents,
      status: 'pending',
      createdBy: auth.userId,
    })
  }

  // ── Notification ─────────────────────────────────────────────────────

  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: notification } = await serviceClient
      .from('notifications')
      .insert({
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        body: `Successfully enrolled in ${program?.name ?? 'program'}.`,
        url: `/parent/programs/${programId}`,
        target_type: 'family',
        target_id: familyId,
        created_by: auth.userId,
      })
      .select('id')
      .single()

    if (notification) {
      await serviceClient
        .from('notification_recipients')
        .insert({ notification_id: notification.id, user_id: auth.userId })
    }

    await sendPushToUser(auth.userId, {
      title: 'Booking Confirmed',
      body: `Successfully enrolled in ${program?.name ?? 'program'}.`,
      url: `/parent/programs/${programId}`,
    })
  } catch (e) {
    console.error('Booking notification failed:', e instanceof Error ? e.message : 'Unknown error')
  }

  // Redirect — if pay_now, send to payments page
  if (isTermEnrollment && effectivePaymentOption === 'pay_now' && priceCents > 0) {
    revalidatePath(`/parent/programs/${programId}`)
    revalidatePath('/parent/programs')
    revalidatePath('/parent')
    revalidatePath('/parent/payments')
    redirect(`/parent/payments?success=${encodeURIComponent('Enrolled! Complete your payment below.')}`)
  }

  revalidatePath(`/parent/programs/${programId}`)
  revalidatePath('/parent/programs')
  revalidatePath('/parent')
  redirect(`/parent/programs/${programId}?success=${encodeURIComponent('Successfully enrolled!')}`)
}
