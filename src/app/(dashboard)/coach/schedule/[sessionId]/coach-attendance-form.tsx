'use client'

import { coachUpdateAttendance } from '../../actions'

type Player = { id: string; first_name: string; last_name: string; ball_color: string | null }

export function CoachAttendanceForm({
  sessionId,
  roster,
  attendanceMap,
}: {
  sessionId: string
  roster: Player[]
  attendanceMap: Record<string, string>
}) {
  const action = coachUpdateAttendance.bind(null, sessionId)

  return (
    <form action={action} className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-2">
        {roster.map((player) => (
          <div key={player.id} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
            <span className="text-sm text-gray-900">
              {player.first_name} {player.last_name}
              {player.ball_color && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 capitalize">
                  {player.ball_color}
                </span>
              )}
            </span>
            <select
              name={`attendance_${player.id}`}
              defaultValue={attendanceMap[player.id] ?? 'present'}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="mt-4 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Save Attendance
      </button>
    </form>
  )
}
