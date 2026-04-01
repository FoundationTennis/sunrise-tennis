'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatTime } from '@/lib/utils/dates'
import { StatusBadge } from '@/components/status-badge'
import { WeeklyCalendar, type CalendarEvent } from '@/components/weekly-calendar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, List, Layers, Tag, MapPin } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LEVEL_COLORS: Record<string, string> = {
  red: 'bg-ball-red/20 border-ball-red/30',
  orange: 'bg-ball-orange/20 border-ball-orange/30',
  green: 'bg-ball-green/20 border-ball-green/30',
  yellow: 'bg-ball-yellow/20 border-ball-yellow/30',
  competitive: 'bg-primary/15 border-primary/30',
}

/** Button colors for level filter pills */
const LEVEL_PILL_STYLES: Record<string, { active: string; inactive: string }> = {
  red:    { active: 'bg-ball-red text-white shadow-sm',    inactive: 'bg-ball-red/15 text-ball-red hover:bg-ball-red/25' },
  orange: { active: 'bg-ball-orange text-white shadow-sm', inactive: 'bg-ball-orange/15 text-ball-orange hover:bg-ball-orange/25' },
  green:  { active: 'bg-ball-green text-white shadow-sm',  inactive: 'bg-ball-green/15 text-ball-green hover:bg-ball-green/25' },
  yellow: { active: 'bg-ball-yellow text-black shadow-sm', inactive: 'bg-ball-yellow/15 text-ball-yellow hover:bg-ball-yellow/25' },
  blue:   { active: 'bg-ball-blue text-white shadow-sm',   inactive: 'bg-ball-blue/15 text-ball-blue hover:bg-ball-blue/25' },
  competitive: { active: 'bg-primary text-white shadow-sm', inactive: 'bg-primary/15 text-primary hover:bg-primary/25' },
}

const TYPE_PILL_STYLES: Record<string, { active: string; inactive: string }> = {
  group:       { active: 'bg-blue-600 text-white shadow-sm',  inactive: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  squad:       { active: 'bg-slate-700 text-white shadow-sm', inactive: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  school:      { active: 'bg-purple-600 text-white shadow-sm', inactive: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  competition: { active: 'bg-amber-500 text-white shadow-sm', inactive: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
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
  status: string | null
  venue_id: string | null
  venues: { id: string; name: string } | null
  program_roster: { count: number }[]
}

type Tab = 'calendar' | 'list' | 'level' | 'type' | 'venue'

const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'list', label: 'List', icon: List },
  { key: 'level', label: 'Level', icon: Layers },
  { key: 'type', label: 'Type', icon: Tag },
  { key: 'venue', label: 'Venue', icon: MapPin },
]

function ProgramCard({ program }: { program: Program }) {
  const enrolled = program.program_roster?.[0]?.count ?? 0
  return (
    <Link
      href={`/admin/programs/${program.id}`}
      className="block rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between">
        <p className="font-medium text-foreground">{program.name}</p>
        <StatusBadge status={program.status ?? 'active'} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {program.day_of_week != null ? DAYS[program.day_of_week] : '-'}
        {program.start_time && ` ${formatTime(program.start_time)}`}
        {program.end_time && ` - ${formatTime(program.end_time)}`}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="capitalize">{program.type}</span>
        <span className="capitalize">{program.level}</span>
        <span>{enrolled}{program.max_capacity ? `/${program.max_capacity}` : ''} enrolled</span>
        {program.venues && <span>{program.venues.name}</span>}
        {program.per_session_cents && <span className="ml-auto tabular-nums">{formatCurrency(program.per_session_cents)}/session</span>}
      </div>
    </Link>
  )
}

function ProgramCards({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">No programs match.</p>
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((p) => <ProgramCard key={p.id} program={p} />)}
    </div>
  )
}

function toCalendarEvents(programs: Program[]): CalendarEvent[] {
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
      href: `/admin/programs/${p.id}`,
    }))
}

/**
 * Filter programs by level, including competition programs that span
 * multiple levels (e.g. "red/orange comp" shows under both red and orange).
 */
function filterByLevel(programs: Program[], level: string): Program[] {
  return programs.filter(p => {
    if (p.level === level) return true
    // Check if program name contains the level (for multi-level comps like "Red/Orange")
    const nameLower = p.name.toLowerCase()
    return nameLower.includes(level.toLowerCase())
  })
}

export function ProgramViews({ programs }: { programs: Program[] }) {
  const [tab, setTab] = useState<Tab>('calendar')
  const [levelFilter, setLevelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')

  const levels = useMemo(() => {
    const lvls = new Set<string>()
    programs.forEach(p => {
      if (p.level) lvls.add(p.level)
      // Also extract levels mentioned in program names for multi-level comps
      const nameLower = p.name.toLowerCase()
      for (const l of ['red', 'orange', 'green', 'yellow', 'blue']) {
        if (nameLower.includes(l)) lvls.add(l)
      }
    })
    const order = ['red', 'orange', 'green', 'yellow', 'blue', 'competitive']
    return [...lvls].sort((a, b) => {
      const iA = order.indexOf(a)
      const iB = order.indexOf(b)
      return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB)
    })
  }, [programs])

  const types = useMemo(() => [...new Set(programs.map(p => p.type).filter(Boolean))].sort(), [programs])
  const venues = useMemo(() => {
    const map = new Map<string, string>()
    programs.forEach(p => { if (p.venues) map.set(p.venues.id, p.venues.name) })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [programs])

  const filteredByLevel = levelFilter ? filterByLevel(programs, levelFilter) : programs
  const filteredByType = typeFilter ? programs.filter(p => p.type === typeFilter) : programs
  const filteredByVenue = venueFilter ? programs.filter(p => p.venue_id === venueFilter) : programs

  return (
    <div>
      {/* Primary tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setLevelFilter(''); setTypeFilter(''); setVenueFilter('') }}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Calendar tab */}
      {tab === 'calendar' && (
        <div className="mt-4">
          {toCalendarEvents(programs).length > 0 ? (
            <WeeklyCalendar events={toCalendarEvents(programs)} />
          ) : (
            <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">No scheduled programs.</p>
          )}
        </div>
      )}

      {/* List tab */}
      {tab === 'list' && (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {programs.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
          <div className="mt-4 hidden md:block">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Day / Time</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Per Session</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((p) => {
                    const enrolled = p.program_roster?.[0]?.count ?? 0
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link href={`/admin/programs/${p.id}`} className="hover:text-primary transition-colors">{p.name}</Link>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{p.type}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{p.level}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.day_of_week != null ? DAYS[p.day_of_week] : '-'}
                          {p.start_time && ` ${formatTime(p.start_time)}`}
                          {p.end_time && ` - ${formatTime(p.end_time)}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrolled}{p.max_capacity ? `/${p.max_capacity}` : ''}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {p.per_session_cents ? formatCurrency(p.per_session_cents) : '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status ?? 'active'} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Level tab — color-coded pill buttons */}
      {tab === 'level' && (
        <div className="mt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setLevelFilter('')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                !levelFilter ? 'bg-foreground text-background shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            {levels.map(l => {
              const style = LEVEL_PILL_STYLES[l] ?? { active: 'bg-primary text-white shadow-sm', inactive: 'bg-muted text-muted-foreground hover:bg-accent' }
              return (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l === levelFilter ? '' : l)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                    levelFilter === l ? style.active : style.inactive
                  }`}
                >
                  {l}
                </button>
              )
            })}
          </div>
          <ProgramCards programs={filteredByLevel} />
        </div>
      )}

      {/* Type tab — colored pill buttons */}
      {tab === 'type' && (
        <div className="mt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                !typeFilter ? 'bg-foreground text-background shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            {types.map(t => {
              const style = TYPE_PILL_STYLES[t] ?? { active: 'bg-primary text-white shadow-sm', inactive: 'bg-muted text-muted-foreground hover:bg-accent' }
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                    typeFilter === t ? style.active : style.inactive
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
          <ProgramCards programs={filteredByType} />
        </div>
      )}

      {/* Venue tab — pill buttons */}
      {tab === 'venue' && (
        <div className="mt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setVenueFilter('')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                !venueFilter ? 'bg-foreground text-background shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            {venues.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setVenueFilter(id === venueFilter ? '' : id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  venueFilter === id ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <ProgramCards programs={filteredByVenue} />
        </div>
      )}
    </div>
  )
}
