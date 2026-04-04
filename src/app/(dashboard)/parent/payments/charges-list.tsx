'use client'

import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import {
  Gift,
  MinusCircle,
  CheckCircle2,
  Clock,
  CloudRain,
  XCircle,
} from 'lucide-react'

interface Charge {
  id: string
  type: string
  source_type: string
  description: string
  amount_cents: number
  status: string
  program_id: string | null
  session_id: string | null
  player_id: string | null
  created_at: string | null
  program_name?: string | null
  program_type?: string | null
  player_name?: string | null
  session_date?: string | null
  session_status?: string | null
}

type Category = 'groups' | 'privates' | 'competitions' | 'events' | 'other'

const CATEGORY_LABELS: Record<Category, string> = {
  groups: 'Groups & Squads',
  privates: 'Private Lessons',
  competitions: 'Competitions',
  events: 'Events',
  other: 'Other',
}

const CATEGORY_ORDER: Category[] = ['groups', 'privates', 'competitions', 'events', 'other']

function categoriseCharge(c: Charge): Category {
  if (c.type === 'private' || c.program_type === 'private') return 'privates'
  if (c.type === 'event') return 'events'
  if (c.program_type === 'competition') return 'competitions'
  if (c.program_type === 'group' || c.program_type === 'squad' || c.program_type === 'school') return 'groups'
  if (c.source_type === 'enrollment' || c.source_type === 'attendance') return 'groups'
  return 'other'
}

/** Strip trailing date pattern like " - 2026-04-06" from description for cleaner display */
function cleanDescription(desc: string): string {
  return desc.replace(/\s*-\s*\d{4}-\d{2}-\d{2}\s*$/, '')
}

function SessionStatusIcon({ status }: { status: string | null | undefined }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-3.5 shrink-0 text-success" />
    case 'scheduled':
      return <Clock className="size-3.5 shrink-0 text-primary" />
    case 'rained_out':
      return <CloudRain className="size-3.5 shrink-0 text-warning" />
    case 'cancelled':
      return <XCircle className="size-3.5 shrink-0 text-danger" />
    default:
      return null
  }
}

export function ChargesList({ charges }: { charges: Charge[] }) {
  const activeCharges = charges.filter(c => c.status !== 'voided')
  const positiveCharges = activeCharges.filter(c => c.amount_cents > 0)
  const credits = activeCharges.filter(c => c.amount_cents < 0)

  // Group by category
  const grouped = new Map<Category, Charge[]>()
  for (const c of positiveCharges) {
    const cat = categoriseCharge(c)
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(c)
  }

  if (charges.length === 0) return null

  const totalCents = positiveCharges.reduce((sum, c) => sum + c.amount_cents, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Current Charges</h2>
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatCurrency(totalCents)}
        </span>
      </div>

      {positiveCharges.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground" />
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Player</th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Date</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((cat) => {
                const catCharges = grouped.get(cat)
                if (!catCharges || catCharges.length === 0) return null
                const catTotal = catCharges.reduce((sum, c) => sum + c.amount_cents, 0)

                return (
                  <CatChargeRows
                    key={cat}
                    label={CATEGORY_LABELS[cat]}
                    charges={catCharges}
                    totalCents={catTotal}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No outstanding charges.</p>
      )}

      {/* Credits */}
      {credits.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Gift className="size-4 text-success" />
            Credits
          </h3>
          <div className="mt-2 space-y-2">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between rounded-lg border border-success/20 bg-success/5 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <MinusCircle className="size-4 text-success" />
                  <div>
                    <p className="text-foreground">{cleanDescription(credit.description)}</p>
                    <p className="text-xs text-muted-foreground">
                      {credit.session_date
                        ? formatDate(credit.session_date)
                        : credit.created_at
                          ? formatDate(credit.created_at)
                          : '-'}
                    </p>
                  </div>
                </div>
                <span className="tabular-nums font-medium text-success">
                  {formatCurrency(credit.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CatChargeRows({
  label,
  charges,
  totalCents,
}: {
  label: string
  charges: Charge[]
  totalCents: number
}) {
  return (
    <>
      {/* Category header row */}
      <tr className="bg-muted/30">
        <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </td>
        <td className="px-4 py-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
          {formatCurrency(totalCents)}
        </td>
      </tr>
      {/* Charge rows */}
      {charges.map((c) => {
        const displayDate = c.session_date
          ? formatDate(c.session_date)
          : c.created_at
            ? formatDate(c.created_at)
            : '-'

        return (
          <tr key={c.id} className="border-b border-border/50 last:border-b-0">
            <td className="w-8 pl-4 py-2">
              <SessionStatusIcon status={c.session_status} />
            </td>
            <td className="px-4 py-2 text-foreground">
              <span className="line-clamp-1">{cleanDescription(c.description)}</span>
              {/* Mobile: show player + date inline */}
              <span className="block text-xs text-muted-foreground sm:hidden">
                {c.player_name && <>{c.player_name} · </>}
                {displayDate}
              </span>
            </td>
            <td className="hidden px-4 py-2 text-muted-foreground sm:table-cell">
              {c.player_name ?? '-'}
            </td>
            <td className="hidden px-4 py-2 tabular-nums text-muted-foreground sm:table-cell">
              {displayDate}
            </td>
            <td className="px-4 py-2 text-right tabular-nums font-medium text-foreground">
              {formatCurrency(c.amount_cents)}
            </td>
          </tr>
        )
      })}
    </>
  )
}
