import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils/dates'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function CoachDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get coach_id directly from coaches table (works for admin+coach users)
  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const coachId = coach?.id

  if (!coachId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
        <p className="mt-4 text-sm text-gray-600">
          Your account hasn&apos;t been linked to a coach profile yet. Please contact an admin.
        </p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  // Fetch today's sessions and upcoming sessions
  const [{ data: todaySessions }, { data: upcomingSessions }, { data: coachProfile }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, programs:program_id(name, level, type), venues:venue_id(name)')
      .eq('coach_id', coachId)
      .eq('date', today)
      .order('start_time'),
    supabase
      .from('sessions')
      .select('*, programs:program_id(name, level, type), venues:venue_id(name)')
      .eq('coach_id', coachId)
      .gt('date', today)
      .eq('status', 'scheduled')
      .order('date')
      .order('start_time')
      .limit(10),
    supabase
      .from('coaches')
      .select('name')
      .eq('id', coachId)
      .single(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {coachProfile?.name ?? 'Coach'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {DAYS[new Date().getDay()]}, {formatDate(new Date())}
      </p>

      {/* Today's Sessions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Sessions</h2>

        {todaySessions && todaySessions.length > 0 ? (
          <div className="mt-3 grid gap-3">
            {todaySessions.map((session) => {
              const program = session.programs as unknown as { name: string; level: string; type: string } | null
              const venue = session.venues as unknown as { name: string } | null
              return (
                <Link
                  key={session.id}
                  href={`/coach/schedule/${session.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{program?.name ?? session.session_type}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {session.start_time ? formatTime(session.start_time) : ''}
                        {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                        {venue ? ` · ${venue.name}` : ''}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      session.status === 'completed' ? 'bg-green-100 text-green-700' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No sessions scheduled for today.</p>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
          <Link
            href="/coach/schedule"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            View all
          </Link>
        </div>

        {upcomingSessions && upcomingSessions.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingSessions.map((session) => {
                  const program = session.programs as unknown as { name: string; level: string; type: string } | null
                  const venue = session.venues as unknown as { name: string } | null
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <Link href={`/coach/schedule/${session.id}`} className="hover:text-orange-600">
                          {formatDate(session.date)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{program?.name ?? session.session_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {session.start_time ? formatTime(session.start_time) : '-'}
                        {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{venue?.name ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No upcoming sessions.</p>
        )}
      </div>
    </div>
  )
}
