'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requireAdmin } from '@/lib/supabase/server'

export async function updateCoach(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const coachId = formData.get('coach_id') as string
  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const groupRateStr = formData.get('group_rate') as string
  const privateRateStr = formData.get('private_rate') as string
  const payPeriod = formData.get('pay_period') as string

  if (!coachId || !name) return

  const groupRateCents = groupRateStr ? Math.round(parseFloat(groupRateStr) * 100) : 0
  const privateRateCents = privateRateStr ? Math.round(parseFloat(privateRateStr) * 100) : 0

  const { error } = await supabase
    .from('coaches')
    .update({
      name,
      phone,
      email,
      hourly_rate: { group_rate_cents: groupRateCents, private_rate_cents: privateRateCents },
      pay_period: payPeriod || 'weekly',
    })
    .eq('id', coachId)

  if (error) {
    console.error('Failed to update coach:', error.message)
  }

  revalidatePath(`/admin/coaches/${coachId}`)
  revalidatePath('/admin/coaches')
  revalidatePath('/admin')
}
