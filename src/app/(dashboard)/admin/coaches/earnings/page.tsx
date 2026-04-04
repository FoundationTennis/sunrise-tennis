import { createClient, requireAdmin } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'
import { RecordPaymentForm } from '../../privates/earnings/record-payment-form'

export default async function CoachEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
  await requireAdmin()
  const supabase = await createClient()

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name, is_owner, pay_period, hourly_rate')
    .eq('status', 'active')
    .order('name')

  const { data: earnings } = await supabase
    .from('coach_earnings')
    .select('coach_id, amount_cents, status')

  const { data: payments } = await supabase
    .from('coach_payments')
    .select('id, coach_id, amount_cents, pay_period_key, notes, paid_at')
    .order('paid_at', { ascending: false })
    .limit(20)

  const coachSummaries = (coaches ?? [])
    .filter(c => !c.is_owner)
    .map(coach => {
      const coachEarnings = (earnings ?? []).filter(e => e.coach_id === coach.id)
      const owed = coachEarnings.filter(e => e.status === 'owed').reduce((s, e) => s + e.amount_cents, 0)
      const paid = coachEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount_cents, 0)
      const groupRate = (coach.hourly_rate as { group_rate_cents?: number } | null)?.group_rate_cents ?? 0
      const privateRate = (coach.hourly_rate as { private_rate_cents?: number } | null)?.private_rate_cents ?? 0
      return { ...coach, owed, paid, total: owed + paid, groupRate, privateRate }
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coach Earnings"
        description="Track and record coach payments"
        breadcrumbs={[{ label: 'Coaches', href: '/admin/coaches' }]}
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

      <div className="grid gap-3 sm:grid-cols-2">
        {coachSummaries.map(coach => (
          <Card key={coach.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{coach.name}</p>
                <span className="text-xs text-muted-foreground">
                  {coach.pay_period === 'end_of_term' ? 'Term pay' : coach.pay_period === 'fortnightly' ? 'Fortnightly pay' : 'Weekly pay'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {coach.groupRate > 0 && `Group: ${formatCurrency(coach.groupRate)}/hr`}
                {coach.groupRate > 0 && coach.privateRate > 0 && ' · '}
                {coach.privateRate > 0 && `Private: ${formatCurrency(coach.privateRate)}/hr`}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(coach.owed)}</p>
                  <p className="text-xs text-muted-foreground">Owed</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(coach.paid)}</p>
                  <p className="text-xs text-muted-foreground">Paid</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(coach.total)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RecordPaymentForm coaches={coachSummaries.map(c => ({ id: c.id, name: c.name, owed: c.owed }))} />

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
