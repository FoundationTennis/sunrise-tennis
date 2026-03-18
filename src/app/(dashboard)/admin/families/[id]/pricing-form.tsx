'use client'

import { addFamilyPricing, removeFamilyPricing } from './pricing-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'
import { Trash2, DollarSign } from 'lucide-react'

interface PricingOverride {
  id: string
  program_id: string | null
  program_type: string | null
  per_session_cents: number | null
  term_fee_cents: number | null
  notes: string | null
  valid_from: string
  valid_until: string | null
}

interface Program {
  id: string
  name: string
  type: string
}

export function PricingForm({
  familyId,
  overrides,
  programs,
}: {
  familyId: string
  overrides: PricingOverride[]
  programs: Program[]
}) {
  const addWithFamily = addFamilyPricing.bind(null, familyId)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <DollarSign className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Custom Pricing</h2>
            <p className="text-xs text-muted-foreground">Override standard rates for this family</p>
          </div>
        </div>

        {/* Existing overrides */}
        {overrides.length > 0 && (
          <div className="mt-4 space-y-2">
            {overrides.map((o) => {
              const programName = o.program_id
                ? programs.find(p => p.id === o.program_id)?.name ?? 'Specific program'
                : o.program_type
                  ? `All ${o.program_type} programs`
                  : 'All programs'

              return (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{programName}</p>
                    <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      {o.per_session_cents && <span>Session: {formatCurrency(o.per_session_cents)}</span>}
                      {o.term_fee_cents && <span>Term: {formatCurrency(o.term_fee_cents)}</span>}
                      {o.notes && <span>- {o.notes}</span>}
                    </div>
                  </div>
                  <form action={removeFamilyPricing.bind(null, familyId, o.id)}>
                    <button type="submit" className="text-muted-foreground hover:text-danger transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}

        {/* Add new override */}
        <form action={addWithFamily} className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Add override</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="program_id">Program (optional)</Label>
              <select
                id="program_id"
                name="program_id"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All programs</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="program_type">Or by type</Label>
              <select
                id="program_type"
                name="program_type"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-</option>
                <option value="group">All groups</option>
                <option value="squad">All squads</option>
                <option value="private">All privates</option>
                <option value="school">All school programs</option>
              </select>
            </div>

            <div>
              <Label htmlFor="per_session_dollars">Per session ($)</Label>
              <input
                id="per_session_dollars"
                name="per_session_dollars"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 80.00"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <Label htmlFor="term_fee_dollars">Term fee ($)</Label>
              <input
                id="term_fee_dollars"
                name="term_fee_dollars"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 160.00"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-3">
            <Label htmlFor="notes">Notes</Label>
            <input
              id="notes"
              name="notes"
              type="text"
              placeholder="e.g. Grandfathered rate from 2025"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <input type="hidden" name="valid_from" value={new Date().toISOString().split('T')[0]} />

          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm">Add Override</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
