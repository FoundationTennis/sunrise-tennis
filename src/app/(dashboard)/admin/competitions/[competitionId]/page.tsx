import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { TeamWorkspace } from './team-workspace'

function formatDate(d: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ competitionId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { competitionId } = await params
  const { error, success } = await searchParams
  const supabase = await createClient()

  const [{ data: competition }, { data: teams }] = await Promise.all([
    supabase
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single(),
    supabase
      .from('teams')
      .select('*, coaches:coach_id(name)')
      .eq('competition_id', competitionId)
      .order('division')
      .order('name'),
  ])

  if (!competition) notFound()

  // Get players per team
  const teamIds = teams?.map((t) => t.id) ?? []
  const { data: allPlayers } = teamIds.length > 0
    ? await supabase
        .from('competition_players')
        .select('id, team_id, first_name, last_name, registration_status, role, player_id, sort_order')
        .in('team_id', teamIds)
        .order('sort_order')
        .order('first_name')
    : { data: [] }

  // Build team data for workspace
  const playersByTeam = new Map<string, typeof allPlayers>()
  allPlayers?.forEach((p) => {
    const arr = playersByTeam.get(p.team_id) ?? []
    arr.push(p)
    playersByTeam.set(p.team_id, arr)
  })

  const teamsWithPlayers = (teams ?? []).map((t) => {
    const coach = t.coaches as unknown as { name: string } | null
    return {
      id: t.id,
      name: t.name,
      division: t.division,
      gender: t.gender,
      age_group: t.age_group,
      team_size_required: t.team_size_required,
      nomination_status: t.nomination_status ?? 'draft',
      coach_name: coach?.name ?? null,
      players: (playersByTeam.get(t.id) ?? []).map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        role: p.role,
        registration_status: p.registration_status,
        player_id: p.player_id,
        sort_order: p.sort_order,
      })),
    }
  })

  return (
    <div>
      <PageHeader
        title={competition.name}
        description={competition.season}
        breadcrumbs={[{ label: 'Competitions', href: '/admin/competitions' }]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={competition.status ?? 'active'} />
            <Button asChild size="sm">
              <Link href={`/admin/competitions/${competitionId}/teams/new`}>
                <Plus className="size-4" />
                Add Team
              </Link>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success-light px-4 py-3 text-sm text-success">
          <CheckCircle className="size-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Key Dates */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold text-foreground">Key Dates</h2>
          <div className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Nominations Open</dt>
              <dd>{formatDate(competition.nomination_open)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Nominations Close</dt>
              <dd className="font-medium">{formatDate(competition.nomination_close)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Season</dt>
              <dd>{formatDate(competition.season_start)} — {formatDate(competition.season_end)}</dd>
            </div>
            {competition.finals_start && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Finals</dt>
                <dd>{formatDate(competition.finals_start)} — {formatDate(competition.finals_end)}</dd>
              </div>
            )}
          </div>
          {competition.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{competition.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Team Workspace */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Teams</h2>
          <p className="text-xs text-muted-foreground">
            Drag players between teams to move them
          </p>
        </div>
        {teamsWithPlayers.length > 0 ? (
          <TeamWorkspace competitionId={competitionId} initialTeams={teamsWithPlayers} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No teams yet. Add a team to get started.
          </p>
        )}
      </div>
    </div>
  )
}
