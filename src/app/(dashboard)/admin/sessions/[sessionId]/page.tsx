import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { AttendanceForm } from './attendance-form'
import { CancelSessionForm } from './cancel-session-form'
import { Suspense } from 'react'

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { sessionId } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*, programs:program_id(id, name, level, type), coaches:coach_id(name), venues:venue_id(name)')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  const program = session.programs as unknown as { id: string; name: string; level: string; type: string } | null
  const coach = session.coaches as unknown as { name: string } | null
  const venue = session.venues as unknown as { name: string } | null

  // Get roster for this program (the expected players)
  let rosterPlayers: { id: string; first_name: string; last_name: string }[] = []
  if (program?.id) {
    const { data: roster } = await supabase
      .from('program_roster')
      .select('players:player_id(id, first_name, last_name)')
      .eq('program_id', program.id)
      .eq('status', 'enrolled')

    rosterPlayers = roster?.map(r => r.players as unknown as { id: string; first_name: string; last_name: string }).filter(Boolean) ?? []
  }

  // Get existing attendance records
  const { data: attendances } = await supabase
    .from('attendances')
    .select('player_id, status, notes')
    .eq('session_id', sessionId)

  const attendanceMap = new Map(attendances?.map(a => [a.player_id, a.status]) ?? [])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/sessions" className="text-sm text-gray-500 hover:text-gray-700">&larr; Sessions</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">
          {program?.name ?? session.session_type} - {formatDate(session.date)}
        </h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          session.status === 'completed' ? 'bg-green-100 text-green-700' :
          session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {session.status}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 space-y-8">
        {/* Session info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Session Details</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Date</dt>
              <dd className="text-sm text-gray-900">{formatDate(session.date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Time</dt>
              <dd className="text-sm text-gray-900">
                {session.start_time ? formatTime(session.start_time) : '-'}
                {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Coach</dt>
              <dd className="text-sm text-gray-900">{coach?.name ?? 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Venue</dt>
              <dd className="text-sm text-gray-900">{venue?.name ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Type</dt>
              <dd className="text-sm capitalize text-gray-900">{session.session_type}</dd>
            </div>
            {program && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Program</dt>
                <dd className="text-sm text-gray-900">
                  <Link href={`/admin/programs/${program.id}`} className="text-orange-600 hover:text-orange-500">
                    {program.name}
                  </Link>
                </dd>
              </div>
            )}
            {session.cancellation_reason && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">Cancellation Reason</dt>
                <dd className="text-sm text-gray-900">{session.cancellation_reason}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Attendance */}
        {session.status !== 'cancelled' && rosterPlayers.length > 0 && (
          <Suspense>
            <AttendanceForm
              sessionId={sessionId}
              players={rosterPlayers}
              attendanceMap={Object.fromEntries(attendanceMap)}
            />
          </Suspense>
        )}

        {session.status !== 'cancelled' && rosterPlayers.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
            <p className="mt-2 text-sm text-gray-500">No players on the roster for this session.</p>
          </div>
        )}

        {/* Cancel session */}
        {session.status === 'scheduled' && (
          <Suspense>
            <CancelSessionForm sessionId={sessionId} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
