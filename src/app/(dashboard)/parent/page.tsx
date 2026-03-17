import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, formatTime } from '@/lib/utils/dates'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function ParentDashboard() {
  const supabase = await createClient()

  // Get current user and their family_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  const familyId = userRole?.family_id
  if (!familyId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="mt-4 text-sm text-gray-600">
          No family account linked. This is how parents see their dashboard once invited.
        </p>
      </div>
    )
  }

  // Fetch all family data in parallel
  const [
    { data: family },
    { data: players },
    { data: balance },
    { data: enrollments },
  ] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).single(),
    supabase.from('players').select('*').eq('family_id', familyId).order('first_name'),
    supabase.from('family_balance').select('balance_cents').eq('family_id', familyId).single(),
    supabase
      .from('program_roster')
      .select('id, status, players!inner(id, first_name), programs:program_id(id, name, type, level, day_of_week, start_time, end_time, status)')
      .eq('status', 'enrolled')
      .in('player_id', (await supabase.from('players').select('id').eq('family_id', familyId)).data?.map(p => p.id) ?? []),
  ])

  const contact = family?.primary_contact as { name?: string; phone?: string; email?: string } | null
  const balanceCents = balance?.balance_cents ?? 0

  // Get upcoming sessions for enrolled programs
  const programIds = enrollments?.map(e => {
    const prog = e.programs as unknown as { id: string } | null
    return prog?.id
  }).filter(Boolean) as string[] ?? []

  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingSessions } = programIds.length > 0
    ? await supabase
        .from('sessions')
        .select('id, date, start_time, end_time, status, programs:program_id(name, level, type)')
        .in('program_id', programIds)
        .gte('date', today)
        .eq('status', 'scheduled')
        .order('date')
        .order('start_time')
        .limit(10)
    : { data: null }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {contact?.name?.split(' ')[0] ?? 'Parent'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{family?.family_name} family account</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${
          balanceCents < 0 ? 'border-red-200 bg-red-50' :
          balanceCents > 0 ? 'border-green-200 bg-green-50' :
          'border-gray-200 bg-white'
        }`}>
          <p className="text-xs font-medium text-gray-500">Account Balance</p>
          <p className={`text-2xl font-bold ${
            balanceCents < 0 ? 'text-red-600' :
            balanceCents > 0 ? 'text-green-600' :
            'text-gray-900'
          }`}>
            {formatCurrency(balanceCents)}
          </p>
        </div>
      </div>

      {/* Players */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Your Players</h2>

        {players && players.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/parent/players/${player.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {player.first_name} {player.last_name}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {player.ball_color && <span className="capitalize">{player.ball_color} ball</span>}
                      {player.ball_color && player.level && ' · '}
                      {player.level && <span className="capitalize">{player.level}</span>}
                    </p>
                    {player.current_focus && (player.current_focus as string[]).length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        Focus: {(player.current_focus as string[]).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    player.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {player.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No players linked to your account yet.</p>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>

        {upcomingSessions && upcomingSessions.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingSessions.map((session) => {
                  const program = session.programs as unknown as { name: string; level: string; type: string } | null
                  return (
                    <tr key={session.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(session.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{program?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {session.start_time ? formatTime(session.start_time) : '-'}
                        {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        {program?.level && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium capitalize text-orange-700">
                            {program.level}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No upcoming sessions scheduled.</p>
        )}
      </div>

      {/* Enrolled Programs */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Enrolled Programs</h2>

        {enrollments && enrollments.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {enrollments.map((enrollment) => {
              const program = enrollment.programs as unknown as {
                id: string; name: string; type: string; level: string;
                day_of_week: number | null; start_time: string | null; end_time: string | null; status: string
              } | null
              const player = enrollment.players as unknown as { id: string; first_name: string } | null
              if (!program) return null
              return (
                <div key={enrollment.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{program.name}</p>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium capitalize text-orange-700">
                      {program.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {program.day_of_week != null && DAYS[program.day_of_week]}
                    {program.start_time && ` · ${formatTime(program.start_time)}`}
                    {program.end_time && ` - ${formatTime(program.end_time)}`}
                  </p>
                  {player && (
                    <p className="mt-1 text-xs text-gray-400">Player: {player.first_name}</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No program enrolments yet.</p>
        )}
      </div>
    </div>
  )
}
