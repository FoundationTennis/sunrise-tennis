'use client'

import { createSession } from '../actions'

const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500'

export function CreateSessionForm({
  programs,
  coaches,
  venues,
}: {
  programs: { id: string; name: string }[]
  coaches: { id: string; name: string }[]
  venues: { id: string; name: string }[]
}) {
  return (
    <details className="rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-gray-900">
        + Create Session
      </summary>
      <form action={createSession} className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="program_id" className="block text-sm font-medium text-gray-700">Program</label>
            <select id="program_id" name="program_id" className={inputClass}>
              <option value="">No program (ad-hoc)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="session_type" className="block text-sm font-medium text-gray-700">Type *</label>
            <select id="session_type" name="session_type" required className={inputClass}>
              <option value="group">Group</option>
              <option value="private">Private</option>
              <option value="squad">Squad</option>
              <option value="school">School</option>
              <option value="trial">Trial</option>
              <option value="competition">Competition</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date *</label>
            <input id="date" name="date" type="date" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="coach_id" className="block text-sm font-medium text-gray-700">Coach</label>
            <select id="coach_id" name="coach_id" className={inputClass}>
              <option value="">Unassigned</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Start time</label>
            <input id="start_time" name="start_time" type="time" className={inputClass} />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">End time</label>
            <input id="end_time" name="end_time" type="time" className={inputClass} />
          </div>
          <div>
            <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700">Venue</label>
            <select id="venue_id" name="venue_id" className={inputClass}>
              <option value="">No venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          Create session
        </button>
      </form>
    </details>
  )
}
