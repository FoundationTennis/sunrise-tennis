import Link from 'next/link'
import { createClient, requireAdmin } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { calculateGroupCoachPay } from '@/lib/utils/billing'
import { getCurrentTermRange } from '@/lib/utils/school-terms'
import { formatTime } from '@/lib/utils/dates'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { RecordPaymentForm } from '../../admin/privates/earnings/record-payment-form'
import { Clock, Users, DollarSign, GraduationCap } from 'lucide-react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
  await requireAdmin()
  const supabase = await createClient()
  const { start: termStart, end: termEnd } = getCurrentTermRange(new Date())

  const [
    { data: coaches },
    { data: availability },
    { data: programCoaches },
    { data: earnings },
    { data: completedSessions },
    { data: scheduledSessions },
    { data: payments },
  ] = await Promise.all([
    supabase.from('coaches').select('id, name, is_owner, status, pay_period, hourly_rate').eq('status', 'active').order('name'),
    supabase.from('coach_availability').select('coach_id, day_of_week, start_time, end_time').order('day_of_week').order('start_time'),
    supabase.from('program_coaches').select('program_id, coach_id, role, programs:program_id(name, day_of_week, start_time)'),
    supabase.from('coach_earnings').select('coach_id, amount_cents, status'),
    supabase.from('sessions')
      .select('id, program_id, coach_id, start_time, end_time, status')
      .eq('status', 'completed')
      .gte('date', termStart)
      .lte('date', termEnd),
    supabase.from('sessions')
      .select('id, coach_id, status')
      .eq('status', 'scheduled')
      .gte('date', termStart)
      .lte('date', termEnd),
    supabase.from('coach_payments')
      .select('id, coach_id, amount_cents, pay_period_key, notes, paid_at')
      .order('paid_at', { ascending: false })
      .limit(20),
  ])

  // Group availability by coach
  const coachAvailability = new Map<string, typeof availability>()
  for (const a of availability ?? []) {
    const existing = coachAvailability.get(a.coach_id) ?? []
    existing.push(a)
    coachAvailability.set(a.coach_id, existing)
  }

  // Group program assignments by coach
  const coachPrograms = new Map<string, { name: string; day: number | null; time: string | null; role: string }[]>()
  for (const pc of programCoaches ?? []) {
    const prog = pc.programs as unknown as { name: string; day_of_week: number | null; start_time: string | null } | null
    if (!prog) continue
    const existing = coachPrograms.get(pc.coach_id) ?? []
    existing.push({ name: prog.name, day: prog.day_of_week, time: prog.start_time, role: pc.role })
    coachPrograms.set(pc.coach_id, existing)
  }

  // Build per-coach data
  const allProgramCoaches = programCoaches ?? []
  const coachCards = (coaches ?? []).filter(c => !c.is_owner).map(coach => {
    const groupRate = (coach.hourly_rate as { group_rate_cents?: number } | null)?.group_rate_cents ?? 0
    const privateRate = (coach.hourly_rate as { private_rate_cents?: number } | null)?.private_rate_cents ?? 0
    const windows = coachAvailability.get(coach.id) ?? []
    const programs = coachPrograms.get(coach.id) ?? []
    const coachEarnings = (earnings ?? []).filter(e => e.coach_id === coach.id)
    const owed = coachEarnings.filter(e => e.status === 'owed').reduce((s, e) => s + e.amount_cents, 0)
    const paid = coachEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount_cents, 0)

    // Session counts this term
    let groupPay = 0
    for (const s of completedSessions ?? []) {
      const isAssigned = allProgramCoaches.some(pc => pc.program_id === s.program_id && pc.coach_id === coach.id)
      const isDirect = s.coach_id === coach.id
      if (!isAssigned && !isDirect) continue
      let durationMin = 60
      if (s.start_time && s.end_time) {
        const [sh, sm] = s.start_time.split(':').map(Number)
        const [eh, em] = s.end_time.split(':').map(Number)
        durationMin = (eh * 60 + em) - (sh * 60 + sm)
      }
      if (groupRate) groupPay += calculateGroupCoachPay(groupRate, durationMin)
    }

    const completedCount = (completedSessions ?? []).filter(s =>
      allProgramCoaches.some(pc => pc.program_id === s.program_id && pc.coach_id === coach.id) || s.coach_id === coach.id
    ).length
    const upcomingCount = (scheduledSessions ?? []).filter(s => s.coach_id === coach.id).length

    return {
      ...coach,
      groupRate,
      privateRate,
      windows,
      programs,
      owed,
      paid,
      groupPay,
      completedCount,
      upcomingCount,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coaches"
        description="Coach availability, programs, and pay"
        action={
          <Link href="/admin/coaches/availability" className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
            Manage Availability
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success/20 bg-success-light px-4 py-3 text-sm text-success">
          {decodeURIComponent(success)}
        </div>
      )}

      {/* Coach cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {coachCards.map(coach => (
          <Link key={coach.id} href={`/admin/coaches/${coach.id}`} className="block">
          <Card className="overflow-hidden transition-all hover:shadow-elevated hover:scale-[1.01]">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="font-semibold text-foreground">{coach.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {coach.pay_period === 'end_of_term' ? 'Term pay' : coach.pay_period === 'fortnightly' ? 'Fortnightly' : 'Weekly'}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {coach.groupRate > 0 && <p>Group: {formatCurrency(coach.groupRate)}/hr</p>}
                  {coach.privateRate > 0 && <p>Private: {formatCurrency(coach.privateRate)}/hr</p>}
                </div>
              </div>

              <div className="space-y-3 p-4">
                {/* Availability */}
                {coach.windows.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {coach.windows.map((w, i) => (
                        <span key={i}>{DAY_NAMES[w.day_of_week]} {formatTime(w.start_time)}-{formatTime(w.end_time)}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Programs */}
                {coach.programs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {coach.programs.map((p, i) => (
                        <span key={i}>
                          {p.name}
                          {p.role !== 'primary' && <span className="ml-0.5 text-[10px] opacity-60">(A)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {coach.completedCount} completed · {coach.upcomingCount} upcoming
                  </span>
                </div>

                {/* Pay */}
                <div className="flex items-start gap-2">
                  <DollarSign className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex flex-wrap gap-x-3 text-xs">
                    {coach.groupPay > 0 && <span className="text-muted-foreground">Group: {formatCurrency(coach.groupPay)}</span>}
                    {coach.owed > 0 && <span className="text-orange-600">Owed: {formatCurrency(coach.owed)}</span>}
                    {coach.paid > 0 && <span className="text-success">Paid: {formatCurrency(coach.paid)}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>

      {/* Record payment form */}
      <RecordPaymentForm coaches={coachCards.map(c => ({ id: c.id, name: c.name, owed: c.owed }))} />

      {/* Recent payments */}
      {(payments ?? []).length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Recent Payments</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(payments ?? []).map(p => {
                  const coach = coaches?.find(c => c.id === p.coach_id)
                  return (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{coach?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(p.amount_cents)} · {p.pay_period_key}
                          {p.notes && ` · ${p.notes}`}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-AU') : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
