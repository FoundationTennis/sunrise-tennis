'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { validateFormData, submitVoucherFormSchema } from '@/lib/utils/validation'

export async function submitVoucher(formData: FormData) {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) redirect('/login')

  // Rate limit: 3 voucher submissions per minute per user
  const { checkRateLimitAsync } = await import('@/lib/utils/rate-limit')
  if (!await checkRateLimitAsync(`voucher:${user.id}`, 3, 60_000)) {
    redirect('/parent/payments?error=' + encodeURIComponent('Too many attempts. Please wait a moment.'))
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!userRole?.family_id) {
    redirect('/parent/payments?error=' + encodeURIComponent('No family account linked'))
  }

  const parsed = validateFormData(formData, submitVoucherFormSchema)
  if (!parsed.success) {
    redirect('/parent/payments?error=' + encodeURIComponent(parsed.error))
  }

  const { voucher_code: voucherCode, voucher_type: voucherType } = parsed.data

  const { error } = await supabase
    .from('vouchers')
    .insert({
      family_id: userRole.family_id,
      voucher_code: voucherCode,
      voucher_type: voucherType,
      amount_cents: 10000, // Fixed $100 for SA vouchers
      status: 'pending',
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    })

  if (error) {
    redirect('/parent/payments?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/parent/payments')
  redirect('/parent/payments?success=' + encodeURIComponent('Sports voucher submitted for review'))
}
