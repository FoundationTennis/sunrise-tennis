'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatTime } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'
import { WeeklyCalendar, type CalendarEvent } from '@/components/weekly-calendar'
import { Calendar, List, Layers, Tag, Star } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LEVEL_COLORS: Record<string, string> = {
  red: 'bg-ball-red/20 border-ball-red/30',
  orange: 'bg-ball-orange/20 border-ball-orange/30',
  green: 'bg-ball-green/20 border-ball-green/30',
  yellow: 'bg-ball-yellow/20 border-ball-yellow/30',
  competitive: 'bg-primary/15 border-primary/30',
}

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

type Tab = 'recommended' | 'calendar' | 'list' | 'level' | 'type'

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
          <Badge variant="secondary" className="capitalize">{program.type}</Badge>
          <span className="text-xs capitalize text-muted-foreground/60">{program.level}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-3">
          {program.per_session_cents && <span>{formatCurrency(program.per_session_cents)}/session</span>}
          {program.term_fee_cents && <span>{formatCurrency(program.term_fee_cents)}/term</span>}
        </div>
        <div className="flex items-center gap-2">
          {spotsLeft !== null && (
            <span className={spotsLeft <= 2 ? 'text-danger font-medium' : ''}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </span>
          )}
          {familyEnrolled.length > 0 && (
            <Badge variant="outline" className="bg-success-light text-success border-success/20">Enrolled</Badge>
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
  const [tab, setTab] = useState<Tab>('recommended')
  const [levelFilter, setLevelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const playerIds = useMemo(() => new Set(familyPlayerIds), [familyPlayerIds])
  const playerLevelSet = useMemo(() => new Set(playerLevels), [playerLevels])

  const levels = useMemo(() => [...new Set(programs.map(p => p.level).filter(Boolean) as string[])].sort(), [programs])
  const types = useMemo(() => [...new Set(programs.map(p => p.type).filter(Boolean))].sort(), [programs])

  const recommended = useMemo(() => {
    const rec = programs.filter(p => playerLevelSet.has(p.level ?? ''))
    return rec.length > 0 ? rec : programs
  }, [programs, playerLevelSet])

  const filteredByLevel = levelFilter ? programs.filter(p => p.level === levelFilter) : programs
  const filteredByType = typeFilter ? programs.filter(p => p.type === typeFilter) : programs

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return programs
      .filter(p => p.day_of_week != null && p.start_time && p.end_time)
      .map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.type} - ${p.level ?? 'all'}`,
        dayOfWeek: p.day_of_week!,
        startTime: p.start_time!,
        endTime: p.end_time!,
        color: LEVEL_COLORS[p.level ?? ''] ?? 'bg-primary/15 border-primary/30',
        href: `/parent/programs/${p.id}`,
      }))
  }, [programs])

  const tabDefs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: 'recommended', label: 'Recommended', icon: Star },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'list', label: 'All', icon: List },
    { key: 'level', label: 'Level', icon: Layers },
    { key: 'type', label: 'Type', icon: Tag },
  ]

  function ProgramGrid({ items }: { items: Program[] }) {
    if (items.length === 0) return <p className="mt-4 text-center text-sm text-muted-foreground">No programs match.</p>
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((p) => <ProgramCard key={p.id} program={p} familyPlayerIds={playerIds} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {tabDefs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'recommended' && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">Matching your players&apos; current ball level.</p>
          <ProgramGrid items={recommended} />
        </div>
      )}

      {tab === 'calendar' && (
        <div className="mt-4">
          {calendarEvents.length > 0 ? (
            <WeeklyCalendar events={calendarEvents} />
          ) : (
            <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">No scheduled programs.</p>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div className="mt-4">
          <ProgramGrid items={programs} />
        </div>
      )}

      {tab === 'level' && (
        <div className="mt-4">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="mb-4 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All levels</option>
            {levels.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <ProgramGrid items={filteredByLevel} />
        </div>
      )}

      {tab === 'type' && (
        <div className="mt-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mb-4 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <ProgramGrid items={filteredByType} />
        </div>
      )}
    </div>
  )
}
