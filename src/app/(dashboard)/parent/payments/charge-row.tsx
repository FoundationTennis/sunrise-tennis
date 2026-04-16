'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateFriendly } from '@/lib/utils/dates'
import { MessageCircle, ExternalLink, CreditCard, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ChargeBadge = 'due' | 'scheduled' | 'paid'

export interface ChargeRowData {
  id: string
  description: string
  amountCents: number
  playerName: string | null
  date: string | null
  badge: ChargeBadge
  sessionId?: string | null
  bookingId?: string | null
  programId?: string | null
}

const BADGE_STYLES: Record<ChargeBadge, string> = {
  due: 'bg-amber-100 text-amber-900 border border-amber-200',
  scheduled: 'bg-slate-100 text-slate-600 border border-slate-200',
  paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
}

const BADGE_LABELS: Record<ChargeBadge, string> = {
  due: 'Due now',
  scheduled: 'Scheduled',
  paid: 'Paid',
}

export function ChargeRow({ charge, compact }: { charge: ChargeRowData; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const displayDate = charge.date ? formatDateFriendly(charge.date) : null
  const isPaid = charge.badge === 'paid'

  // Build pre-filled message URL
  const questionUrl = `/parent/messages?compose=charge:${charge.id}&subject=${encodeURIComponent(`Question about charge`)}&body=${encodeURIComponent(`Hi, I have a question about the charge: ${charge.description} (${formatCurrency(charge.amountCents)})${displayDate ? ` on ${displayDate}` : ''}.`)}`

  return (
    <div>
      <button
        type="button"
        onClick={() => !isPaid && setExpanded(!expanded)}
        disabled={isPaid}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
          !isPaid && 'hover:bg-muted/20 cursor-pointer',
          expanded && 'bg-muted/10',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
              BADGE_STYLES[charge.badge],
            )}>
              {BADGE_LABELS[charge.badge]}
            </span>
            {displayDate && (
              <span className="text-xs text-muted-foreground tabular-nums">{displayDate}</span>
            )}
          </div>
          {!compact && (
            <p className="mt-1 text-sm text-foreground line-clamp-1">{charge.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn(
            'tabular-nums font-semibold',
            isPaid ? 'text-muted-foreground line-through' :
            charge.amountCents < 0 ? 'text-success' :
            'text-foreground',
          )}>
            {formatCurrency(charge.amountCents)}
          </span>
          {!isPaid && (
            <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          )}
        </div>
      </button>

      {/* Action sheet */}
      {expanded && !isPaid && (
        <div className="border-t border-border/30 bg-muted/5 px-4 py-2.5 flex flex-wrap gap-2">
          {charge.sessionId && (
            <Link
              href={charge.programId ? `/parent/programs/${charge.programId}` : '/parent/programs'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:shadow-card transition-all"
            >
              <ExternalLink className="size-3" />
              Go to session
            </Link>
          )}
          {charge.badge === 'due' && (
            <Link
              href="/parent/payments#pay"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary shadow-sm hover:bg-primary/10 transition-all"
            >
              <CreditCard className="size-3" />
              Pay now
            </Link>
          )}
          <Link
            href={questionUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:shadow-card transition-all"
          >
            <MessageCircle className="size-3" />
            Question this charge
          </Link>
        </div>
      )}
    </div>
  )
}
