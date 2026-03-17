'use client'

import { createLessonNote } from '../../actions'

type Player = { id: string; first_name: string; last_name: string; ball_color: string | null }

export function LessonNoteForm({
  sessionId,
  roster,
}: {
  sessionId: string
  roster: Player[]
}) {
  const action = createLessonNote.bind(null, sessionId)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Add Lesson Note</h2>
      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="player_id" className="block text-sm font-medium text-gray-700">
            Player *
          </label>
          <select
            id="player_id"
            name="player_id"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Select player...</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="focus" className="block text-sm font-medium text-gray-700">
            Focus Area
          </label>
          <input
            id="focus"
            name="focus"
            type="text"
            placeholder="e.g. Forehand topspin, serve consistency"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
            Progress
          </label>
          <input
            id="progress"
            name="progress"
            type="text"
            placeholder="e.g. Good improvement on follow-through"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="drills_used" className="block text-sm font-medium text-gray-700">
            Drills Used (comma separated)
          </label>
          <input
            id="drills_used"
            name="drills_used"
            type="text"
            placeholder="e.g. Rally 10, Target serve, Cross-court"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">
            Video Link
          </label>
          <input
            id="video_url"
            name="video_url"
            type="url"
            placeholder="https://youtube.com/..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="next_plan" className="block text-sm font-medium text-gray-700">
            Next Session Plan
          </label>
          <input
            id="next_plan"
            name="next_plan"
            type="text"
            placeholder="e.g. Work on backhand slice"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Save Lesson Note
          </button>
        </div>
      </form>
    </div>
  )
}
