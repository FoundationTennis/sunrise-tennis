'use client'

import { useState } from 'react'
import { SquarePaymentForm } from '@/components/square-payment-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Building2, Copy, Check } from 'lucide-react'

export function PaymentOptions({
  familyId,
  outstandingInvoices,
}: {
  familyId: string
  outstandingInvoices: { id: string; display_id: string; amount_cents: number }[]
}) {
  const [method, setMethod] = useState<'choose' | 'card' | 'bank'>('choose')
  const [selectedInvoice, setSelectedInvoice] = useState<string>(
    outstandingInvoices.length === 1 ? outstandingInvoices[0].id : ''
  )
  const [copied, setCopied] = useState<string | null>(null)

  const invoice = outstandingInvoices.find((i) => i.id === selectedInvoice)
  const amountDollars = invoice ? (invoice.amount_cents / 100).toFixed(2) : ''

  const bankBsb = process.env.NEXT_PUBLIC_BANK_BSB || ''
  const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || ''
  const bankName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'Sunrise Tennis'

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  if (method === 'choose') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground">Make a Payment</h2>

        {outstandingInvoices.length > 1 && (
          <div className="mt-3">
            <label className="text-sm font-medium text-foreground">Select invoice</label>
            <select
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose an invoice...</option>
              {outstandingInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.display_id} - ${(inv.amount_cents / 100).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMethod('card')}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Pay by Card</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard, AMEX via Square</p>
            </div>
          </button>
          <button
            onClick={() => setMethod('bank')}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">Direct deposit to our account</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (method === 'card') {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pay by Card</h2>
          <Button variant="ghost" size="sm" onClick={() => setMethod('choose')}>
            Back
          </Button>
        </div>
        <div className="mt-4">
          {selectedInvoice && invoice ? (
            <SquarePaymentForm
              familyId={familyId}
              amountDollars={amountDollars}
              description={`Payment for ${invoice.display_id}`}
              invoiceId={invoice.id}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Please select an invoice first.</p>
          )}
        </div>
      </div>
    )
  }

  // Bank transfer
  const referenceText = invoice ? invoice.display_id : 'Your family name'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Bank Transfer</h2>
        <Button variant="ghost" size="sm" onClick={() => setMethod('choose')}>
          Back
        </Button>
      </div>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Transfer the amount to our bank account using the details below.
            Your payment will be confirmed once we receive it (usually 1-2 business days).
          </p>

          <dl className="mt-4 space-y-3">
            {bankName && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Account Name</dt>
                  <dd className="text-sm font-medium text-foreground">{bankName}</dd>
                </div>
                <button
                  onClick={() => copyToClipboard(bankName, 'name')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === 'name' ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                </button>
              </div>
            )}
            {bankBsb && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">BSB</dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">{bankBsb}</dd>
                </div>
                <button
                  onClick={() => copyToClipboard(bankBsb, 'bsb')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === 'bsb' ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                </button>
              </div>
            )}
            {bankAccount && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Account Number</dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">{bankAccount}</dd>
                </div>
                <button
                  onClick={() => copyToClipboard(bankAccount, 'account')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === 'account' ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                </button>
              </div>
            )}
            {(!bankBsb || !bankAccount) && (
              <div className="rounded-lg border border-warning/20 bg-warning-light px-4 py-3">
                <p className="text-sm text-warning">
                  Bank details are not configured yet. Please contact us directly for payment.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 px-4 py-2.5">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Reference / Description</dt>
                <dd className="text-sm font-medium text-primary">{referenceText}</dd>
              </div>
              <button
                onClick={() => copyToClipboard(referenceText, 'ref')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === 'ref' ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </button>
            </div>
          </dl>

          {invoice && (
            <p className="mt-4 text-sm font-medium text-foreground">
              Amount to transfer: <span className="tabular-nums">${amountDollars}</span>
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Please include the reference so we can match your payment. Once received, it will appear in your payment history.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
