import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, getSessionUser } from '@/lib/supabase/server'
import { AvailabilityForm } from './availability-form'
import { respondToAvailability } from '../actions'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, AlertCircle, CheckCircle, Trophy, CalendarDays, Users, ChevronRight } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default async function ParentTeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { teamId } = await params
  const { error, success } = await searchParams
  const supabase = await createClient()

  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!userRole?.family_id) redirect('/parent')

  const { data: team } = await supabase
    .from('teams')
    .select('*, coaches:coach_id(name), competitions:competition_id(name, short_name, status, season)')
    .eq('id', teamId)
    .single()

  if (!team) notFound()

  const coach = team.coaches as unknown as { name: string } | null
  const competition = team.competitions as unknown as { name: string; short_name: string | null; status: string; season: string } | null

  // Get family's players on this team
  const { data: familyPlayers } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('family_id', userRole.family_id)

  const familyPlayerIds = familyPlayers?.map((p) => p.id) ?? []

  const { data: memberships } = await supabase
    .from('team_members')
    .select('player_id, role')
    .eq('team_id', teamId)
    .in('player_id', familyPlayerIds)

  const memberPlayerIds = memberships?.map((m) => m.player_id) ?? []

  // Get all availability for family's players (pending + responded)
  const { data: allFamilyAvailability } = memberPlayerIds.length > 0
    ? await supabase
        .from('availability')
        .select('*')
        .eq('team_id', teamId)
        .in('player_id', memberPlayerIds)
        .order('match_date')
    : { data: [] }

  // Get all team members for roster display
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('*, players:player_id(first_name, last_name, ball_color)')
    .eq('team_id', teamId)
    .order('role')

  // Get upcoming match availability for ALL team members (shows teammate status)
  const today = new Date().toISOString().split('T')[0]
  const allTeamPlayerIds = allMembers?.map((m) => m.player_id) ?? []
  const { data: teamAvailability } = allTeamPlayerIds.length > 0
    ? await supabase
        .from('availability')
        .select('player_id, match_date, status')
        .eq('team_id', teamId)
        .in('player_id', allTeamPlayerIds)
        .gte('match_date', today)
        .order('match_date')
    : { data: [] }

  // Group availability by match date for upcoming matches view
  const upcomingMatchDates = [...new Set(teamAvailability?.map((a) => a.match_date) ?? [])].sort()
  const matchAvailabilityMap = new Map<string, Map<string, string>>()
  teamAvailability?.forEach((a) => {
    if (!matchAvailabilityMap.has(a.match_date)) {
      matchAvailabilityMap.set(a.match_date, new Map())
    }
    matchAvailabilityMap.get(a.match_date)!.set(a.player_id, a.status)
  })

  const playersOnTeam = familyPlayers?.filter((p) => memberPlayerIds.includes(p.id)) ?? []
  const pendingChecks = allFamilyAvailability?.filter((a) => a.status === 'pending' || a.status === 'maybe') ?? []
  const respondedChecks = allFamilyAvailability?.filter((a) => a.status !== 'pending') ?? []
  const action = respondToAvailability.bind(null, teamId)

  const roleBadgeStyle: Record<string, string> = {
    captain: 'bg-warning-light text-warning border-warning/20',
    reserve: 'bg-muted text-muted-foreground border-border',
  }

  const availabilityIcon: Record<string, string> = {
    available: 'text-emerald-600',
    unavailable: 'text-red-500',
    maybe: 'text-amber-500',
    pending: 'text-muted-foreground',
  }

  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2B5EA7] via-[#6480A4] to-[#E87450] p-5 text-white shadow-elevated">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium text-white/70">
            <Link href="/parent/teams" className="hover:text-white transition-colors">Teams</Link>
            <ChevronRight className="size-3" />
            <span className="text-white/90">{team.name}</span>
          </div>
          <h1 className="mt-2 text-xl font-bold">{team.name}</h1>
          {competition && (
            <p className="mt-0.5 text-sm text-white/80">
              <Trophy className="mr-1 inline size-3.5 align-text-bottom" />
              {competition.short_name ?? competition.name}
              {team.division ? ` — ${team.division}` : ''}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
            {team.season && <span>Season: {team.season}</span>}
            {coach && <span>Coach: {coach.name}</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#C53030] px-4 py-3.5 text-sm font-medium text-white shadow-sm">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#2D8A4E] px-4 py-3.5 text-sm font-medium text-white shadow-sm">
          <CheckCircle className="size-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="mt-5 space-y-5">
        {/* Quick actions */}
        <div className="animate-fade-up flex gap-2" style={{ animationDelay: '60ms' }}>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/parent/teams/${teamId}/chat`}>
              <MessageSquare className="size-3.5" />
              Team Chat
            </Link>
          </Button>
        </div>

        {/* Availability response */}
        {pendingChecks.length > 0 && playersOnTeam.length > 0 && (
          <div className="animate-fade-up rounded-xl border border-primary/20 bg-primary/5 p-5" style={{ animationDelay: '80ms' }}>
            <h2 className="text-base font-semibold text-primary">Availability Check</h2>
            <p className="mt-0.5 text-sm text-primary/70">Please respond for each of your players.</p>
            <div className="mt-3">
              <AvailabilityForm
                players={playersOnTeam}
                pendingAvailability={pendingChecks}
                action={action}
              />
            </div>
          </div>
        )}

        {/* Upcoming Matches with team availability */}
        {upcomingMatchDates.length > 0 && (
          <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="pt-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <CalendarDays className="size-4 text-primary" />
                Upcoming Matches
              </h2>
              <div className="mt-3 space-y-3">
                {upcomingMatchDates.map((matchDate) => {
                  const playerStatuses = matchAvailabilityMap.get(matchDate)
                  const available = [...(playerStatuses?.values() ?? [])].filter((s) => s === 'available').length
                  const total = playerStatuses?.size ?? 0

                  return (
                    <div key={matchDate} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{formatMatchDate(matchDate)}</p>
                        <span className="text-xs text-muted-foreground">
                          {available}/{total} available
                        </span>
                      </div>
                      {/* Teammate availability dots */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {allMembers?.map((m) => {
                          const player = m.players as unknown as { first_name: string } | null
                          const status = playerStatuses?.get(m.player_id) ?? 'pending'
                          const isFamily = familyPlayerIds.includes(m.player_id)
                          return (
                            <span
                              key={m.id}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                                isFamily ? 'bg-[#FDD5D0] font-medium text-deep-navy' : 'bg-muted/50 text-muted-foreground'
                              }`}
                              title={`${player?.first_name}: ${status}`}
                            >
                              <span className={`size-1.5 rounded-full ${
                                status === 'available' ? 'bg-emerald-500' :
                                status === 'unavailable' ? 'bg-red-400' :
                                status === 'maybe' ? 'bg-amber-400' :
                                'bg-gray-300'
                              }`} />
                              {player?.first_name}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your responses history */}
        {respondedChecks.length > 0 && (
          <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold text-foreground">Your Responses</h2>
              <div className="mt-3 space-y-2">
                {respondedChecks.map((a) => {
                  const player = playersOnTeam.find((p) => p.id === a.player_id)
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="text-foreground">
                        {player?.first_name} — {formatMatchDate(a.match_date)}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full team roster */}
        {allMembers && allMembers.length > 0 && (
          <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
            <CardContent className="pt-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Users className="size-4 text-primary" />
                Team Roster
              </h2>
              <div className="mt-3 space-y-1.5">
                {allMembers.map((m) => {
                  const player = m.players as unknown as { first_name: string; last_name: string; ball_color: string | null }
                  const isFamily = familyPlayerIds.includes(m.player_id)
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        isFamily ? 'bg-[#FDD5D0]/40 font-medium' : ''
                      }`}
                    >
                      <span className="text-foreground">
                        {player?.first_name} {player?.last_name?.[0]}.
                      </span>
                      <Badge
                        variant="outline"
                        className={`capitalize text-[11px] ${roleBadgeStyle[m.role] ?? 'bg-info-light text-info border-info/20'}`}
                      >
                        {m.role}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
