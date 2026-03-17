import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { EnrolForm } from './enrol-form'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function ParentProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { programId } = await params
  const { error, success } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  const familyId = userRole?.family_id
  if (!familyId) redirect('/parent')

  // Fetch program, family players, and roster in parallel
  const [
    { data: program },
    { data: players },
    { data: roster },
    { data: upcomingSessions },
  ] = await Promise.all([
    supabase.from('programs').select('*, venues:venue_id(name, address)').eq('id', programId).single(),
    supabase.from('players').select('id, first_name, last_name, ball_color, level, status').eq('family_id', familyId).eq('status', 'active').order('first_name'),
    supabase.from('program_roster').select('id, player_id, status').eq('program_id', programId),
    supabase.from('sessions').select('id, date, start_time, end_time, status')
      .eq('program_id', programId)
      .gte('date', new Date().toISOString().split('T')[0])
      .eq('status', 'scheduled')
      .order('date')
      .limit(8),
  ])

  if (!program) notFound()

  const venue = program.venues as unknown as { name: string; address: string | null } | null
  const enrolledPlayerIds = new Set(
    roster?.filter(r => r.status === 'enrolled').map(r => r.player_id) ?? []
  )
  const totalEnrolled = roster?.filter(r => r.status === 'enrolled').length ?? 0
  const spotsLeft = program.max_capacity ? program.max_capacity - totalEnrolled : null

  // Players eligible to enrol (not already enrolled)
  const eligiblePlayers = players?.filter(p => !enrolledPlayerIds.has(p.id)) ?? []
  // Players already enrolled
  const enrolledPlayers = players?.filter(p => enrolledPlayerIds.has(p.id)) ?? []

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/parent/programs" className="text-sm text-gray-500 hover:text-gray-700">&larr; Programs</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="mt-6 space-y-6">
        {/* Program Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium capitalize text-orange-700">
              {program.type}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
              {program.level}
            </span>
          </div>

          {program.description && (
            <p className="mt-3 text-sm text-gray-600">{program.description}</p>
          )}

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Schedule</dt>
              <dd className="text-sm text-gray-900">
                {program.day_of_week != null ? DAYS[program.day_of_week] : '-'}
                {program.start_time && ` · ${formatTime(program.start_time)}`}
                {program.end_time && ` - ${formatTime(program.end_time)}`}
              </dd>
            </div>
            {venue && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Venue</dt>
                <dd className="text-sm text-gray-900">{venue.name}</dd>
              </div>
            )}
            {program.per_session_cents && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Per Session</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(program.per_session_cents)}</dd>
              </div>
            )}
            {program.term_fee_cents && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Term Fee</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(program.term_fee_cents)}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500">Capacity</dt>
              <dd className="text-sm text-gray-900">
                {totalEnrolled}{program.max_capacity ? ` / ${program.max_capacity}` : ''} enrolled
                {spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0 && (
                  <span className="ml-2 text-xs font-medium text-red-500">({spotsLeft} spots left)</span>
                )}
                {spotsLeft === 0 && (
                  <span className="ml-2 text-xs font-medium text-red-500">(Full)</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Enrolled Players */}
        {enrolledPlayers.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h2 className="text-lg font-semibold text-green-800">Already Enrolled</h2>
            <div className="mt-3 space-y-2">
              {enrolledPlayers.map((player) => (
                <div key={player.id} className="flex items-center gap-2 text-sm text-green-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  {player.first_name} {player.last_name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrol Form */}
        {eligiblePlayers.length > 0 && (spotsLeft === null || spotsLeft > 0) && (
          <EnrolForm
            programId={programId}
            familyId={familyId}
            players={eligiblePlayers.map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, level: p.ball_color }))}
            programLevel={program.level}
          />
        )}

        {eligiblePlayers.length === 0 && enrolledPlayers.length > 0 && (
          <p className="text-sm text-gray-500">All your players are already enrolled in this program.</p>
        )}

        {spotsLeft === 0 && eligiblePlayers.length > 0 && (
          <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
            This program is currently full. Contact your coach if you&apos;d like to be added to a waitlist.
          </div>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions && upcomingSessions.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
            <div className="mt-3 space-y-2">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm">
                  <span className="text-gray-900">{formatDate(session.date)}</span>
                  <span className="text-gray-500">
                    {session.start_time ? formatTime(session.start_time) : '-'}
                    {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
