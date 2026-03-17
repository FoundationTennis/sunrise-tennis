'use client'

import { enrolInProgram } from '../actions'

export function EnrolForm({
  programId,
  familyId,
  players,
  programLevel,
}: {
  programId: string
  familyId: string
  players: { id: string; name: string; level: string | null }[]
  programLevel: string
}) {
  const enrolWithIds = enrolInProgram.bind(null, programId, familyId)

  return (
    <form action={enrolWithIds} className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Enrol a Player</h2>

      <div className="mt-4">
        <label htmlFor="player_id" className="block text-sm font-medium text-gray-700">
          Select player
        </label>
        <select
          id="player_id"
          name="player_id"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Choose a player...</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
              {player.level && player.level !== programLevel && ` (${player.level} ball)`}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="booking_type" className="block text-sm font-medium text-gray-700">
          Booking type
        </label>
        <select
          id="booking_type"
          name="booking_type"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="term">Term enrolment</option>
          <option value="trial">Trial session</option>
          <option value="casual">Casual (single session)</option>
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Any special requirements or comments..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div className="mt-4">
        <button
          type="submit"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Confirm Enrolment
        </button>
      </div>
    </form>
  )
}
