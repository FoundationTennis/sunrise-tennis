'use client'

import { useEffect, useRef, useState } from 'react'
import { processSquarePayment } from '@/lib/square/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

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
  defaultAmountDollars,
  maxAmountDollars,
  description,
  invoiceId,
  editable = false,
}: {
  familyId: string
  defaultAmountDollars: string
  maxAmountDollars?: string
  description?: string
  invoiceId?: string
  editable?: boolean
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [amountDollars, setAmountDollars] = useState(defaultAmountDollars)
  const cardRef = useRef<SquareCard | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const sourceIdRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID

  useEffect(() => {
    mountedRef.current = true

    if (!appId) {
      setError('Square is not configured')
      setLoading(false)
      return
    }

    const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox'
    const sdkUrl = env === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'

    async function initSquare() {
      try {
        // Check if SDK is already loaded
        if (window.Square) {
          await attachCard()
          return
        }

        // Check if script tag already exists (e.g. from a previous render)
        const existingScript = document.querySelector(`script[src="${sdkUrl}"]`)
        if (existingScript) {
          // Wait for it to load
          if (window.Square) {
            await attachCard()
          } else {
            existingScript.addEventListener('load', async () => {
              if (mountedRef.current) await attachCard()
            })
            existingScript.addEventListener('error', () => {
              if (mountedRef.current) {
                setError('Failed to load Square SDK')
                setLoading(false)
              }
            })
          }
          return
        }

        // Load the SDK
        const script = document.createElement('script')
        script.src = sdkUrl
        script.async = true
        script.onload = async () => {
          if (mountedRef.current) await attachCard()
        }
        script.onerror = () => {
          if (mountedRef.current) {
            console.error('Square SDK failed to load from:', sdkUrl)
            setError('Failed to load Square SDK. Please check your connection and try again.')
            setLoading(false)
          }
        }
        document.body.appendChild(script)
      } catch (e) {
        console.error('Square init error:', e)
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to initialise payment form')
          setLoading(false)
        }
      }
    }

    async function attachCard() {
      try {
        if (!window.Square) throw new Error('Square SDK not available')

        const payments = locationId
          ? await window.Square.payments(appId!, locationId)
          : await window.Square.payments(appId!)

        const card = await payments.card()
        await card.attach('#square-card-container')
        cardRef.current = card
        if (mountedRef.current) setLoading(false)
      } catch (e) {
        console.error('Square card attach error:', e)
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to load payment form')
          setLoading(false)
        }
      }
    }

    initSquare()

    return () => {
      mountedRef.current = false
      cardRef.current?.destroy()
      cardRef.current = null
    }
  }, [appId, locationId])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    // Allow digits and one decimal point
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setAmountDollars(val)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cardRef.current || processing) return

    // Validate amount
    const cents = Math.round(parseFloat(amountDollars) * 100)
    if (isNaN(cents) || cents < 100) {
      setError('Minimum payment is $1.00')
      return
    }
    if (maxAmountDollars) {
      const maxCents = Math.round(parseFloat(maxAmountDollars) * 100)
      if (cents > maxCents) {
        setError(`Maximum payment is $${maxAmountDollars}`)
        return
      }
    }

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
      <div className="rounded-lg border border-warning/20 bg-warning-light p-4">
        <p className="text-sm text-warning">
          Card payments are not configured yet. Please pay via bank transfer or cash.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-foreground">Pay by Card</h3>

        {editable ? (
          <div className="mt-3">
            <label htmlFor="payment-amount" className="text-sm font-medium text-foreground">
              Amount
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input
                id="payment-amount"
                type="text"
                inputMode="decimal"
                value={amountDollars}
                onChange={handleAmountChange}
                className="block w-full rounded-lg border border-border bg-background py-2.5 pl-7 pr-3 text-sm text-foreground tabular-nums shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {maxAmountDollars && (
              <p className="mt-1 text-xs text-muted-foreground">
                Outstanding balance: ${maxAmountDollars}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Amount: <strong className="text-foreground">${amountDollars}</strong>
          </p>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-4">
          <div id="square-card-container" className="min-h-[50px]">
            {loading && <p className="text-sm text-muted-foreground/60">Loading payment form...</p>}
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

        <Button
          onClick={handleSubmit}
          disabled={loading || processing || !amountDollars || parseFloat(amountDollars) < 1}
          className="mt-4 w-full"
        >
          {processing ? 'Processing...' : `Pay $${amountDollars || '0.00'}`}
        </Button>
      </CardContent>
    </Card>
  )
}
