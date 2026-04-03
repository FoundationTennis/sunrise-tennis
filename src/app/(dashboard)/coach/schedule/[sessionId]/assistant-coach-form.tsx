'use client'

import { markCoachAttendance } from '../../actions'
import { Button } from '@/components/ui/button'

export function AssistantCoachForm({
  sessionId,
  coaches,
  attendanceMap,
}: {
  sessionId: string
  coaches: { id: string; name: string }[]
  attendanceMap: Record<string, string>
}) {
  const markWithSession = markCoachAttendance.bind(null, sessionId)

  return (
    <form action={markWithSession}>
      <h3 className="text-sm font-semibold text-foreground mb-2">Assistant Coaches</h3>
      <div className="space-y-2">
        {coaches.map((coach) => {
          const current = attendanceMap[coach.id] ?? 'present'
          return (
            <div key={coach.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{coach.name}</span>
              <div className="flex gap-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`coach_attendance_${coach.id}`}
                    value="present"
                    defaultChecked={current === 'present'}
                    className="text-success"
                  />
                  <span className="text-xs text-success font-medium">Present</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                  <input
                    type="radio"
                    name={`coach_attendance_${coach.id}`}
                    value="absent"
                    defaultChecked={current === 'absent'}
                    className="text-danger"
                  />
                  <span className="text-xs text-danger font-medium">Absent</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm">Save coach attendance</Button>
      </div>
    </form>
  )
}
