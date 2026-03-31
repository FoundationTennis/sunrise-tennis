'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown, Search } from 'lucide-react'

interface PlayerRow {
  id: string
  firstName: string
  lastName: string
  preferredName: string | null
  dob: string | null
  ballColor: string | null
  level: string | null
  gender: string | null
  status: string
  mediaConsent: boolean | null
  compInterest: string | null
  familyId: string
  familyDisplayId: string
  familyName: string
  programs: string[]
  comps: { compName: string; teamName: string; role: string; regStatus: string; utr: string | null; compId: string }[]
  utr: string | null
}

type SortKey = 'firstName' | 'lastName' | 'dob' | 'age' | 'ballColor' | 'family' | 'utr' | 'compStatus'

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

const BALL_ORDER: Record<string, number> = { blue: 0, red: 1, orange: 2, green: 3, yellow: 4, competitive: 5 }

export function PlayersTable({ players }: { players: PlayerRow[] }) {
  const [search, setSearch] = useState('')
  const [ballFilter, setBallFilter] = useState('')
  const [compFilter, setCompFilter] = useState<'all' | 'in_comp' | 'not_in_comp'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('lastName')
  const [sortAsc, setSortAsc] = useState(true)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const filtered = useMemo(() => {
    let list = players

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.preferredName?.toLowerCase().includes(q)) ||
        p.familyName.toLowerCase().includes(q) ||
        p.familyDisplayId.toLowerCase().includes(q)
      )
    }

    if (ballFilter) {
      list = list.filter(p => p.ballColor === ballFilter)
    }

    if (compFilter === 'in_comp') {
      list = list.filter(p => p.comps.length > 0)
    } else if (compFilter === 'not_in_comp') {
      list = list.filter(p => p.comps.length === 0)
    }

    return list
  }, [players, search, ballFilter, compFilter])

  const sorted = useMemo(() => {
    const dir = sortAsc ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'firstName':
          return dir * a.firstName.localeCompare(b.firstName)
        case 'lastName':
          return dir * a.lastName.localeCompare(b.lastName)
        case 'dob': {
          const aDate = a.dob ?? ''
          const bDate = b.dob ?? ''
          return dir * aDate.localeCompare(bDate)
        }
        case 'age': {
          const aAge = calcAge(a.dob) ?? 999
          const bAge = calcAge(b.dob) ?? 999
          return dir * (aAge - bAge)
        }
        case 'ballColor': {
          const aOrd = BALL_ORDER[a.ballColor ?? ''] ?? 99
          const bOrd = BALL_ORDER[b.ballColor ?? ''] ?? 99
          return dir * (aOrd - bOrd)
        }
        case 'family':
          return dir * a.familyDisplayId.localeCompare(b.familyDisplayId)
        case 'utr': {
          const aUtr = parseFloat(a.utr ?? '0') || 0
          const bUtr = parseFloat(b.utr ?? '0') || 0
          return dir * (aUtr - bUtr)
        }
        case 'compStatus': {
          return dir * (a.comps.length - b.comps.length)
        }
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortAsc])

  const SortHeader = ({ label, sortId }: { label: string; sortId: SortKey }) => (
    <button
      onClick={() => toggleSort(sortId)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <ArrowUpDown className={`size-3 ${sortKey === sortId ? 'text-primary' : 'text-muted-foreground/50'}`} />
    </button>
  )

  const selectClasses = 'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or family..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select value={ballFilter} onChange={(e) => setBallFilter(e.target.value)} className={selectClasses}>
          <option value="">All levels</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="orange">Orange</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="competitive">Competitive</option>
        </select>
        <select value={compFilter} onChange={(e) => setCompFilter(e.target.value as typeof compFilter)} className={selectClasses}>
          <option value="all">All players</option>
          <option value="in_comp">In a comp</option>
          <option value="not_in_comp">Not in comp</option>
        </select>
        <span className="text-sm text-muted-foreground">{sorted.length} players</span>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {sorted.map((p) => (
          <Link
            key={p.id}
            href={`/admin/families/${p.familyId}/players/${p.id}`}
            className="block rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-muted-foreground">{p.familyDisplayId} - {p.familyName}</p>
              </div>
              {p.ballColor && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{p.ballColor}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {p.dob && <span>Age {calcAge(p.dob)}</span>}
              {p.utr && <span>UTR {p.utr}</span>}
              {p.comps.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                  {p.comps.map(c => c.compName).join(', ')}
                </span>
              )}
              {p.programs.length > 0 && <span>{p.programs.length} program{p.programs.length > 1 ? 's' : ''}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-hidden rounded-lg border border-border bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead><SortHeader label="First Name" sortId="firstName" /></TableHead>
              <TableHead><SortHeader label="Last Name" sortId="lastName" /></TableHead>
              <TableHead><SortHeader label="DOB" sortId="dob" /></TableHead>
              <TableHead><SortHeader label="Age" sortId="age" /></TableHead>
              <TableHead><SortHeader label="Ball Colour" sortId="ballColor" /></TableHead>
              <TableHead><SortHeader label="Family" sortId="family" /></TableHead>
              <TableHead>Programs</TableHead>
              <TableHead><SortHeader label="UTR" sortId="utr" /></TableHead>
              <TableHead><SortHeader label="Comp" sortId="compStatus" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/admin/families/${p.familyId}/players/${p.id}`} className="font-medium hover:text-primary transition-colors">
                    {p.firstName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/families/${p.familyId}/players/${p.id}`} className="hover:text-primary transition-colors">
                    {p.lastName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums text-xs">
                  {p.dob ? new Date(p.dob).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </TableCell>
                <TableCell className="tabular-nums">{calcAge(p.dob) ?? '-'}</TableCell>
                <TableCell>
                  {p.ballColor ? (
                    <span className="capitalize">{p.ballColor}</span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/families/${p.familyId}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {p.familyDisplayId}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[150px] text-xs text-muted-foreground">
                  <span className="line-clamp-1">{p.programs.length > 0 ? p.programs.join(', ') : '-'}</span>
                </TableCell>
                <TableCell className="tabular-nums">{p.utr ?? '-'}</TableCell>
                <TableCell>
                  {p.comps.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.comps.map((c, i) => (
                        <Link
                          key={i}
                          href={`/admin/competitions/${c.compId}`}
                          className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                          {c.compName}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
