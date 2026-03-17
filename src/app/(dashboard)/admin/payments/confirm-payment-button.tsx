'use client'

import { confirmPayment } from './actions'

export function ConfirmPaymentButton({ paymentId }: { paymentId: string }) {
  return (
    <form action={confirmPayment.bind(null, paymentId)}>
      <button
        type="submit"
        className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
      >
        Confirm
      </button>
    </form>
  )
}
