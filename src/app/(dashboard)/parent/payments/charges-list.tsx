'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { Gift, MinusCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDateFriendly } from '@/lib/utils/dates'
import { ChargeRow, type ChargeRowData, type ChargeBadge } from './charge-row'

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

function classifyBadge(c: Charge): ChargeBadge {
  const today = new Date().toISOString().split('T')[0]
  if (c.session_date && c.session_date > today && c.session_status === 'scheduled') {
    return 'scheduled'
  }
  return 'due'
}

function toRowData(c: Charge): ChargeRowData {
  return {
    id: c.id,
    description: c.description,
    amountCents: c.amount_cents,
    playerName: c.player_name ?? null,
    date: c.session_date ?? c.created_at ?? null,
    badge: classifyBadge(c),
    sessionId: c.session_id,
    programId: c.program_id,
  }
}

/** Build a service-group key for a charge */
function serviceKey(c: Charge): string {
  if (c.program_type === 'private') {
    // Extract coach first name from description like "Private lesson with Maxim Paskalutsa"
    const match = c.description?.match(/with\s+(\S+)/i)
    return `private-${match?.[1] ?? 'coach'}`
  }
  if (c.program_id) return `program-${c.program_id}`
  return 'other'
}

/** Friendly label for a service group */
function serviceLabel(c: Charge): string {
  if (c.program_type === 'private') {
    const match = c.description?.match(/with\s+(\S+)/i)
    return `Private with ${match?.[1] ?? 'Coach'}`
  }
  return c.program_name ?? c.description ?? 'Other'
}

interface PlayerGroup {
  playerName: string
  services: ServiceGroup[]
  subtotalCents: number
}

interface ServiceGroup {
  key: string
  label: string
  charges: Charge[]
  subtotalCents: number
}

function buildGroups(charges: Charge[]): { playerGroups: PlayerGroup[]; dueTotalCents: number; scheduledTotalCents: number; totalCents: number } {
  const today = new Date().toISOString().split('T')[0]

  // Group by player
  const byPlayer = new Map<string, Charge[]>()
  for (const c of charges) {
    const name = c.player_name ?? 'Unknown'
    const existing = byPlayer.get(name)
    if (existing) existing.push(c)
    else byPlayer.set(name, [c])
  }

  let dueTotalCents = 0
  let scheduledTotalCents = 0

  const playerGroups: PlayerGroup[] = [...byPlayer.entries()].map(([playerName, playerCharges]) => {
    // Group by service within player
    const byService = new Map<string, { label: string; charges: Charge[] }>()
    for (const c of playerCharges) {
      const key = serviceKey(c)
      const existing = byService.get(key)
      if (existing) existing.charges.push(c)
      else byService.set(key, { label: serviceLabel(c), charges: [c] })
    }

    const services: ServiceGroup[] = [...byService.entries()].map(([key, { label, charges: sCharges }]) => {
      // Sort by date, oldest first (due first, then scheduled)
      sCharges.sort((a, b) => {
        const dateA = a.session_date ?? a.created_at ?? ''
        const dateB = b.session_date ?? b.created_at ?? ''
        return dateA.localeCompare(dateB)
      })
      const subtotalCents = sCharges.reduce((sum, c) => sum + c.amount_cents, 0)
      return { key, label, charges: sCharges, subtotalCents }
    })

    const subtotalCents = playerCharges.reduce((sum, c) => sum + c.amount_cents, 0)

    // Accumulate totals
    for (const c of playerCharges) {
      if (c.session_date && c.session_date > today && c.session_status === 'scheduled') {
        scheduledTotalCents += c.amount_cents
      } else {
        dueTotalCents += c.amount_cents
      }
    }

    return { playerName, services, subtotalCents }
  })

  return {
    playerGroups,
    dueTotalCents,
    scheduledTotalCents,
    totalCents: dueTotalCents + scheduledTotalCents,
  }
}

export function ChargesList({ charges }: { charges: Charge[] }) {
  const [showPaid, setShowPaid] = useState(false)

  const active = charges.filter(c => c.status !== 'voided')
  const positive = active.filter(c => c.amount_cents > 0 && c.status !== 'paid' && c.status !== 'credited')
  const credits = active.filter(c => c.amount_cents < 0)
  const paid = active.filter(c => c.status === 'paid' || c.status === 'credited')

  const { playerGroups, dueTotalCents, scheduledTotalCents, totalCents } = buildGroups(positive)

  if (charges.length === 0) return null

  const hasMultiplePlayers = playerGroups.length > 1

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Charges</h2>

      {playerGroups.length > 0 ? (
        <div className="space-y-4">
          {playerGroups.map(({ playerName, services, subtotalCents }) => (
            <div key={playerName} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              {/* Player header */}
              {hasMultiplePlayers && (
                <div className="border-b border-border/50 bg-muted/20 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-foreground">{playerName}</h3>
                </div>
              )}

              {/* Service groups */}
              {services.map(({ key, label, charges: sCharges, subtotalCents: sSubtotal }) => (
                <div key={key}>
                  {/* Service group header */}
                  <div className="border-b border-border/30 bg-muted/10 px-4 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                  </div>

                  {/* Charge rows */}
                  <div className="divide-y divide-border/30">
                    {sCharges.map(c => (
                      <ChargeRow key={c.id} charge={toRowData(c)} compact />
                    ))}
                  </div>

                  {/* Service subtotal */}
                  {sCharges.length > 1 && (
                    <div className="border-t border-border/30 bg-muted/5 px-4 py-2 flex justify-between">
                      <span className="text-xs text-muted-foreground">Subtotal</span>
                      <span className="text-xs font-semibold tabular-nums text-foreground">{formatCurrency(sSubtotal)}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Player subtotal */}
              {hasMultiplePlayers && (
                <div className="border-t border-border/50 bg-muted/20 px-4 py-2.5 flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Player subtotal</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(subtotalCents)}</span>
                </div>
              )}
            </div>
          ))}

          {/* Totals */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="divide-y divide-border/50">
              {dueTotalCents > 0 && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm font-medium text-amber-700">Currently owed</span>
                  <span className="text-sm font-bold tabular-nums text-amber-700">{formatCurrency(dueTotalCents)}</span>
                </div>
              )}
              {scheduledTotalCents > 0 && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">{formatCurrency(scheduledTotalCents)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3 bg-muted/10">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(totalCents)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No outstanding charges.</p>
      )}

      {/* Credits */}
      {credits.length > 0 && (
        <div>
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
                    <p className="text-foreground">{credit.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {credit.session_date
                        ? formatDateFriendly(credit.session_date)
                        : credit.created_at
                          ? formatDateFriendly(credit.created_at)
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

      {/* Paid history (collapsed) */}
      {paid.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPaid(!showPaid)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-muted-foreground hover:bg-muted/20"
          >
            {showPaid ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            History ({paid.length})
          </button>
          {showPaid && (
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
              <div className="divide-y divide-border/50">
                {paid.map(c => (
                  <ChargeRow
                    key={c.id}
                    charge={{ ...toRowData(c), badge: 'paid' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
