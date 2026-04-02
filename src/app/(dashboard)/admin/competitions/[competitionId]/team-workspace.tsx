'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import {
  Users,
  GripVertical,
  Trash2,
  LinkIcon,
  AlertTriangle,
  X,
  UserPlus,
  ArrowUpDown,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import {
  moveCompPlayer,
  removeCompPlayerDirect,
  deleteCompTeam,
  quickAddCompPlayer,
  updateCompPlayerOrder,
  updateCompPlayerUTRDirect,
} from '@/app/(dashboard)/admin/competitions/actions'

// ── Types ────────────────────────────────────────────────────────────

interface CompPlayer {
  id: string
  first_name: string
  last_name: string | null
  role: string
  registration_status: string
  player_id: string | null
  sort_order: number | null
  utr_rating_display: string | null
}

interface Team {
  id: string
  name: string
  division: string | null
  gender: string | null
  age_group: string | null
  team_size_required: number | null
  nomination_status: string
  coach_name: string | null
}

interface TeamWithPlayers extends Team {
  players: CompPlayer[]
}

interface ContactInfo {
  player_name: string
  family_name: string | null
  primary: { name?: string; phone?: string; role?: string } | null
  secondary: { name?: string; phone?: string; role?: string } | null
}

// ── Contact Popup ────────────────────────────────────────────────────

function ContactPopup({
  playerId,
  playerName,
  onClose,
}: {
  playerId: string
  playerName: string
  onClose: () => void
}) {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/admin/player-contact?playerId=${playerId}`)
      .then((r) => r.json())
      .then((data) => { setContact(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [playerId])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-background shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
        <span className="text-xs font-semibold text-foreground">{playerName}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="px-3 py-2">
        {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {!loading && !contact && <p className="text-xs text-muted-foreground">No contact found</p>}
        {!loading && contact && (
          <div className="space-y-1.5">
            {contact.primary && (
              <div>
                <p className="text-xs font-medium text-foreground">
                  {contact.primary.name}
                  {contact.primary.role && (
                    <span className="ml-1 font-normal text-muted-foreground capitalize">({contact.primary.role})</span>
                  )}
                </p>
                {contact.primary.phone && (
                  <a href={`tel:${contact.primary.phone}`} className="text-xs text-primary hover:underline">
                    {contact.primary.phone}
                  </a>
                )}
              </div>
            )}
            {contact.secondary && (contact.secondary.name || contact.secondary.phone) && (
              <div>
                <p className="text-xs font-medium text-foreground">
                  {contact.secondary.name}
                  {contact.secondary.role && (
                    <span className="ml-1 font-normal text-muted-foreground capitalize">({contact.secondary.role})</span>
                  )}
                </p>
                {contact.secondary.phone && (
                  <a href={`tel:${contact.secondary.phone}`} className="text-xs text-primary hover:underline">
                    {contact.secondary.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inline UTR Editor ────────────────────────────────────────────────

function UTREdit({
  compPlayerId,
  initialValue,
  onSaved,
}: {
  compPlayerId: string
  initialValue: string | null
  onSaved: (value: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')

  async function save() {
    setEditing(false)
    await updateCompPlayerUTRDirect(compPlayerId, value)
    onSaved(value.trim() || null)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1 text-xs"
      >
        <span className={initialValue ? 'font-mono font-medium text-foreground' : 'text-muted-foreground'}>
          {initialValue ?? '—'}
        </span>
        <Pencil className="size-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
      </button>
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
      className="h-5 w-14 rounded border border-primary bg-background px-1 text-xs font-mono focus:outline-none"
      autoFocus
    />
  )
}

// ── Sortable Player Card ─────────────────────────────────────────────

function SortablePlayerCard({
  player,
  competitionId,
  onRemove,
  onUTRSaved,
}: {
  player: CompPlayer
  competitionId: string
  onRemove: (playerId: string) => void
  onUTRSaved: (playerId: string, value: string | null) => void
}) {
  const [showContact, setShowContact] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const fullName = `${player.first_name}${player.last_name ? ` ${player.last_name}` : ''}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-2 text-sm hover:border-border transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Player name — clickable if linked */}
      <div className="relative flex-1 min-w-0">
        {player.player_id ? (
          <button
            onClick={() => setShowContact((v) => !v)}
            className="flex items-center gap-1 truncate font-medium text-foreground hover:text-primary transition-colors"
          >
            <LinkIcon className="size-2.5 text-success shrink-0" />
            <span className="truncate">{fullName}</span>
          </button>
        ) : (
          <span className="truncate font-medium text-foreground">{fullName}</span>
        )}

        {showContact && player.player_id && (
          <ContactPopup
            playerId={player.player_id}
            playerName={fullName}
            onClose={() => setShowContact(false)}
          />
        )}
      </div>

      {/* UTR */}
      <UTREdit
        compPlayerId={player.id}
        initialValue={player.utr_rating_display}
        onSaved={(v) => onUTRSaved(player.id, v)}
      />

      {/* Status dot + role */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`size-1.5 rounded-full ${
          player.registration_status === 'registered' ? 'bg-emerald-500' :
          player.registration_status === 'pending' ? 'bg-amber-400' : 'bg-gray-300'
        }`} />
        <span className="text-xs text-muted-foreground capitalize">{player.role.replace('_', ' ')}</span>
      </div>

      <button
        onClick={() => onRemove(player.id)}
        className="ml-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ── Dragging overlay card ────────────────────────────────────────────

function PlayerDragOverlay({ player }: { player: CompPlayer }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-background px-3 py-2 text-sm shadow-lg">
      <GripVertical className="size-3.5 text-muted-foreground" />
      <span className="font-medium">
        {player.first_name}{player.last_name ? ` ${player.last_name}` : ''}
      </span>
      {player.utr_rating_display && (
        <span className="ml-auto font-mono text-xs text-muted-foreground">{player.utr_rating_display}</span>
      )}
    </div>
  )
}

// ── Quick Add Player ─────────────────────────────────────────────────

function QuickAddPlayer({
  competitionId,
  teamId,
  onAdded,
}: {
  competitionId: string
  teamId: string
  onAdded: (player: CompPlayer) => void
}) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!firstName.trim()) return
    setLoading(true)
    const result = await quickAddCompPlayer(competitionId, teamId, firstName, lastName)
    setLoading(false)
    if (result.success && result.player) {
      onAdded({ ...result.player, utr_rating_display: null })
      setFirstName('')
      setLastName('')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
      >
        <UserPlus className="size-3" />
        Add Player
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs focus:border-primary focus:outline-none"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
      />
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last name"
        className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs focus:border-primary focus:outline-none"
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
      />
      <Button size="xs" onClick={handleAdd} disabled={loading || !firstName.trim()}>
        {loading ? '...' : 'Add'}
      </Button>
      <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ── Team Column ──────────────────────────────────────────────────────

function TeamColumn({
  team,
  competitionId,
  onRemovePlayer,
  onAddPlayer,
  onDeleteTeam,
  onUTRSaved,
  onSortByUTR,
}: {
  team: TeamWithPlayers
  competitionId: string
  onRemovePlayer: (teamId: string, playerId: string) => void
  onAddPlayer: (teamId: string, player: CompPlayer) => void
  onDeleteTeam: (teamId: string) => void
  onUTRSaved: (teamId: string, playerId: string, value: string | null) => void
  onSortByUTR: (teamId: string) => void
}) {
  const required = team.team_size_required ?? 0
  const gaps = required > 0 ? Math.max(0, required - team.players.length) : 0

  const { setNodeRef, isOver } = useDroppable({ id: `team-${team.id}` })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-card shadow-card transition-colors ${
        isOver ? 'border-primary/50 bg-primary/5' : 'border-border'
      }`}
    >
      {/* Team header */}
      <div className="flex items-start justify-between border-b border-border/50 px-4 py-3">
        <div>
          <h3 className="font-semibold text-foreground">{team.name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {team.division && <span>{team.division}</span>}
            {team.coach_name && <span>{team.coach_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSortByUTR(team.id)}
            title="Sort by UTR"
            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowUpDown className="size-3" />
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            {team.players.length}{required > 0 ? `/${required}` : ''}
          </span>
          <StatusBadge status={team.nomination_status} />
        </div>
      </div>

      {/* Column headers */}
      {team.players.length > 0 && (
        <div className="grid grid-cols-[1fr_auto] px-3 pt-2 pb-0.5 text-[10px] text-muted-foreground font-medium">
          <span className="pl-5">Player</span>
          <span className="pr-16">UTR</span>
        </div>
      )}

      {/* Player list (drop zone) */}
      <div className="flex-1 px-3 py-2 space-y-1.5 min-h-[80px]">
        <SortableContext
          items={team.players.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {team.players.map((player) => (
            <SortablePlayerCard
              key={player.id}
              player={player}
              competitionId={competitionId}
              onRemove={(playerId) => onRemovePlayer(team.id, playerId)}
              onUTRSaved={(playerId, value) => onUTRSaved(team.id, playerId, value)}
            />
          ))}
        </SortableContext>

        {gaps > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border border-dashed border-danger/30 bg-danger-light/30 px-3 py-1.5 text-xs text-danger">
            <AlertTriangle className="size-3" />
            {gaps} more player{gaps !== 1 ? 's' : ''} needed
          </div>
        )}

        {team.players.length === 0 && gaps === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground italic">
            Drop players here
          </p>
        )}
      </div>

      {/* Quick add + delete team */}
      <div className="border-t border-border/50 px-3 py-2 space-y-2">
        <QuickAddPlayer
          competitionId={competitionId}
          teamId={team.id}
          onAdded={(player) => onAddPlayer(team.id, player)}
        />
        {team.players.length === 0 && (
          <button
            onClick={() => onDeleteTeam(team.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-danger/70 hover:text-danger hover:bg-danger-light/30 transition-colors"
          >
            <Trash2 className="size-3" />
            Delete Team
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Workspace ───────────────────────────────────────────────────

export function TeamWorkspace({
  competitionId,
  initialTeams,
}: {
  competitionId: string
  initialTeams: TeamWithPlayers[]
}) {
  const [teams, setTeams] = useState(initialTeams)
  const [activePlayer, setActivePlayer] = useState<CompPlayer | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  function findTeamByPlayerId(playerId: string): TeamWithPlayers | undefined {
    return teams.find((t) => t.players.some((p) => p.id === playerId))
  }

  function handleDragStart(event: DragStartEvent) {
    const team = findTeamByPlayerId(event.active.id as string)
    const player = team?.players.find((p) => p.id === event.active.id)
    if (player) setActivePlayer(player)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceTeam = findTeamByPlayerId(activeId)
    let targetTeam: TeamWithPlayers | undefined

    if (overId.startsWith('team-')) {
      targetTeam = teams.find((t) => t.id === overId.replace('team-', ''))
    } else {
      targetTeam = findTeamByPlayerId(overId)
    }

    if (!sourceTeam || !targetTeam) return

    // Same-team reorder is handled in handleDragEnd
    if (sourceTeam.id === targetTeam.id) return

    // Cross-team: optimistically move player
    const player = sourceTeam.players.find((p) => p.id === activeId)
    if (!player) return

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === sourceTeam.id) {
          return { ...t, players: t.players.filter((p) => p.id !== activeId) }
        }
        if (t.id === targetTeam!.id) {
          if (overId.startsWith('team-') || !t.players.some((p) => p.id === overId)) {
            return { ...t, players: [...t.players, player] }
          }
          const overIndex = t.players.findIndex((p) => p.id === overId)
          const newPlayers = [...t.players]
          newPlayers.splice(overIndex, 0, player)
          return { ...t, players: newPlayers }
        }
        return t
      }),
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActivePlayer(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const currentTeam = findTeamByPlayerId(activeId)
    if (!currentTeam) return

    // Check if this was a same-team reorder
    const originalTeam = initialTeams.find((t) => t.players.some((p) => p.id === activeId))
    const isSameTeam = originalTeam?.id === currentTeam.id && !overId.startsWith('team-')

    if (isSameTeam && overId !== activeId) {
      // Reorder within team
      const oldIndex = currentTeam.players.findIndex((p) => p.id === activeId)
      const newIndex = currentTeam.players.findIndex((p) => p.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newPlayers = arrayMove(currentTeam.players, oldIndex, newIndex)
        setTeams((prev) =>
          prev.map((t) => (t.id === currentTeam.id ? { ...t, players: newPlayers } : t)),
        )
        await updateCompPlayerOrder(
          competitionId,
          currentTeam.id,
          newPlayers.map((p) => p.id),
        )
      }
    } else {
      // Cross-team move — persist
      const result = await moveCompPlayer(competitionId, activeId, currentTeam.id)
      if (result.error) {
        showToast('error', result.error)
        setTeams(initialTeams)
      }
    }
  }

  async function handleRemovePlayer(teamId: string, playerId: string) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, players: t.players.filter((p) => p.id !== playerId) } : t,
      ),
    )
    await removeCompPlayerDirect(competitionId, teamId, playerId)
  }

  function handleAddPlayer(teamId: string, player: CompPlayer) {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, players: [...t.players, player] } : t)),
    )
  }

  async function handleDeleteTeam(teamId: string) {
    const result = await deleteCompTeam(competitionId, teamId)
    if (result.error) {
      showToast('error', result.error)
    } else {
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
      showToast('success', 'Team deleted')
    }
  }

  function handleUTRSaved(teamId: string, playerId: string, value: string | null) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, players: t.players.map((p) => (p.id === playerId ? { ...p, utr_rating_display: value } : p)) }
          : t,
      ),
    )
  }

  function handleSortByUTR(teamId: string) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t
        const sorted = [...t.players].sort((a, b) => {
          const utrA = parseFloat(a.utr_rating_display ?? '0') || 0
          const utrB = parseFloat(b.utr_rating_display ?? '0') || 0
          return utrB - utrA // Descending (higher UTR first)
        })
        // Persist order
        updateCompPlayerOrder(competitionId, teamId, sorted.map((p) => p.id))
        return { ...t, players: sorted }
      }),
    )
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamColumn
              key={team.id}
              team={team}
              competitionId={competitionId}
              onRemovePlayer={handleRemovePlayer}
              onAddPlayer={handleAddPlayer}
              onDeleteTeam={handleDeleteTeam}
              onUTRSaved={handleUTRSaved}
              onSortByUTR={handleSortByUTR}
            />
          ))}
        </div>

        <DragOverlay>
          {activePlayer && <PlayerDragOverlay player={activePlayer} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
