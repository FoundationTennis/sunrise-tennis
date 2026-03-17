'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getParentFamilyId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const contactName = formData.get('contact_name') as string
  const contactPhone = formData.get('contact_phone') as string
  const contactEmail = formData.get('contact_email') as string
  const address = formData.get('address') as string

  const secondaryName = formData.get('secondary_name') as string
  const secondaryPhone = formData.get('secondary_phone') as string
  const secondaryEmail = formData.get('secondary_email') as string

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
