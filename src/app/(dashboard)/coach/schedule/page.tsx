import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { getCurrentTermRange } from '@/lib/utils/school-terms'
import { CoachCalendar } from './coach-calendar'

export default async function CoachSchedulePage() {
  const supabase = await createClient()

  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const coachId = coach?.id
  if (!coachId) {
    return (
      <div>
        <PageHeader title="Schedule" />
        <p className="mt-4 text-sm text-muted-foreground">Coach profile not linked.</p>
      </div>
    )
  }

  // Get date range — current term or next term
  const { start: termStart, end: termEnd } = getCurrentTermRange(new Date())

  // Fetch sessions where coach is primary (direct assignment)
  const { data: primarySessions } = await supabase
    .from('sessions')
    .select('id, program_id, coach_id, date, start_time, end_time, status, session_type, coaches:coach_id(name), programs:program_id(name, level, type), venues:venue_id(name)')
    .eq('coach_id', coachId)
    .gte('date', termStart)
    .lte('date', termEnd)
    .order('date')
    .order('start_time')

  // Fetch programs where coach is assigned (primary or assistant)
  const { data: coachPrograms } = await supabase
    .from('program_coaches')
    .select('program_id, role')
    .eq('coach_id', coachId)

  const assistantProgramIds = (coachPrograms ?? [])
    .filter(cp => cp.role === 'assistant')
    .map(cp => cp.program_id)

  const primaryProgramIds = new Set((coachPrograms ?? [])
    .filter(cp => cp.role === 'primary')
    .map(cp => cp.program_id))

  // Fetch sessions for assistant programs (that aren't already in primary sessions)
  let assistantSessions: typeof primarySessions = []
  if (assistantProgramIds.length > 0) {
    const { data } = await supabase
      .from('sessions')
      .select('id, program_id, coach_id, date, start_time, end_time, status, session_type, coaches:coach_id(name), programs:program_id(name, level, type), venues:venue_id(name)')
      .in('program_id', assistantProgramIds)
      .gte('date', termStart)
      .lte('date', termEnd)
      .order('date')
      .order('start_time')
    assistantSessions = data ?? []
  }

  // Merge and deduplicate sessions
  const primaryIds = new Set((primarySessions ?? []).map(s => s.id))
  const allSessions = [
    ...(primarySessions ?? []),
    ...(assistantSessions ?? []).filter(s => !primaryIds.has(s.id)),
  ]

  // Get attendance counts per session
  const sessionIds = allSessions.map(s => s.id)
  let attendanceCounts: Record<string, number> = {}
  if (sessionIds.length > 0) {
    const { data: counts } = await supabase
      .from('attendances')
      .select('session_id')
      .in('session_id', sessionIds)
    if (counts) {
      for (const row of counts) {
        attendanceCounts[row.session_id] = (attendanceCounts[row.session_id] ?? 0) + 1
      }
    }
  }

  // Get program roster counts
  const programIds = [...new Set(allSessions.map(s => s.program_id).filter((id): id is string => id != null))]
  let rosterCounts: Record<string, number> = {}
  if (programIds.length > 0) {
    const { data: roster } = await supabase
      .from('program_roster')
      .select('program_id')
      .in('program_id', programIds)
      .eq('status', 'enrolled')
    if (roster) {
      for (const row of roster) {
        rosterCounts[row.program_id] = (rosterCounts[row.program_id] ?? 0) + 1
      }
    }
  }

  const LEVEL_COLORS: Record<string, string> = {
    red: 'bg-ball-red/20 border-ball-red/30',
    orange: 'bg-ball-orange/20 border-ball-orange/30',
    green: 'bg-ball-green/20 border-ball-green/30',
    yellow: 'bg-ball-yellow/20 border-ball-yellow/30',
    competitive: 'bg-primary/15 border-primary/30',
  }

  // Serialize sessions for client component
  const calendarSessions = allSessions.map(s => {
    const program = s.programs as unknown as { name: string; level: string; type: string } | null
    const venue = s.venues as unknown as { name: string } | null
    const isLead = s.coach_id === coachId || (s.program_id ? primaryProgramIds.has(s.program_id) : false)
    const eventDate = new Date(s.date + 'T12:00:00')

    return {
      id: s.id,
      title: program?.name ?? s.session_type,
      subtitle: venue?.name ?? '',
      dayOfWeek: eventDate.getDay(),
      startTime: s.start_time ?? '09:00',
      endTime: s.end_time ?? '10:00',
      color: LEVEL_COLORS[program?.level ?? ''] ?? (s.session_type === 'private' ? 'bg-purple-100 border-purple-300' : 'bg-primary/15 border-primary/30'),
      date: s.date,
      sessionId: s.id,
      programId: s.program_id ?? undefined,
      sessionStatus: s.status,
      coachName: isLead ? 'Lead' : 'Assistant',
      bookedCount: attendanceCounts[s.id] ?? rosterCounts[s.program_id ?? ''] ?? 0,
    }
  })

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Your sessions this term."
      />
      <div className="mt-6">
        <CoachCalendar sessions={calendarSessions} />
      </div>
    </div>
  )
}
