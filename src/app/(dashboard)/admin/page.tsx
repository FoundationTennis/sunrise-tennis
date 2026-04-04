import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { calculateGroupCoachPay } from '@/lib/utils/billing'
import { getCurrentTermRange, getCurrentOrNextTermEnd } from '@/lib/utils/school-terms'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, UserCheck, GraduationCap, DollarSign } from 'lucide-react'
import { OverviewCalendar } from './overview-calendar'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { start: termStart, end: termEnd } = getCurrentTermRange(new Date())
  const nextTermEnd = getCurrentOrNextTermEnd(new Date())
  const sessionEndDate = nextTermEnd ? nextTermEnd.toISOString().split('T')[0] : new Date().getFullYear() + '-12-31'

  const [
    { count: familyCount },
    { count: playerCount },
    { count: programCount },
    { data: balances },
    { data: coaches },
    { data: completedSessions },
    { data: coachEarnings },
    { data: allProgramCoaches },
    { data: calendarSessions },
    { data: programs },
    { data: programCoaches },
  ] = await Promise.all([
    supabase.from('families').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('family_balance').select('balance_cents, family_id, families(display_id, family_name)')
      .neq('balance_cents', 0)
      .order('balance_cents', { ascending: true }),
    supabase.from('coaches').select('id, name, hourly_rate').eq('status', 'active'),
    supabase.from('sessions')
      .select('id, program_id, coach_id, start_time, end_time, status')
      .eq('status', 'completed')
      .gte('date', termStart)
      .lte('date', termEnd),
    supabase.from('coach_earnings')
      .select('coach_id, amount_cents, status')
      .in('status', ['owed', 'paid']),
    supabase.from('program_coaches')
      .select('program_id, coach_id, role'),
    // Calendar sessions — scheduled + completed only (no cancelled)
    supabase.from('sessions')
      .select('id, program_id, date, start_time, end_time, status, session_type, coach_id, coaches:coach_id(name), venues:venue_id(name)')
      .in('status', ['scheduled', 'completed'])
      .gte('date', termStart)
      .lte('date', sessionEndDate)
      .order('date')
      .order('start_time'),
    // Programs for calendar event mapping
    supabase.from('programs')
      .select('id, name, level, max_capacity, program_roster(count)'),
    // Program coaches for calendar
    supabase.from('program_coaches')
      .select('program_id, coach_id, role, coaches:coach_id(name)'),
  ])

  const totalOutstanding = balances?.reduce((sum, b) => {
    return b.balance_cents < 0 ? sum + b.balance_cents : sum
  }, 0) ?? 0

  // ── Coach Pay Calculation ──
  type CoachPaySummary = { name: string; groupPay: number; privatePay: number }
  const coachPayMap = new Map<string, CoachPaySummary>()

  for (const c of coaches ?? []) {
    coachPayMap.set(c.id, { name: c.name, groupPay: 0, privatePay: 0 })
  }

  for (const s of completedSessions ?? []) {
    let durationMin = 60
    if (s.start_time && s.end_time) {
      const [sh, sm] = s.start_time.split(':').map(Number)
      const [eh, em] = s.end_time.split(':').map(Number)
      durationMin = (eh * 60 + em) - (sh * 60 + sm)
    }

    const sessionCoaches = (allProgramCoaches ?? []).filter(pc => pc.program_id === s.program_id)

    for (const pc of sessionCoaches) {
      const coach = (coaches ?? []).find(c => c.id === pc.coach_id)
      if (!coach) continue
      const rate = (coach.hourly_rate as { group_rate_cents?: number } | null)?.group_rate_cents
      if (rate) {
        const pay = calculateGroupCoachPay(rate, durationMin)
        const entry = coachPayMap.get(coach.id)
        if (entry) entry.groupPay += pay
      }
    }

    if (s.coach_id && !sessionCoaches.some(pc => pc.coach_id === s.coach_id)) {
      const coach = (coaches ?? []).find(c => c.id === s.coach_id)
      if (coach) {
        const rate = (coach.hourly_rate as { group_rate_cents?: number } | null)?.group_rate_cents
        if (rate) {
          const pay = calculateGroupCoachPay(rate, durationMin)
          const entry = coachPayMap.get(coach.id)
          if (entry) entry.groupPay += pay
        }
      }
    }
  }

  for (const e of coachEarnings ?? []) {
    const entry = coachPayMap.get(e.coach_id)
    if (entry) entry.privatePay += e.amount_cents
  }

  const coachPayRows = [...coachPayMap.values()]
    .filter(r => r.groupPay > 0 || r.privatePay > 0)
    .sort((a, b) => (b.groupPay + b.privatePay) - (a.groupPay + a.privatePay))

  // ── Calendar Session Serialization ──
  const coachMap: Record<string, { lead: string; assistants: string[] }> = {}
  for (const pc of programCoaches ?? []) {
    const coachName = (pc.coaches as unknown as { name: string } | null)?.name ?? 'Unknown'
    if (!coachMap[pc.program_id]) {
      coachMap[pc.program_id] = { lead: '', assistants: [] }
    }
    if (pc.role === 'primary') {
      coachMap[pc.program_id].lead = coachName
    } else {
      coachMap[pc.program_id].assistants.push(coachName)
    }
  }

  // Count booked players per session
  const sessionIds = (calendarSessions ?? []).map(s => s.id)
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

  const serializedSessions = (calendarSessions ?? []).map(s => {
    const coach = s.coaches as unknown as { name: string } | null
    const venue = s.venues as unknown as { name: string } | null
    const programCoachInfo = s.program_id ? coachMap[s.program_id] : null
    return {
      id: s.id,
      programId: s.program_id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      sessionType: (s as Record<string, unknown>).session_type as string | null,
      coachName: coach?.name ?? programCoachInfo?.lead ?? '',
      venueName: venue?.name ?? '',
      bookedCount: attendanceCounts[s.id] ?? 0,
      leadCoach: programCoachInfo?.lead ?? coach?.name ?? '',
      assistantCoaches: programCoachInfo?.assistants ?? [],
    }
  })

  const serializedPrograms = (programs ?? []).map(p => ({
    id: p.id,
    name: p.name,
    level: p.level,
    max_capacity: p.max_capacity,
    program_roster: p.program_roster as { count: number }[],
  }))

  return (
    <div>
      <PageHeader title="Overview" description="Business snapshot at a glance." />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Families" value={String(familyCount ?? 0)} href="/admin/families" icon={Users} />
        <StatCard label="Players" value={String(playerCount ?? 0)} href="/admin/players" icon={UserCheck} />
        <StatCard label="Programs" value={String(programCount ?? 0)} href="/admin/programs" icon={GraduationCap} />
        <StatCard
          label="Outstanding"
          value={totalOutstanding !== 0 ? formatCurrency(totalOutstanding) : '$0.00'}
          variant={totalOutstanding < 0 ? 'danger' : 'default'}
          href="/admin/payments"
          icon={DollarSign}
        />
      </div>

      {/* Schedule Calendar */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">This Week</h2>
        <div className="mt-3">
          <OverviewCalendar sessions={serializedSessions} programs={serializedPrograms} />
        </div>
      </div>

      {/* Coach Pay Summary */}
      {coachPayRows.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Coach Pay This Term</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Coach</TableHead>
                  <TableHead className="text-right">Group Pay</TableHead>
                  <TableHead className="text-right">Private Pay</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coachPayRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(row.groupPay)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(row.privatePay)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold">{formatCurrency(row.groupPay + row.privatePay)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {balances && balances.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Account Balances</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Family</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b) => {
                  const family = b.families as unknown as { display_id: string; family_name: string } | null
                  return (
                    <TableRow key={b.family_id}>
                      <TableCell>
                        <Link href={`/admin/families/${b.family_id}`} className="font-medium hover:text-primary transition-colors">
                          {family?.display_id} ({family?.family_name})
                        </Link>
                      </TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${b.balance_cents < 0 ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(b.balance_cents)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
