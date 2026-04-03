import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { calculateGroupCoachPay } from '@/lib/utils/billing'
import { getCurrentTermRange } from '@/lib/utils/school-terms'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, UserCheck, GraduationCap, DollarSign, Plus } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { start: termStart, end: termEnd } = getCurrentTermRange(new Date())

  const [
    { count: familyCount },
    { count: playerCount },
    { count: programCount },
    { data: balances },
    { data: coaches },
    { data: completedSessions },
    { data: coachEarnings },
    { data: allProgramCoaches },
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

  // Calculate group session pay per coach
  for (const s of completedSessions ?? []) {
    let durationMin = 60
    if (s.start_time && s.end_time) {
      const [sh, sm] = s.start_time.split(':').map(Number)
      const [eh, em] = s.end_time.split(':').map(Number)
      durationMin = (eh * 60 + em) - (sh * 60 + sm)
    }

    // Find all coaches assigned to this session's program
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

    // Also include the direct session coach if not in program_coaches
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

  // Add private earnings
  for (const e of coachEarnings ?? []) {
    const entry = coachPayMap.get(e.coach_id)
    if (entry) entry.privatePay += e.amount_cents
  }

  const coachPayRows = [...coachPayMap.values()]
    .filter(r => r.groupPay > 0 || r.privatePay > 0)
    .sort((a, b) => (b.groupPay + b.privatePay) - (a.groupPay + a.privatePay))

  return (
    <div>
      <PageHeader title="Overview" description="Business snapshot at a glance." />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Families" value={String(familyCount ?? 0)} href="/admin/families" icon={Users} />
        <StatCard label="Players" value={String(playerCount ?? 0)} icon={UserCheck} />
        <StatCard label="Programs" value={String(programCount ?? 0)} href="/admin/programs" icon={GraduationCap} />
        <StatCard
          label="Outstanding"
          value={totalOutstanding !== 0 ? formatCurrency(totalOutstanding) : '$0.00'}
          variant={totalOutstanding < 0 ? 'danger' : 'default'}
          icon={DollarSign}
        />
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-auto justify-center border-2 border-dashed p-6">
          <Link href="/admin/families/new" className="flex items-center gap-2">
            <Plus className="size-4" />
            Add new family
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-center border-2 border-dashed p-6">
          <Link href="/admin/programs/new" className="flex items-center gap-2">
            <Plus className="size-4" />
            Add new program
          </Link>
        </Button>
      </div>
    </div>
  )
}
