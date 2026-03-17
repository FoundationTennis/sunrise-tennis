import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { CreateSessionForm } from './create-session-form'
import { Suspense } from 'react'

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; filter?: string }>
}) {
  const { error, filter } = await searchParams
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const showPast = filter === 'past'

  // Fetch sessions
  let query = supabase
    .from('sessions')
    .select('*, programs:program_id(name, level, type), coaches:coach_id(name), venues:venue_id(name)')
    .order('date', { ascending: !showPast })
    .order('start_time')
    .limit(50)

  if (showPast) {
    query = query.lt('date', today)
  } else {
    query = query.gte('date', today)
  }

  const [{ data: sessions }, { data: programs }, { data: coaches }, { data: venues }] = await Promise.all([
    query,
    supabase.from('programs').select('id, name').eq('status', 'active').order('name'),
    supabase.from('coaches').select('id, name').eq('status', 'active').order('name'),
    supabase.from('venues').select('id, name').order('name'),
  ])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage sessions and mark attendance.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={showPast ? '/admin/sessions' : '/admin/sessions?filter=past'}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showPast ? 'Upcoming' : 'Past sessions'}
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Session list */}
      {sessions && sessions.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Coach</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Venue</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => {
                const program = session.programs as unknown as { name: string; level: string; type: string } | null
                const coach = session.coaches as unknown as { name: string } | null
                const venue = session.venues as unknown as { name: string } | null
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Link href={`/admin/sessions/${session.id}`} className="hover:text-orange-600">
                        {formatDate(session.date)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{program?.name ?? session.session_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {session.start_time ? formatTime(session.start_time) : '-'}
                      {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{coach?.name ?? '-'}</td>
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

      {/* Create session form */}
      <div className="mt-8">
        <Suspense>
          <CreateSessionForm
            programs={programs ?? []}
            coaches={coaches ?? []}
            venues={venues ?? []}
          />
        </Suspense>
      </div>
    </div>
  )
}
