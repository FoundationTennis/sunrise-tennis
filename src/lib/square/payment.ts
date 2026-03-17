'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Process a Square card payment.
 * Called after the client-side Square Web Payments SDK tokenises the card.
 * The sourceId (nonce) is the only card-related data we ever touch.
 */
export async function processSquarePayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sourceId = formData.get('source_id') as string
  const familyId = formData.get('family_id') as string
  const amountDollars = formData.get('amount_dollars') as string
  const description = formData.get('description') as string
  const invoiceId = formData.get('invoice_id') as string

  if (!sourceId || !familyId || !amountDollars) {
    redirect('/parent/payments?error=' + encodeURIComponent('Missing payment details'))
  }

  const amountCents = Math.round(parseFloat(amountDollars) * 100)

  // Call Square Payments API
  const squareEnv = process.env.SQUARE_ENVIRONMENT || 'sandbox'
  const squareBaseUrl = squareEnv === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com'

  const idempotencyKey = crypto.randomUUID()

  const squareResponse = await fetch(`${squareBaseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      'Square-Version': '2024-01-18',
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: {
        amount: amountCents,
        currency: 'AUD',
      },
      note: description || 'Sunrise Tennis payment',
    }),
  })

  const squareResult = await squareResponse.json()

  if (!squareResponse.ok || squareResult.errors) {
    const errorMsg = squareResult.errors?.[0]?.detail || 'Payment failed'
    redirect('/parent/payments?error=' + encodeURIComponent(errorMsg))
  }

  const squarePaymentId = squareResult.payment?.id

  // Record payment in our database
  const { error } = await supabase
    .from('payments')
    .insert({
      family_id: familyId,
      amount_cents: amountCents,
      payment_method: 'square',
      status: 'received',
      square_payment_id: squarePaymentId,
      invoice_id: invoiceId || null,
      description: description || null,
      category: 'Individual Lesson',
      received_at: new Date().toISOString(),
      recorded_by: user?.id,
    })

  if (error) {
    // Payment went through on Square but failed to record - log this
    console.error('Payment recorded on Square but failed to save:', error, { squarePaymentId })
    redirect('/parent/payments?error=' + encodeURIComponent('Payment processed but failed to record. Please contact admin. Ref: ' + squarePaymentId))
  }

  // Update family balance
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

  // Mark invoice as paid if linked
  if (invoiceId) {
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
  }

  revalidatePath('/parent/payments')
  revalidatePath('/parent')
  redirect('/parent/payments?success=Payment+processed+successfully')
}
