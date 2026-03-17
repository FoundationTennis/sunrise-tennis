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

export function ProgramViews({ programs }: { programs: Program[] }) {
  const [tab, setTab] = useState<Tab>('calendar')
  const [levelFilter, setLevelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')

  const levels = useMemo(() => [...new Set(programs.map(p => p.level).filter(Boolean) as string[])].sort(), [programs])
  const types = useMemo(() => [...new Set(programs.map(p => p.type).filter(Boolean))].sort(), [programs])
  const venues = useMemo(() => {
    const map = new Map<string, string>()
    programs.forEach(p => { if (p.venues) map.set(p.venues.id, p.venues.name) })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [programs])

  const filteredByLevel = levelFilter ? programs.filter(p => p.level === levelFilter) : programs
  const filteredByType = typeFilter ? programs.filter(p => p.type === typeFilter) : programs
  const filteredByVenue = venueFilter ? programs.filter(p => p.venue_id === venueFilter) : programs

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

      {/* Level tab */}
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
          <ProgramCards programs={filteredByLevel} />
        </div>
      )}

      {/* Type tab */}
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
          <ProgramCards programs={filteredByType} />
        </div>
      )}

      {/* Venue tab */}
      {tab === 'venue' && (
        <div className="mt-4">
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="mb-4 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All venues</option>
            {venues.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <ProgramCards programs={filteredByVenue} />
        </div>
      )}
    </div>
  )
}
