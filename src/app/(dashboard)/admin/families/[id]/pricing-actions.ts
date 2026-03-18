'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, requireAdmin } from '@/lib/supabase/server'

export async function addFamilyPricing(familyId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const programId = (formData.get('program_id') as string) || null
  const programType = (formData.get('program_type') as string) || null
  const perSessionDollars = formData.get('per_session_dollars') as string
  const termFeeDollars = formData.get('term_fee_dollars') as string
  const notes = (formData.get('notes') as string)?.trim() || null
  const validFrom = (formData.get('valid_from') as string) || new Date().toISOString().split('T')[0]
  const validUntil = (formData.get('valid_until') as string) || null

  const perSessionCents = perSessionDollars ? Math.round(parseFloat(perSessionDollars) * 100) : null
  const termFeeCents = termFeeDollars ? Math.round(parseFloat(termFeeDollars) * 100) : null

  if (!perSessionCents && !termFeeCents) {
    redirect(`/admin/families/${familyId}?error=${encodeURIComponent('Please set at least one price override')}`)
  }

  const { error } = await supabase
    .from('family_pricing')
    .insert({
      family_id: familyId,
      program_id: programId,
      program_type: programType,
      per_session_cents: perSessionCents,
      term_fee_cents: termFeeCents,
      notes,
      valid_from: validFrom,
      valid_until: validUntil || null,
    })

  if (error) {
    redirect(`/admin/families/${familyId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/admin/families/${familyId}`)
  redirect(`/admin/families/${familyId}`)
}

export async function removeFamilyPricing(familyId: string, pricingId: string) {
  await requireAdmin()
  const supabase = await createClient()

  await supabase.from('family_pricing').delete().eq('id', pricingId)

  revalidatePath(`/admin/families/${familyId}`)
  redirect(`/admin/families/${familyId}`)
}
