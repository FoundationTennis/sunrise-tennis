'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatTime } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'
import { WeeklyCalendar, type CalendarEvent } from '@/components/weekly-calendar'
import { Calendar, List, Layers, Tag, Star, ChevronRight, Users } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LEVEL_COLORS: Record<string, string> = {
  red: 'bg-ball-red/20 border-ball-red/30',
  orange: 'bg-ball-orange/20 border-ball-orange/30',
  green: 'bg-ball-green/20 border-ball-green/30',
  yellow: 'bg-ball-yellow/20 border-ball-yellow/30',
  competitive: 'bg-primary/15 border-primary/30',
}

const LEVEL_ACCENTS: Record<string, { bar: string; bg: string; badge: string }> = {
  red:    { bar: 'bg-ball-red',    bg: 'bg-ball-red/5',    badge: 'bg-ball-red/10 text-ball-red border-ball-red/20' },
  orange: { bar: 'bg-ball-orange', bg: 'bg-ball-orange/5', badge: 'bg-ball-orange/10 text-ball-orange border-ball-orange/20' },
  green:  { bar: 'bg-ball-green',  bg: 'bg-ball-green/5',  badge: 'bg-ball-green/10 text-ball-green border-ball-green/20' },
  yellow: { bar: 'bg-ball-yellow', bg: 'bg-ball-yellow/5', badge: 'bg-ball-yellow/10 text-ball-yellow border-ball-yellow/20' },
  blue:   { bar: 'bg-ball-blue',   bg: 'bg-ball-blue/5',   badge: 'bg-ball-blue/10 text-ball-blue border-ball-blue/20' },
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
  term_fee_cents: number | null
  description: string | null
  program_roster: { id: string; player_id: string; status: string }[]
}

type Tab = 'recommended' | 'calendar' | 'list' | 'level' | 'type'

function ProgramCard({
  program,
  familyPlayerIds,
  index,
}: {
  program: Program
  familyPlayerIds: Set<string>
  index: number
}) {
  const roster = program.program_roster ?? []
  const enrolled = roster.filter((r) => r.status === 'enrolled')
  const familyEnrolled = enrolled.filter((r) => familyPlayerIds.has(r.player_id))
  const spotsLeft = program.max_capacity ? program.max_capacity - enrolled.length : null
  const accent = LEVEL_ACCENTS[program.level ?? ''] ?? { bar: 'bg-primary', bg: 'bg-primary/5', badge: 'bg-primary/10 text-primary border-primary/20' }

  return (
    <Link
      href={`/parent/programs/${program.id}`}
      className={`group relative block overflow-hidden rounded-xl border border-border ${accent.bg} p-5 shadow-card transition-all hover:shadow-elevated hover:scale-[1.01] animate-fade-up`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Level color accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${accent.bar}`} />

      <div className="pl-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{program.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {program.day_of_week != null && DAYS[program.day_of_week]}
              {program.start_time && ` · ${formatTime(program.start_time)}`}
              {program.end_time && ` – ${formatTime(program.end_time)}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 ml-3">
            <Badge variant="outline" className={`capitalize font-medium ${accent.badge}`}>{program.type}</Badge>
            {program.level && (
              <span className="text-xs capitalize text-muted-foreground">{program.level}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex gap-3 text-muted-foreground">
            {program.per_session_cents && <span className="font-medium">{formatCurrency(program.per_session_cents)}/session</span>}
            {program.term_fee_cents && <span className="font-medium">{formatCurrency(program.term_fee_cents)}/term</span>}
          </div>
          <div className="flex items-center gap-2">
            {spotsLeft !== null && (
              <span className={`flex items-center gap-1 ${spotsLeft <= 2 ? 'text-danger font-medium' : 'text-muted-foreground'}`}>
                <Users className="size-3" />
                {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
              </span>
            )}
            {familyEnrolled.length > 0 && (
              <Badge variant="outline" className="bg-success-light text-success border-success/20 font-medium">Enrolled</Badge>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

/**
 * Filter programs by level, including competition programs that span
 * multiple levels (e.g. "Red/Orange comp" shows under both red and orange).
 */
function filterByLevel(programs: Program[], level: string): Program[] {
  return programs.filter(p => {
    if (p.level === level) return true
    const nameLower = p.name.toLowerCase()
    return nameLower.includes(level.toLowerCase())
  })
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

  const levels = useMemo(() => {
    const lvls = new Set<string>()
    programs.forEach(p => {
      if (p.level) lvls.add(p.level)
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

  const recommended = useMemo(() => {
    const rec = programs.filter(p => playerLevelSet.has(p.level ?? ''))
    return rec.length > 0 ? rec : programs
  }, [programs, playerLevelSet])

  const filteredByLevel = levelFilter ? filterByLevel(programs, levelFilter) : programs
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
    { key: 'recommended', label: 'For You', icon: Star },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'list', label: 'All', icon: List },
    { key: 'level', label: 'Level', icon: Layers },
    { key: 'type', label: 'Type', icon: Tag },
  ]

  function ProgramGrid({ items }: { items: Program[] }) {
    if (items.length === 0) return <p className="mt-4 text-center text-sm text-muted-foreground">No programs match.</p>
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((p, i) => <ProgramCard key={p.id} program={p} familyPlayerIds={playerIds} index={i} />)}
      </div>
    )
  }

  return (
    <div>
      {/* Primary tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1 shadow-sm">
        {tabDefs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setLevelFilter(''); setTypeFilter('') }}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              tab === key
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
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
            <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No scheduled programs.</p>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div className="mt-4">
          <ProgramGrid items={programs} />
        </div>
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
          <ProgramGrid items={filteredByLevel} />
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
          <ProgramGrid items={filteredByType} />
        </div>
      )}
    </div>
  )
}
