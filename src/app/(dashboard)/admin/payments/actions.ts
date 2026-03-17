'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'

// ── Record Payment ──────────────────────────────────────────────────────

export async function recordPayment(formData: FormData) {
  const supabase = await createClient()
  const user = await getSessionUser()

  const familyId = formData.get('family_id') as string
  const amountDollars = formData.get('amount_dollars') as string
  const paymentMethod = formData.get('payment_method') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const notes = formData.get('notes') as string
  const status = formData.get('status') as string || 'received'

  if (!familyId || !amountDollars || !paymentMethod) {
    redirect('/admin/payments?error=' + encodeURIComponent('Family, amount, and payment method are required'))
  }

  const amountCents = Math.round(parseFloat(amountDollars) * 100)
  if (isNaN(amountCents) || amountCents <= 0) {
    redirect('/admin/payments?error=' + encodeURIComponent('Invalid amount'))
  }

  const { error } = await supabase
    .from('payments')
    .insert({
      family_id: familyId,
      amount_cents: amountCents,
      payment_method: paymentMethod,
      status,
      category: category || null,
      description: description || null,
      notes: notes || null,
      received_at: status === 'received' ? new Date().toISOString() : null,
      recorded_by: user?.id,
    })

  if (error) {
    redirect('/admin/payments?error=' + encodeURIComponent(error.message))
  }

  // Update family balance (credit - payment received reduces debt)
  const { data: currentBalance } = await supabase
    .from('family_balance')
    .select('balance_cents')
    .eq('family_id', familyId)
    .single()

  if (currentBalance) {
    await supabase
      .from('family_balance')
      .update({
        balance_cents: currentBalance.balance_cents + amountCents,
        last_updated: new Date().toISOString(),
      })
      .eq('family_id', familyId)
  } else {
    await supabase
      .from('family_balance')
      .insert({
        family_id: familyId,
        balance_cents: amountCents,
        last_updated: new Date().toISOString(),
      })
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  revalidatePath(`/admin/families/${familyId}`)
  redirect('/admin/payments')
}

// ── Confirm Pending Payment ──────────────────────────────────────────────

export async function confirmPayment(paymentId: string) {
  const supabase = await createClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('family_id, amount_cents, status')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    redirect('/admin/payments?error=' + encodeURIComponent('Payment not found'))
  }

  if (payment.status === 'received') {
    redirect('/admin/payments?error=' + encodeURIComponent('Payment already confirmed'))
  }

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'received',
      received_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (error) {
    redirect('/admin/payments?error=' + encodeURIComponent(error.message))
  }

  // Update balance only if transitioning from pending to received
  if (payment.status === 'pending') {
    const { data: currentBalance } = await supabase
      .from('family_balance')
      .select('balance_cents')
      .eq('family_id', payment.family_id)
      .single()

    if (currentBalance) {
      await supabase
        .from('family_balance')
        .update({
          balance_cents: currentBalance.balance_cents + payment.amount_cents,
          last_updated: new Date().toISOString(),
        })
        .eq('family_id', payment.family_id)
    }
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  redirect('/admin/payments')
}

// ── Create Invoice ──────────────────────────────────────────────────────

export async function createInvoice(formData: FormData) {
  const supabase = await createClient()

  const familyId = formData.get('family_id') as string
  const amountDollars = formData.get('amount_dollars') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('due_date') as string

  if (!familyId || !amountDollars) {
    redirect('/admin/payments/invoices?error=' + encodeURIComponent('Family and amount are required'))
  }

  const amountCents = Math.round(parseFloat(amountDollars) * 100)

  // Generate next invoice display_id
  const currentYear = new Date().getFullYear()
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('display_id')
    .like('display_id', `INV-${currentYear}-%`)
    .order('display_id', { ascending: false })
    .limit(1)
    .single()

  let nextNum = 1
  if (lastInvoice?.display_id) {
    const match = lastInvoice.display_id.match(/INV-\d{4}-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }
  const displayId = `INV-${currentYear}-${String(nextNum).padStart(3, '0')}`

  const items = description ? [{ description, amount_cents: amountCents }] : []

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      display_id: displayId,
      family_id: familyId,
      amount_cents: amountCents,
      status: 'sent',
      due_date: dueDate || null,
      items,
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    redirect('/admin/payments/invoices?error=' + encodeURIComponent(error.message))
  }

  // Debit family balance (invoice = money owed)
  const { data: currentBalance } = await supabase
    .from('family_balance')
    .select('balance_cents')
    .eq('family_id', familyId)
    .single()

  if (currentBalance) {
    await supabase
      .from('family_balance')
      .update({
        balance_cents: currentBalance.balance_cents - amountCents,
        last_updated: new Date().toISOString(),
      })
      .eq('family_id', familyId)
  } else {
    await supabase
      .from('family_balance')
      .insert({
        family_id: familyId,
        balance_cents: -amountCents,
        last_updated: new Date().toISOString(),
      })
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin/payments/invoices')
  revalidatePath('/admin')
  redirect('/admin/payments/invoices')
}
