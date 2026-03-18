import { redirect } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreditCard, FileText, ChevronRight } from 'lucide-react'
import { PaymentOptions } from './payment-options'

export default async function ParentPaymentsPage() {
  const supabase = await createClient()

  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  const familyId = userRole?.family_id
  if (!familyId) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={CreditCard}
          title="No family account linked"
          description="This is how parents see their payment history."
        />
      </div>
    )
  }

  const [
    { data: balance },
    { data: payments },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('family_balance').select('balance_cents').eq('family_id', familyId).single(),
    supabase
      .from('payments')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('invoices')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const balanceCents = balance?.balance_cents ?? 0
  const outstandingInvoices = invoices?.filter(i => i.status !== 'paid' && i.status !== 'void') ?? []

  return (
    <div className="space-y-6">
      {/* ── Balance Hero ── */}
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2B5EA7] via-[#6480A4] to-[#E87450] p-5 text-white shadow-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-white/80" />
            <p className="text-sm font-medium text-white/80">Payments & Invoices</p>
          </div>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${
            balanceCents < 0 ? 'text-red-200' :
            balanceCents > 0 ? 'text-emerald-200' :
            'text-white'
          }`}>
            {formatCurrency(balanceCents)}
          </p>
          <p className="mt-0.5 text-xs text-white/60">
            {balanceCents < 0 ? 'Outstanding balance' : balanceCents > 0 ? 'Credit on account' : 'Account balance'}
          </p>
        </div>
      </div>

      {/* ── Outstanding Invoices ── */}
      {outstandingInvoices.length > 0 && (
        <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-lg font-semibold text-foreground">Outstanding Invoices</h2>

          {/* Mobile cards */}
          <div className="mt-3 space-y-3 md:hidden">
            {outstandingInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border border-warning/20 bg-warning-light/50 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-warning" />
                    <p className="font-medium text-foreground">{invoice.display_id}</p>
                  </div>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {invoice.due_date ? `Due ${formatDate(invoice.due_date)}` : 'No due date'}
                  </span>
                  <span className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(invoice.amount_cents)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-3 hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.display_id}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(invoice.amount_cents)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* ── Make a Payment ── */}
      {outstandingInvoices.length > 0 && (
        <section className="animate-fade-up" style={{ animationDelay: '160ms' }}>
          <PaymentOptions
            familyId={familyId}
            outstandingInvoices={outstandingInvoices.map(i => ({
              id: i.id,
              display_id: i.display_id,
              amount_cents: i.amount_cents,
            }))}
          />
        </section>
      )}

      {/* ── Payment History ── */}
      <section className="animate-fade-up" style={{ animationDelay: '240ms' }}>
        <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
        {payments && payments.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="mt-3 space-y-3 md:hidden">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {payment.created_at ? formatDate(payment.created_at) : '-'}
                    </p>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="mt-1 text-sm text-foreground">
                    {payment.description || payment.category || '-'}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">
                      {payment.payment_method.replace('_', ' ')}
                    </span>
                    <span className="font-bold tabular-nums text-success">
                      {formatCurrency(payment.amount_cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-3 hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.created_at ? formatDate(payment.created_at) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.description || payment.category || '-'}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {payment.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-success">
                        {formatCurrency(payment.amount_cents)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon={CreditCard}
              title="No payments recorded yet"
              description="Your payment history will appear here."
              compact
            />
          </div>
        )}
      </section>
    </div>
  )
}
