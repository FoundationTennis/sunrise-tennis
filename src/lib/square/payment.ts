'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateFormData } from '@/lib/utils/validation'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { recalculateBalance } from '@/lib/utils/billing'
import { sendPushToUser } from '@/lib/push/send'

const squarePaymentFormSchema = z.object({
  source_id: z.string().min(1, 'Payment token is required'),
  family_id: z.string().uuid('Invalid family'),
  amount_dollars: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valid amount is required'),
  description: z.string().max(500).optional().or(z.literal('')),
  invoice_id: z.string().uuid().optional().or(z.literal('')),
})

/**
 * Process a Square card payment.
 * Called after the client-side Square Web Payments SDK tokenises the card.
 * The sourceId (nonce) is the only card-related data we ever touch.
 */
export async function processSquarePayment(formData: FormData) {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const parsed = validateFormData(formData, squarePaymentFormSchema)
  if (!parsed.success) {
    redirect('/parent/payments?error=' + encodeURIComponent(parsed.error))
  }

  const { source_id: sourceId, family_id: familyId, amount_dollars: amountDollars, description, invoice_id: invoiceId } = parsed.data

  // Verify the authenticated user owns this family before charging
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!userRole || userRole.family_id !== familyId) {
    redirect('/parent/payments?error=' + encodeURIComponent('Unauthorized'))
  }

  // Rate limit: 3 payment attempts per minute per user
  if (!checkRateLimit(`payment:${user.id}`, 3, 60_000)) {
    redirect('/parent/payments?error=' + encodeURIComponent('Too many payment attempts. Please wait a minute.'))
  }

  const amountCents = Math.round(parseFloat(amountDollars) * 100)
  if (amountCents < 100) {
    redirect('/parent/payments?error=' + encodeURIComponent('Minimum payment is $1.00'))
  }

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
      category: null,
      received_at: new Date().toISOString(),
      recorded_by: user.id,
    })

  if (error) {
    // Payment went through on Square but failed to record - log reference only
    console.error('Payment recorded on Square but failed to save. Ref:', squarePaymentId)
    redirect('/parent/payments?error=' + encodeURIComponent('Payment processed but failed to record. Please contact admin. Ref: ' + squarePaymentId))
  }

  // Recalculate family balance (single source of truth — no manual math)
  await recalculateBalance(supabase, familyId)

  // Mark invoice as paid if linked
  if (invoiceId) {
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
  }

  // Send payment receipt notification
  try {
    await sendPushToUser(user.id, {
      title: 'Payment Received',
      body: `Payment of $${amountDollars} has been processed successfully.`,
      url: '/parent/payments',
    })
  } catch (e) {
    console.error('Payment notification failed:', e instanceof Error ? e.message : 'Unknown')
  }

  revalidatePath('/parent/payments')
  revalidatePath('/parent')
  redirect('/parent/payments?success=Payment+processed+successfully')
}
