'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { ImageHero } from '@/components/image-hero'
import { CreditCard } from 'lucide-react'

export function BalanceHero({
  confirmedBalanceCents,
  projectedBalanceCents,
}: {
  confirmedBalanceCents: number
  projectedBalanceCents: number
}) {
  const [view, setView] = useState<'current' | 'upcoming'>('current')

  const balanceCents = view === 'upcoming' ? projectedBalanceCents : confirmedBalanceCents
  const label = view === 'upcoming' ? 'Upcoming Balance' : 'Current Balance'
  const subtitle = view === 'upcoming'
    ? 'Includes future bookings'
    : 'Completed sessions only'

  return (
    <ImageHero src="/images/tennis/hero-sunset.jpg" alt="Tennis court">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-white/80" />
          <p className="text-sm font-medium text-white/80">{label}</p>
        </div>

        {/* Toggle pills */}
        <div className="flex rounded-full bg-white/15 p-0.5 backdrop-blur-sm">
          <button
            onClick={() => setView('current')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              view === 'current'
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setView('upcoming')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              view === 'upcoming'
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      <p className={`mt-2 text-3xl font-bold tabular-nums ${
        balanceCents < 0 ? 'text-red-200' :
        balanceCents > 0 ? 'text-emerald-200' :
        'text-white'
      }`}>
        {formatCurrency(balanceCents)}
      </p>
      <p className="mt-0.5 text-xs text-white/60">{subtitle}</p>
    </ImageHero>
  )
}
