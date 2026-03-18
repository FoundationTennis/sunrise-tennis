import { createClient, requireAdmin } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket } from 'lucide-react'
import { approveVoucher, rejectVoucher } from './actions'

export default async function AdminVouchersPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('id, family_id, voucher_code, voucher_type, amount_cents, status, submitted_at, reviewed_at, notes')
    .order('submitted_at', { ascending: false })
    .limit(50)

  // Get family names for display
  const familyIds = [...new Set((vouchers ?? []).map(v => v.family_id))]
  let familyNames: Record<string, string> = {}
  if (familyIds.length > 0) {
    const { data: families } = await supabase
      .from('families')
      .select('id, family_name')
      .in('id', familyIds)
    if (families) {
      familyNames = Object.fromEntries(families.map(f => [f.id, f.family_name]))
    }
  }

  const pendingVouchers = vouchers?.filter(v => v.status === 'pending') ?? []
  const processedVouchers = vouchers?.filter(v => v.status !== 'pending') ?? []

  return (
    <div className="max-w-4xl">
      <PageHeader title="Sports Vouchers" />

      {/* Pending vouchers */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-foreground">Pending Review</h2>

        {pendingVouchers.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Ticket}
              title="No pending vouchers"
              description="Vouchers submitted by parents will appear here for approval."
              compact
            />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {pendingVouchers.map((voucher) => (
              <Card key={voucher.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {familyNames[voucher.family_id] ?? 'Unknown family'}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-mono">{voucher.voucher_code}</span>
                        <span className="capitalize">{voucher.voucher_type.replace('_', ' ')}</span>
                        <span className="tabular-nums">{formatCurrency(voucher.amount_cents)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {voucher.submitted_at ? formatDate(voucher.submitted_at) : '-'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <form action={approveVoucher.bind(null, voucher.id)}>
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form action={rejectVoucher.bind(null, voucher.id)}>
                        <input type="hidden" name="reason" value="" />
                        <Button type="submit" variant="outline" size="sm">
                          Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Processed vouchers */}
      {processedVouchers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Processed</h2>
          <div className="mt-3 space-y-2">
            {processedVouchers.map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {familyNames[voucher.family_id] ?? 'Unknown'}
                    <span className="ml-2 font-mono text-muted-foreground">{voucher.voucher_code}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {voucher.reviewed_at ? formatDate(voucher.reviewed_at) : '-'}
                    {voucher.notes && ` - ${voucher.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">{formatCurrency(voucher.amount_cents)}</span>
                  <StatusBadge status={voucher.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
