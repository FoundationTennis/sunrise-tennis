'use client'

import { recordPayment } from './actions'

const PAYMENT_METHODS = ['square', 'bank_transfer', 'cash']
const INCOME_CATEGORIES = [
  'Individual Lesson',
  'Group Session',
  'Program',
  'Court Hire Pass-Through',
  'Sports Voucher Redemption',
  'Clinic',
  'Other',
]

export function RecordPaymentForm({
  families,
}: {
  families: { id: string; display_id: string; family_name: string }[]
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
      <form action={recordPayment} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="family_id" className="block text-sm font-medium text-gray-700">
            Family *
          </label>
          <select
            id="family_id"
            name="family_id"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Select family...</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.display_id} ({f.family_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount_dollars" className="block text-sm font-medium text-gray-700">
            Amount ($) *
          </label>
          <input
            id="amount_dollars"
            name="amount_dollars"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="85.00"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
            Payment Method *
          </label>
          <select
            id="payment_method"
            name="payment_method"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Select category...</option>
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="received">Received</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="e.g. Term 1 group sessions"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Record Payment
          </button>
        </div>
      </form>
    </div>
  )
}
