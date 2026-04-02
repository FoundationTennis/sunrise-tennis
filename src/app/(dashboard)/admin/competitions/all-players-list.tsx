'use client'

import { useState, useMemo } from 'react'
import { Search, Users, LinkIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'

interface CompPlayer {
  id: string
  first_name: string
  last_name: string | null
  role: string
  registration_status: string
  player_id: string | null
  team_name: string
  team_division: string | null
  team_gender: string | null
  comp_name: string
  comp_type: string
}

type GroupMode = 'competition' | 'name'

// Competition sort order: JSL first, then Fri Juniors, then Sat Juniors, then Seniors
// Within each, divisions ordered highest first (Div 1 before Div 2)
function compSortKey(compName: string): number {
  const lower = compName.toLowerCase()
  if (lower.includes('jsl') || lower.includes('junior state league')) return 0
  if (lower.includes('fri') && lower.includes('junior')) return 1
  if (lower.includes('glenelg') || lower.includes('g&wd') || lower.includes('western district')) return 1
  if (lower.includes('sat') && lower.includes('junior')) return 2
  if (lower.includes('pennant') || lower.includes('senior')) return 3
  return 4
}

function divisionSortKey(division: string | null): number {
  if (!division) return 999
  const lower = division.toLowerCase()
  if (lower.includes('premier')) return 0
  if (lower.includes('a1')) return 1
  // Extract division number
  const match = lower.match(/(\d+)/)
  if (match) return parseInt(match[1], 10) + 1
  return 500
}

export function AllPlayersList({ players }: { players: CompPlayer[] }) {
  const [groupMode, setGroupMode] = useState<GroupMode>('competition')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return players
    const q = search.toLowerCase()
    return players.filter(
      (p) =>
        p.first_name.toLowerCase().includes(q) ||
        (p.last_name?.toLowerCase().includes(q) ?? false) ||
        p.team_name.toLowerCase().includes(q) ||
        p.comp_name.toLowerCase().includes(q),
    )
  }, [players, search])

  const grouped = useMemo(() => {
    if (groupMode === 'name') {
      // Group alphabetically by last name, then first name
      const sorted = [...filtered].sort((a, b) => {
        const lastA = (a.last_name ?? '').toLowerCase()
        const lastB = (b.last_name ?? '').toLowerCase()
        if (lastA !== lastB) return lastA.localeCompare(lastB)
        return a.first_name.toLowerCase().localeCompare(b.first_name.toLowerCase())
      })
      // Single flat group
      return [{ key: 'All Players', players: sorted }]
    }

    // Group by competition + division
    const groups = new Map<string, CompPlayer[]>()
    for (const p of filtered) {
      const key = `${p.comp_name} — ${p.team_name}`
      const arr = groups.get(key) ?? []
      arr.push(p)
      groups.set(key, arr)
    }

    // Sort groups by comp order, then division
    return Array.from(groups.entries())
      .sort(([keyA, playersA], [keyB, playersB]) => {
        const compA = playersA[0].comp_name
        const compB = playersB[0].comp_name
        const compOrder = compSortKey(compA) - compSortKey(compB)
        if (compOrder !== 0) return compOrder
        // Same comp — sort by division
        const divA = playersA[0].team_division
        const divB = playersB[0].team_division
        return divisionSortKey(divA) - divisionSortKey(divB)
      })
      .map(([key, groupPlayers]) => ({
        key,
        players: groupPlayers.sort((a, b) =>
          a.first_name.toLowerCase().localeCompare(b.first_name.toLowerCase()),
        ),
      }))
  }, [filtered, groupMode])

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">All Competition Players</h2>
        <div className="flex items-center gap-3">
          {/* Group toggle */}
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
            <button
              onClick={() => setGroupMode('competition')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${groupMode === 'competition' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              By Team
            </button>
            <button
              onClick={() => setGroupMode('name')}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${groupMode === 'name' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              By Name
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="h-8 w-48 rounded-lg border border-border bg-background pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {filtered.length} player{filtered.length !== 1 ? 's' : ''} across all competitions
      </p>

      <div className="mt-4 space-y-2">
        {grouped.map((group) => {
          const isCollapsed = collapsed.has(group.key)
          return (
            <div key={group.key} className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
              {/* Group header */}
              {groupMode === 'competition' && (
                <button
                  onClick={() => toggleCollapse(group.key)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                  <span>{group.key}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <Users className="size-3" />
                    {group.players.length}
                  </span>
                </button>
              )}

              {/* Player rows */}
              {!isCollapsed && (
                <div className={groupMode === 'competition' ? 'border-t border-border/50' : ''}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 text-xs text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">Player</th>
                        {groupMode === 'name' && (
                          <th className="px-4 py-2 text-left font-medium">Team</th>
                        )}
                        <th className="px-4 py-2 text-left font-medium">Role</th>
                        <th className="px-4 py-2 text-left font-medium">Registration</th>
                        <th className="px-4 py-2 text-left font-medium">Linked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.players.map((p) => (
                        <tr key={p.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2 font-medium text-foreground">
                            {p.first_name}{p.last_name ? ` ${p.last_name}` : ''}
                          </td>
                          {groupMode === 'name' && (
                            <td className="px-4 py-2 text-muted-foreground">
                              {p.comp_name} — {p.team_name}
                            </td>
                          )}
                          <td className="px-4 py-2">
                            <StatusBadge status={p.role} />
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge status={p.registration_status} />
                          </td>
                          <td className="px-4 py-2">
                            {p.player_id ? (
                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                <LinkIcon className="size-3" />
                                Linked
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {grouped.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No players found.</p>
        )}
      </div>
    </div>
  )
}
