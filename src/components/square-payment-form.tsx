'use client'

import { useEffect, useRef, useState } from 'react'
import { processSquarePayment } from '@/lib/square/payment'

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId?: string) => Promise<SquarePayments>
    }
  }
}

interface SquarePayments {
  card: () => Promise<SquareCard>
}

interface SquareCard {
  attach: (containerId: string) => Promise<void>
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>
  destroy: () => void
}

export function SquarePaymentForm({
  familyId,
  amountDollars,
  description,
  invoiceId,
}: {
  familyId: string
  amountDollars: string
  description?: string
  invoiceId?: string
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const cardRef = useRef<SquareCard | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const sourceIdRef = useRef<HTMLInputElement>(null)

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID

  useEffect(() => {
    if (!appId) {
      setError('Square is not configured')
      setLoading(false)
      return
    }

    // Load Square Web Payments SDK
    const script = document.createElement('script')
    const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox'
    script.src = env === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'
    script.async = true
    script.onload = async () => {
      try {
        if (!window.Square) throw new Error('Square SDK failed to load')
        const payments = await window.Square.payments(appId)
        const card = await payments.card()
        await card.attach('#square-card-container')
        cardRef.current = card
        setLoading(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load payment form')
        setLoading(false)
      }
    }
    script.onerror = () => {
      setError('Failed to load Square SDK')
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      cardRef.current?.destroy()
      document.body.removeChild(script)
    }
  }, [appId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cardRef.current || processing) return

    setProcessing(true)
    setError(null)

    try {
      const result = await cardRef.current.tokenize()
      if (result.status === 'OK' && result.token) {
        // Set the source_id in the hidden form field and submit
        if (sourceIdRef.current) {
          sourceIdRef.current.value = result.token
        }
        formRef.current?.requestSubmit()
      } else {
        setError(result.errors?.[0]?.message || 'Card tokenisation failed')
        setProcessing(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed')
      setProcessing(false)
    }
  }

  if (!appId) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Card payments are not configured yet. Please pay via bank transfer or cash.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">Pay by Card</h3>
      <p className="mt-1 text-sm text-gray-600">
        Amount: <strong>${amountDollars}</strong>
      </p>

      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4">
        <div id="square-card-container" className="min-h-[50px]">
          {loading && <p className="text-sm text-gray-400">Loading payment form...</p>}
        </div>
      </div>

      {/* Hidden form that submits to the server action */}
      <form ref={formRef} action={processSquarePayment} className="hidden">
        <input type="hidden" name="source_id" ref={sourceIdRef} />
        <input type="hidden" name="family_id" value={familyId} />
        <input type="hidden" name="amount_dollars" value={amountDollars} />
        {description && <input type="hidden" name="description" value={description} />}
        {invoiceId && <input type="hidden" name="invoice_id" value={invoiceId} />}
      </form>

      <button
        onClick={handleSubmit}
        disabled={loading || processing}
        className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay $${amountDollars}`}
      </button>
    </div>
  )
}
