import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils/dates'

export default async function CoachSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const coachId = coach?.id
  if (!coachId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="mt-4 text-sm text-gray-600">Coach profile not linked.</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const showPast = filter === 'past'

  let query = supabase
    .from('sessions')
    .select('*, programs:program_id(name, level, type), venues:venue_id(name)')
    .eq('coach_id', coachId)
    .order('date', { ascending: !showPast })
    .order('start_time')
    .limit(50)

  if (showPast) {
    query = query.lt('date', today)
  } else {
    query = query.gte('date', today)
  }

  const { data: sessions } = await query

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="mt-1 text-sm text-gray-600">Your assigned sessions.</p>
        </div>
        <Link
          href={showPast ? '/coach/schedule' : '/coach/schedule?filter=past'}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {showPast ? 'Upcoming' : 'Past sessions'}
        </Link>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Venue</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => {
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
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        session.status === 'completed' ? 'bg-green-100 text-green-700' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">
          {showPast ? 'No past sessions found.' : 'No upcoming sessions.'}
        </p>
      )}
    </div>
  )
}
