'use client'

import { updateAttendance } from '../../actions'

export function AttendanceForm({
  sessionId,
  players,
  attendanceMap,
}: {
  sessionId: string
  players: { id: string; first_name: string; last_name: string }[]
  attendanceMap: Record<string, string>
}) {
  const updateWithSession = updateAttendance.bind(null, sessionId)

  return (
    <form action={updateWithSession} className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
      <p className="mt-1 text-sm text-gray-500">Mark attendance for each player on the roster.</p>

      <div className="mt-4 space-y-3">
        {players.map((player) => {
          const current = attendanceMap[player.id] ?? 'present'
          return (
            <div key={player.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
              <span className="text-sm font-medium text-gray-900">
                {player.first_name} {player.last_name}
              </span>
              <select
                name={`attendance_${player.id}`}
                defaultValue={current}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Save attendance
        </button>
      </div>
    </form>
  )
}
