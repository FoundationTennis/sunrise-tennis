'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { validateFormData, updateContactFormSchema, updatePlayerDetailsFormSchema } from '@/lib/utils/validation'

async function getParentFamilyId(): Promise<string | null> {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) return null

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  return userRole?.family_id ?? null
}

export async function updateContactInfo(formData: FormData) {
  const supabase = await createClient()
  const familyId = await getParentFamilyId()
  if (!familyId) redirect('/login')

  const parsed = validateFormData(formData, updateContactFormSchema)
  if (!parsed.success) {
    redirect(`/parent/settings?error=${encodeURIComponent(parsed.error)}`)
  }

  const { contact_name: contactName, contact_phone: contactPhone, contact_email: contactEmail, address, secondary_name: secondaryName, secondary_phone: secondaryPhone, secondary_email: secondaryEmail } = parsed.data

  const primaryContact = {
    name: contactName,
    phone: contactPhone || undefined,
    email: contactEmail || undefined,
  }

  const secondaryContact = secondaryName ? {
    name: secondaryName,
    phone: secondaryPhone || undefined,
    email: secondaryEmail || undefined,
  } : null

  const { error } = await supabase
    .from('families')
    .update({
      primary_contact: primaryContact,
      secondary_contact: secondaryContact,
      address: address || null,
    })
    .eq('id', familyId)

  if (error) {
    redirect(`/parent/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/parent/settings')
  revalidatePath('/parent')
  redirect('/parent/settings?success=Contact+info+updated')
}

export async function updateMediaConsent(playerId: string, formData: FormData) {
  const supabase = await createClient()
  const familyId = await getParentFamilyId()
  if (!familyId) redirect('/login')

  // Verify parent owns this player
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('family_id', familyId)
    .single()

  if (!player) redirect('/parent/settings')

  const mediaConsent = formData.get('media_consent') === 'on'

  const { error } = await supabase
    .from('players')
    .update({ media_consent: mediaConsent })
    .eq('id', playerId)

  if (error) {
    redirect(`/parent/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/parent/settings')
  redirect('/parent/settings?success=Media+consent+updated')
}

export async function updatePlayerDetails(playerId: string, formData: FormData) {
  const supabase = await createClient()
  const familyId = await getParentFamilyId()
  if (!familyId) redirect('/login')

  // Verify parent owns this player
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('family_id', familyId)
    .single()

  if (!player) redirect('/parent')

  const parsed = validateFormData(formData, updatePlayerDetailsFormSchema)
  if (!parsed.success) {
    redirect(`/parent/players/${playerId}?error=${encodeURIComponent(parsed.error)}`)
  }

  const { first_name: firstName, last_name: lastName, dob, gender, medical_notes: medicalNotes, media_consent: mediaConsent } = parsed.data

  const { error } = await supabase
    .from('players')
    .update({
      first_name: firstName,
      last_name: lastName,
      dob: dob || null,
      gender: gender || null,
      medical_notes: medicalNotes || null,
      media_consent: mediaConsent === 'on',
    })
    .eq('id', playerId)

  if (error) {
    redirect(`/parent/players/${playerId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/parent/players/${playerId}`)
  revalidatePath('/parent')
  redirect(`/parent/players/${playerId}?success=Player+details+updated`)
}
