'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatTime } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const LEVELS = ['red', 'orange', 'green', 'yellow', 'competitive']

type Program = {
  id: string
  name: string
  type: string
  level: string | null
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
  max_capacity: number | null
  per_session_cents: number | null
  term_fee_cents: number | null
  description: string | null
  program_roster: { id: string; player_id: string; status: string }[]
}

function ProgramCard({
  program,
  familyPlayerIds,
}: {
  program: Program
  familyPlayerIds: Set<string>
}) {
  const roster = program.program_roster ?? []
  const enrolled = roster.filter((r) => r.status === 'enrolled')
  const familyEnrolled = enrolled.filter((r) => familyPlayerIds.has(r.player_id))
  const spotsLeft = program.max_capacity ? program.max_capacity - enrolled.length : null

  return (
    <Link
      href={`/parent/programs/${program.id}`}
      className="block rounded-lg border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-foreground">{program.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {program.day_of_week != null && DAYS[program.day_of_week]}
            {program.start_time && ` · ${formatTime(program.start_time)}`}
            {program.end_time && ` - ${formatTime(program.end_time)}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="capitalize">
            {program.type}
          </Badge>
          <span className="text-xs capitalize text-muted-foreground/60">{program.level}</span>
        </div>
      </div>

      {program.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{program.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-3">
          {program.per_session_cents && (
            <span>{formatCurrency(program.per_session_cents)}/session</span>
          )}
          {program.term_fee_cents && (
            <span>{formatCurrency(program.term_fee_cents)}/term</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {spotsLeft !== null && (
            <span className={spotsLeft <= 2 ? 'text-danger font-medium' : ''}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </span>
          )}
          {familyEnrolled.length > 0 && (
            <Badge variant="outline" className="bg-success-light text-success border-success/20">
              Enrolled
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ParentProgramFilters({
  programs,
  playerLevels,
  familyPlayerIds,
}: {
  programs: Program[]
  playerLevels: string[]
  familyPlayerIds: string[]
}) {
  const [filter, setFilter] = useState<string>('recommended')
  const playerIds = new Set(familyPlayerIds)
  const playerLevelSet = new Set(playerLevels)

  const filters = [
    { key: 'recommended', label: 'Recommended' },
    { key: 'all', label: 'All' },
    ...DAYS.filter((_, i) => programs.some((p) => p.day_of_week === i)).map((day, i) => ({
      key: `day-${DAYS.indexOf(day)}`,
      label: day.slice(0, 3),
    })),
    ...LEVELS.filter((l) => programs.some((p) => p.level === l)).map((level) => ({
      key: `level-${level}`,
      label: level.charAt(0).toUpperCase() + level.slice(1),
    })),
  ]

  let filtered = programs
  if (filter === 'recommended') {
    filtered = programs.filter((p) => playerLevelSet.has(p.level ?? ''))
    // If no recommendations, fall back to all
    if (filtered.length === 0) filtered = programs
  } else if (filter.startsWith('day-')) {
    const dayIdx = parseInt(filter.replace('day-', ''), 10)
    filtered = programs.filter((p) => p.day_of_week === dayIdx)
  } else if (filter.startsWith('level-')) {
    const level = filter.replace('level-', '')
    filtered = programs.filter((p) => p.level === level)
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Program cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((program) => (
          <ProgramCard key={program.id} program={program} familyPlayerIds={playerIds} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">No programs match this filter.</p>
      )}
    </div>
  )
}
