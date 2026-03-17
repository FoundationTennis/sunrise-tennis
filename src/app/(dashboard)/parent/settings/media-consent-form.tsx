'use client'

import { updateMediaConsent } from '../actions'

export function MediaConsentForm({
  playerId,
  playerName,
  currentConsent,
}: {
  playerId: string
  playerName: string
  currentConsent: boolean
}) {
  const updateWithId = updateMediaConsent.bind(null, playerId)

  return (
    <form action={updateWithId} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{playerName}</p>
        <p className="text-xs text-gray-500">
          {currentConsent ? 'Consent given' : 'No consent'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="media_consent"
            defaultChecked={currentConsent}
            className="peer sr-only"
            onChange={(e) => e.target.form?.requestSubmit()}
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-orange-300"></div>
        </label>
      </div>
    </form>
  )
}
