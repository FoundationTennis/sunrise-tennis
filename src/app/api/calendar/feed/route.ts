import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatTime } from '@/lib/utils/dates'

/**
 * Public iCal feed for a family's enrolled sessions.
 * Authenticated via a per-family calendar_token (UUID), not Supabase auth.
 * Calendar apps subscribe to this URL and refresh periodically.
 *
 * GET /api/calendar/feed?token=<uuid>
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return new NextResponse('Invalid token', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Look up family by calendar token
  const { data: family } = await supabase
    .from('families')
    .select('id, family_name')
    .eq('calendar_token', token)
    .single()

  if (!family) {
    return new NextResponse('Invalid token', { status: 401 })
  }

  // Get all players in this family
  const { data: players } = await supabase
    .from('players')
    .select('id, first_name')
    .eq('family_id', family.id)

  const playerIds = players?.map(p => p.id) ?? []
  const playerMap = new Map(players?.map(p => [p.id, p.first_name]) ?? [])

  if (playerIds.length === 0) {
    return icsResponse(family.family_name, [])
  }

  // Get enrolled programs
  const { data: enrollments } = await supabase
    .from('program_roster')
    .select('player_id, program_id, programs:program_id(id, name, type, level)')
    .eq('status', 'enrolled')
    .in('player_id', playerIds)

  const enrolledProgramIds = [...new Set(
    (enrollments ?? [])
      .map(e => (e.programs as unknown as { id: string } | null)?.id)
      .filter(Boolean),
  )] as string[]

  // Fetch upcoming sessions (next 90 days) for enrolled programs
  const today = new Date()
  const futureLimit = new Date()
  futureLimit.setDate(futureLimit.getDate() + 90)
  const todayStr = today.toISOString().split('T')[0]
  const futureStr = futureLimit.toISOString().split('T')[0]

  const { data: programSessions } = enrolledProgramIds.length > 0
    ? await supabase
        .from('sessions')
        .select('id, program_id, date, start_time, end_time, status, session_type, coaches:coach_id(name), venues:venue_id(name, address)')
        .in('program_id', enrolledProgramIds)
        .eq('status', 'scheduled')
        .gte('date', todayStr)
        .lte('date', futureStr)
        .order('date')
    : { data: [] }

  // Fetch private bookings
  const { data: privateBookings } = await supabase
    .from('bookings')
    .select('id, player_id, sessions:session_id(id, date, start_time, end_time, status, coaches:coach_id(name), venues:venue_id(name, address))')
    .eq('family_id', family.id)
    .eq('booking_type', 'private')
    .in('status', ['confirmed', 'pending'])

  // Build program lookup: programId -> { name, playerNames[] }
  const programInfo = new Map<string, { name: string; playerNames: string[] }>()
  for (const e of enrollments ?? []) {
    const prog = e.programs as unknown as { id: string; name: string } | null
    if (!prog) continue
    const existing = programInfo.get(prog.id)
    const playerName = playerMap.get(e.player_id) ?? ''
    if (existing) {
      if (!existing.playerNames.includes(playerName)) existing.playerNames.push(playerName)
    } else {
      programInfo.set(prog.id, { name: prog.name, playerNames: [playerName] })
    }
  }

  // Build iCal events
  const events: ICalEvent[] = []

  // Group program sessions
  for (const session of programSessions ?? []) {
    const info = session.program_id ? programInfo.get(session.program_id) : null
    const coach = (session.coaches as unknown as { name: string } | null)?.name
    const venue = session.venues as unknown as { name: string; address: string | null } | null

    events.push({
      uid: `session-${session.id}@sunrise-tennis`,
      date: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      summary: info?.name ?? 'Tennis Session',
      description: [
        info?.playerNames?.length ? `Players: ${info.playerNames.join(', ')}` : null,
        coach ? `Coach: ${coach}` : null,
      ].filter(Boolean).join('\n'),
      location: venue ? [venue.name, venue.address].filter(Boolean).join(', ') : undefined,
    })
  }

  // Private bookings
  for (const booking of privateBookings ?? []) {
    const session = booking.sessions as unknown as {
      id: string; date: string; start_time: string | null; end_time: string | null;
      status: string; coaches: { name: string } | null; venues: { name: string; address: string | null } | null
    } | null
    if (!session || session.status !== 'scheduled') continue

    const playerName = playerMap.get(booking.player_id) ?? ''
    const coachName = session.coaches?.name ?? 'Coach'
    const venue = session.venues

    events.push({
      uid: `booking-${booking.id}@sunrise-tennis`,
      date: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      summary: `Private Lesson — ${playerName} w/ ${coachName.split(' ')[0]}`,
      description: [
        `Player: ${playerName}`,
        `Coach: ${coachName}`,
      ].join('\n'),
      location: venue ? [venue.name, venue.address].filter(Boolean).join(', ') : undefined,
    })
  }

  return icsResponse(family.family_name, events)
}

// ── iCal generation helpers ──────────────────────────────────────────────────

interface ICalEvent {
  uid: string
  date: string
  startTime: string | null
  endTime: string | null
  summary: string
  description?: string
  location?: string
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toIcalDate(dateStr: string, timeStr: string | null): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM or HH:MM:SS
  const d = dateStr.replace(/-/g, '')
  if (!timeStr) return d // all-day
  const t = timeStr.replace(/:/g, '').slice(0, 6).padEnd(6, '0')
  return `${d}T${t}`
}

function icsResponse(familyName: string, events: ICalEvent[]): NextResponse {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sunrise Tennis//Calendar Feed//EN',
    `X-WR-CALNAME:Sunrise Tennis — ${escapeIcal(familyName)}`,
    'X-WR-TIMEZONE:Australia/Adelaide',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // Adelaide timezone definition
    'BEGIN:VTIMEZONE',
    'TZID:Australia/Adelaide',
    'BEGIN:STANDARD',
    'DTSTART:19700405T030000',
    'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=4',
    'TZOFFSETFROM:+1030',
    'TZOFFSETTO:+0930',
    'TZNAME:ACST',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19701004T020000',
    'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=10',
    'TZOFFSETFROM:+0930',
    'TZOFFSETTO:+1030',
    'TZNAME:ACDT',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.uid}`)
    lines.push(`DTSTAMP:${stamp}`)

    if (event.startTime) {
      lines.push(`DTSTART;TZID=Australia/Adelaide:${toIcalDate(event.date, event.startTime)}`)
      if (event.endTime) {
        lines.push(`DTEND;TZID=Australia/Adelaide:${toIcalDate(event.date, event.endTime)}`)
      }
    } else {
      // All-day event
      lines.push(`DTSTART;VALUE=DATE:${toIcalDate(event.date, null)}`)
    }

    lines.push(`SUMMARY:${escapeIcal(event.summary)}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcal(event.description)}`)
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcal(event.location)}`)
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const body = lines.join('\r\n')

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="sunrise-tennis.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
