'use client'

import { createInvoice } from '../actions'

export function CreateInvoiceForm({
  families,
}: {
  families: { id: string; display_id: string; family_name: string }[]
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Create Invoice</h2>
      <form action={createInvoice} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inv_family_id" className="block text-sm font-medium text-gray-700">
            Family *
          </label>
          <select
            id="inv_family_id"
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
          <label htmlFor="inv_amount_dollars" className="block text-sm font-medium text-gray-700">
            Amount ($) *
          </label>
          <input
            id="inv_amount_dollars"
            name="amount_dollars"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="170.00"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="inv_description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <input
            id="inv_description"
            name="description"
            type="text"
            required
            placeholder="e.g. Term 1 Red Ball Group - 10 sessions"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="inv_due_date" className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            id="inv_due_date"
            name="due_date"
            type="date"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  )
}
