'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatTime } from '@/lib/utils/dates'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { List, Calendar, MapPin, Layers } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const LEVELS = ['red', 'orange', 'green', 'yellow', 'competitive']
const LEVEL_COLORS: Record<string, string> = {
  red: 'bg-ball-red/10 text-ball-red border-ball-red/20',
  orange: 'bg-ball-orange/10 text-ball-orange border-ball-orange/20',
  green: 'bg-ball-green/10 text-ball-green border-ball-green/20',
  yellow: 'bg-ball-yellow/10 text-ball-yellow border-ball-yellow/20',
  competitive: 'bg-primary/10 text-primary border-primary/20',
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

type ViewMode = 'list' | 'by-level' | 'by-day' | 'by-venue'

const views: { mode: ViewMode; label: string; icon: typeof List }[] = [
  { mode: 'list', label: 'All', icon: List },
  { mode: 'by-level', label: 'By Level', icon: Layers },
  { mode: 'by-day', label: 'By Day', icon: Calendar },
  { mode: 'by-venue', label: 'By Venue', icon: MapPin },
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

function ProgramTable({ programs }: { programs: Program[] }) {
  return (
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
  )
}

export function ProgramViews({ programs }: { programs: Program[] }) {
  const [view, setView] = useState<ViewMode>('list')

  return (
    <div>
      {/* View toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {views.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === mode
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* List view */}
      {view === 'list' && (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {programs.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
          <div className="mt-4 hidden md:block">
            <ProgramTable programs={programs} />
          </div>
        </>
      )}

      {/* By Level */}
      {view === 'by-level' && (
        <div className="mt-4 space-y-6">
          {LEVELS.map((level) => {
            const group = programs.filter((p) => p.level === level)
            if (group.length === 0) return null
            return (
              <div key={level}>
                <div className="flex items-center gap-2">
                  <Badge className={`capitalize ${LEVEL_COLORS[level] ?? ''}`}>{level}</Badge>
                  <span className="text-sm text-muted-foreground">{group.length} program{group.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((p) => <ProgramCard key={p.id} program={p} />)}
                </div>
              </div>
            )
          })}
          {/* Programs without a level */}
          {programs.filter((p) => !p.level || !LEVELS.includes(p.level)).length > 0 && (
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Other</Badge>
                <span className="text-sm text-muted-foreground">{programs.filter((p) => !p.level || !LEVELS.includes(p.level)).length} programs</span>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {programs.filter((p) => !p.level || !LEVELS.includes(p.level)).map((p) => <ProgramCard key={p.id} program={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* By Day */}
      {view === 'by-day' && (
        <div className="mt-4 space-y-6">
          {DAYS.map((day, index) => {
            const group = programs.filter((p) => p.day_of_week === index)
            if (group.length === 0) return null
            return (
              <div key={day}>
                <h3 className="text-sm font-semibold text-foreground">{day}</h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((p) => <ProgramCard key={p.id} program={p} />)}
                </div>
              </div>
            )
          })}
          {programs.filter((p) => p.day_of_week == null).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">Unscheduled</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {programs.filter((p) => p.day_of_week == null).map((p) => <ProgramCard key={p.id} program={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* By Venue */}
      {view === 'by-venue' && (
        <div className="mt-4 space-y-6">
          {(() => {
            const venueMap = new Map<string, { name: string; programs: Program[] }>()
            const noVenue: Program[] = []
            for (const p of programs) {
              if (p.venues) {
                const existing = venueMap.get(p.venues.id)
                if (existing) {
                  existing.programs.push(p)
                } else {
                  venueMap.set(p.venues.id, { name: p.venues.name, programs: [p] })
                }
              } else {
                noVenue.push(p)
              }
            }
            return (
              <>
                {Array.from(venueMap.values()).map(({ name, programs: venuePrograms }) => (
                  <div key={name}>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                      <span className="text-sm text-muted-foreground">{venuePrograms.length} program{venuePrograms.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {venuePrograms.map((p) => <ProgramCard key={p.id} program={p} />)}
                    </div>
                  </div>
                ))}
                {noVenue.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">No venue assigned</h3>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {noVenue.map((p) => <ProgramCard key={p.id} program={p} />)}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
