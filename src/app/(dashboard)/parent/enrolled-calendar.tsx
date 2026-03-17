'use client'

import { WeeklyCalendar, type CalendarEvent } from '@/components/weekly-calendar'

const LEVEL_COLORS: Record<string, string> = {
  red: 'bg-ball-red/20 border-ball-red/30',
  orange: 'bg-ball-orange/20 border-ball-orange/30',
  green: 'bg-ball-green/20 border-ball-green/30',
  yellow: 'bg-ball-yellow/20 border-ball-yellow/30',
  competitive: 'bg-primary/15 border-primary/30',
}

type Enrollment = {
  id: string
  playerName: string
  programId: string
  programName: string
  programType: string
  programLevel: string | null
  dayOfWeek: number | null
  startTime: string | null
  endTime: string | null
}

export function EnrolledCalendar({ enrollments }: { enrollments: Enrollment[] }) {
  const events: CalendarEvent[] = enrollments
    .filter(e => e.dayOfWeek != null && e.startTime && e.endTime)
    .map(e => ({
      id: e.id,
      title: e.programName,
      subtitle: e.playerName,
      dayOfWeek: e.dayOfWeek!,
      startTime: e.startTime!,
      endTime: e.endTime!,
      color: LEVEL_COLORS[e.programLevel ?? ''] ?? 'bg-primary/15 border-primary/30',
      href: `/parent/programs/${e.programId}`,
    }))

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No scheduled sessions to display.
      </p>
    )
  }

  return <WeeklyCalendar events={events} />
}
