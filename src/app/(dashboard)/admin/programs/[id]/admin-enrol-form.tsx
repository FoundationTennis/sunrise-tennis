'use client'

import { adminBookPlayer } from '../../actions'

const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500'

export function AdminEnrolForm({
  programId,
  families,
}: {
  programId: string
  families: { id: string; displayId: string; familyName: string; players: { id: string; firstName: string; lastName: string }[] }[]
}) {
  return (
    <details className="rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-orange-600 hover:text-orange-500">
        + Enrol player on behalf of family
      </summary>
      <form action={adminBookPlayer} className="space-y-4 px-6 pb-6">
        <input type="hidden" name="program_id" value={programId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="family_player" className="block text-sm font-medium text-gray-700">Family / Player</label>
            <select id="family_player" name="family_player" required className={inputClass} onChange={(e) => {
              const [fam, play] = e.target.value.split('|')
              const form = e.target.form!
              ;(form.querySelector('[name=family_id]') as HTMLInputElement).value = fam
              ;(form.querySelector('[name=player_id]') as HTMLInputElement).value = play
            }}>
              <option value="">Select a player...</option>
              {families.map((f) => (
                <optgroup key={f.id} label={`${f.displayId} - ${f.familyName}`}>
                  {f.players.map((p) => (
                    <option key={p.id} value={`${f.id}|${p.id}`}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input type="hidden" name="family_id" value="" />
            <input type="hidden" name="player_id" value="" />
          </div>
          <div>
            <label htmlFor="booking_type" className="block text-sm font-medium text-gray-700">Booking type</label>
            <select id="booking_type" name="booking_type" required className={inputClass}>
              <option value="term">Term enrolment</option>
              <option value="trial">Trial</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <input id="notes" name="notes" type="text" className={inputClass} placeholder="Optional" />
          </div>
        </div>
        <button type="submit" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          Enrol player
        </button>
      </form>
    </details>
  )
}
