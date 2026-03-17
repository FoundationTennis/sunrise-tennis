'use client'

import { useSearchParams } from 'next/navigation'
import { createInvitation } from '../../../admin/actions'

export function InviteParentForm({ familyId, siteUrl }: { familyId: string; siteUrl: string }) {
  const searchParams = useSearchParams()
  const invitedToken = searchParams.get('invited')
  const inviteLink = invitedToken ? `${siteUrl}/signup?invite=${invitedToken}` : null

  const createWithFamily = createInvitation.bind(null, familyId)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Invite Parent</h2>
      <p className="mt-1 text-sm text-gray-500">
        Send a signup link that automatically links this parent to this family account.
      </p>

      {inviteLink && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Invite created! Share this link:</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="block w-full rounded-md border border-green-300 bg-white px-3 py-2 text-sm text-gray-900"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="shrink-0 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-green-600">Link expires in 7 days.</p>
        </div>
      )}

      <form action={createWithFamily} className="mt-4 flex gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="parent@email.com"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Create invite
        </button>
      </form>
    </div>
  )
}
