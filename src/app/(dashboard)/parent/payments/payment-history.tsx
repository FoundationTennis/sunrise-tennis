'use client'

import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { CreditCard, ChevronDown, ChevronRight, CheckCircle2, Clock, CloudRain, XCircle } from 'lucide-react'

// SA school terms 2026 (approximate)
const TERMS: { label: string; start: string; end: string }[] = [
  { label: 'Term 1 2026', start: '2026-01-27', end: '2026-04-11' },
  { label: 'Term 2 2026', start: '2026-04-28', end: '2026-07-04' },
  { label: 'Term 3 2026', start: '2026-07-21', end: '2026-09-26' },
  { label: 'Term 4 2026', start: '2026-10-13', end: '2026-12-12' },
  { label: 'Term 4 2025', start: '2025-10-13', end: '2025-12-12' },
]

function getTermForDate(dateStr: string): string {
  const d = dateStr.slice(0, 10)
  for (const t of TERMS) {
    if (d >= t.start && d <= t.end) return t.label
  }
  // Holiday period — assign to nearest upcoming term
  for (const t of TERMS) {
    if (d < t.start) return t.label
  }
  return 'Other'
}

function getCurrentTerm(): string {
  const now = new Date().toISOString().slice(0, 10)
  return getTermForDate(now)
}

interface Allocation {
  amountCents: number
  chargeDescription: string
  sessionDate: string | null
  sessionStatus: string | null
}

interface Payment {
  id: string
  date: string
  description: string
  method: string
  amountCents: number
  status: string
  allocations: Allocation[]
}

function SessionStatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-3.5 text-success" />
    case 'scheduled':
      return <Clock className="size-3.5 text-primary" />
    case 'rained_out':
      return <CloudRain className="size-3.5 text-warning" />
    case 'cancelled':
      return <XCircle className="size-3.5 text-danger" />
    default:
      return null
  }
}

/** Strip trailing date pattern like " - 2026-04-06" */
function cleanDescription(desc: string): string {
  return desc.replace(/\s*-\s*\d{4}-\d{2}-\d{2}\s*$/, '')
}

function PaymentRow({ payment }: { payment: Payment }) {
  const [expanded, setExpanded] = useState(false)
  const hasAllocations = payment.allocations.length > 0

  return (
    <tr className="group">
      <td colSpan={5} className="p-0">
        <button
          onClick={() => hasAllocations && setExpanded(!expanded)}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
            hasAllocations ? 'hover:bg-muted/30 cursor-pointer' : ''
          } transition-colors`}
        >
          <span className="w-24 shrink-0 tabular-nums text-muted-foreground">
            {payment.date ? formatDate(payment.date) : '-'}
          </span>
          <span className="flex-1 min-w-0 truncate text-foreground">
            {payment.description}
          </span>
          <span className="hidden sm:inline capitalize text-muted-foreground w-24 shrink-0">
            {payment.method.replace('_', ' ')}
          </span>
          <span className="w-20 shrink-0 text-right tabular-nums font-medium text-success">
            {formatCurrency(payment.amountCents)}
          </span>
          <span className="w-5 shrink-0">
            {hasAllocations && (
              expanded
                ? <ChevronDown className="size-3.5 text-muted-foreground" />
                : <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
          </span>
        </button>

        {expanded && payment.allocations.length > 0 && (
          <div className="border-t border-border/50 bg-muted/20 px-4 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Applied to
            </p>
            {payment.allocations.map((alloc, i) => (
              <div key={i} className="flex items-center justify-between py-1 text-xs">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <SessionStatusIcon status={alloc.sessionStatus} />
                  <span className="truncate text-foreground">{cleanDescription(alloc.chargeDescription)}</span>
                  {alloc.sessionDate && (
                    <span className="text-muted-foreground shrink-0">
                      ({formatDate(alloc.sessionDate)})
                    </span>
                  )}
                </div>
                <span className="tabular-nums text-foreground shrink-0 ml-2">
                  {formatCurrency(alloc.amountCents)}
                </span>
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  // Build available terms from payment dates
  const availableTerms = useMemo(() => {
    const termSet = new Set<string>()
    for (const p of payments) {
      if (p.date) termSet.add(getTermForDate(p.date))
    }
    // Sort: current terms first, then reverse chronological
    const ordered = TERMS.filter(t => termSet.has(t.label)).map(t => t.label)
    if (termSet.has('Other')) ordered.push('Other')
    return ordered
  }, [payments])

  const currentTerm = getCurrentTerm()
  const defaultTerm = availableTerms.includes(currentTerm) ? currentTerm : availableTerms[0] ?? ''
  const [selectedTerm, setSelectedTerm] = useState(defaultTerm)

  const filtered = useMemo(() => {
    if (!selectedTerm) return payments
    return payments.filter(p => p.date && getTermForDate(p.date) === selectedTerm)
  }, [payments, selectedTerm])

  const termTotal = filtered.reduce((sum, p) => sum + p.amountCents, 0)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
        {availableTerms.length > 1 && (
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          >
            {availableTerms.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th colSpan={5} className="px-4 py-2 text-left">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{selectedTerm || 'All'} - {filtered.length} payment{filtered.length !== 1 ? 's' : ''}</span>
                    <span className="tabular-nums">{formatCurrency(termTotal)}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState
            icon={CreditCard}
            title="No payments this term"
            description="Payments will appear here once recorded."
            compact
          />
        </div>
      )}
    </div>
  )
}
