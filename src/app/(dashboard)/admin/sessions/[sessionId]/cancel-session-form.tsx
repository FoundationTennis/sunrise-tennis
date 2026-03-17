'use client'

import { cancelSession } from '../../actions'

export function CancelSessionForm({ sessionId }: { sessionId: string }) {
  const cancelWithId = cancelSession.bind(null, sessionId)

  return (
    <details className="rounded-lg border border-red-200 bg-white">
      <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-red-600">
        Cancel this session
      </summary>
      <form action={cancelWithId} className="space-y-4 px-6 pb-6">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Cancellation reason
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={2}
            placeholder="e.g. Rain, coach unavailable..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Confirm cancellation
        </button>
      </form>
    </details>
  )
}
