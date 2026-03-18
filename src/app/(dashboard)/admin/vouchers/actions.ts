'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, requireAdmin } from '@/lib/supabase/server'
import { createCharge, recalculateBalance } from '@/lib/utils/billing'

export async function approveVoucher(voucherId: string) {
  const user = await requireAdmin()
  const supabase = await createClient()

  const { data: voucher, error: fetchError } = await supabase
    .from('vouchers')
    .select('id, family_id, amount_cents, status')
    .eq('id', voucherId)
    .single()

  if (fetchError || !voucher) {
    redirect('/admin/vouchers?error=' + encodeURIComponent('Voucher not found'))
  }

  if (voucher.status !== 'pending') {
    redirect('/admin/vouchers?error=' + encodeURIComponent('Voucher has already been processed'))
  }

  // Create a credit charge for the voucher amount
  const { chargeId } = await createCharge(supabase, {
    familyId: voucher.family_id,
    type: 'voucher',
    sourceType: 'voucher',
    sourceId: voucherId,
    description: `Sports voucher credit - $${(voucher.amount_cents / 100).toFixed(2)}`,
    amountCents: -voucher.amount_cents, // Negative = credit
    status: 'confirmed',
    createdBy: user.id,
  })

  // Update voucher status
  await supabase
    .from('vouchers')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      charge_id: chargeId,
    })
    .eq('id', voucherId)

  revalidatePath('/admin/vouchers')
  revalidatePath('/admin/payments')
  redirect('/admin/vouchers')
}

export async function rejectVoucher(voucherId: string, formData: FormData) {
  const user = await requireAdmin()
  const supabase = await createClient()
  const reason = (formData.get('reason') as string)?.trim() || null

  const { data: voucher, error: fetchError } = await supabase
    .from('vouchers')
    .select('id, status')
    .eq('id', voucherId)
    .single()

  if (fetchError || !voucher) {
    redirect('/admin/vouchers?error=' + encodeURIComponent('Voucher not found'))
  }

  if (voucher.status !== 'pending') {
    redirect('/admin/vouchers?error=' + encodeURIComponent('Voucher has already been processed'))
  }

  await supabase
    .from('vouchers')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      notes: reason,
    })
    .eq('id', voucherId)

  revalidatePath('/admin/vouchers')
  redirect('/admin/vouchers')
}
