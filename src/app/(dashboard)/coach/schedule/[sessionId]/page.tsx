import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { CoachAttendanceForm } from './coach-attendance-form'
import { LessonNoteForm } from './lesson-note-form'

export default async function CoachSessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { sessionId } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch session details
  const { data: session } = await supabase
    .from('sessions')
    .select('*, programs:program_id(id, name, level, type), venues:venue_id(name), coaches:coach_id(name)')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <Link href="/coach/schedule" className="mt-2 text-sm text-orange-600 hover:text-orange-700">
          Back to schedule
        </Link>
      </div>
    )
  }

  const program = session.programs as unknown as { id: string; name: string; level: string; type: string } | null
  const venue = session.venues as unknown as { name: string } | null

  // Get roster and existing attendance + lesson notes
  const [{ data: rosterData }, { data: attendances }, { data: lessonNotes }] = await Promise.all([
    program?.id
      ? supabase
          .from('program_roster')
          .select('players:player_id(id, first_name, last_name, ball_color)')
          .eq('program_id', program.id)
          .eq('status', 'enrolled')
      : Promise.resolve({ data: null }),
    supabase
      .from('attendances')
      .select('player_id, status')
      .eq('session_id', sessionId),
    supabase
      .from('lesson_notes')
      .select('*, players:player_id(first_name, last_name)')
      .eq('session_id', sessionId)
      .order('created_at'),
  ])

  const roster = rosterData?.map(r => r.players as unknown as {
    id: string; first_name: string; last_name: string; ball_color: string | null
  }).filter(Boolean) ?? []

  const attendanceMap = new Map(
    attendances?.map(a => [a.player_id, a.status]) ?? []
  )

  return (
    <div>
      <Link href="/coach/schedule" className="text-sm text-orange-600 hover:text-orange-700">
        &larr; Back to schedule
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {program?.name ?? session.session_type}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {formatDate(session.date)}
          {session.start_time ? ` · ${formatTime(session.start_time)}` : ''}
          {session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
          {venue ? ` · ${venue.name}` : ''}
        </p>
        <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
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

      {/* Attendance */}
      {roster.length > 0 && session.status !== 'cancelled' && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
          <CoachAttendanceForm
            sessionId={sessionId}
            roster={roster}
            attendanceMap={Object.fromEntries(attendanceMap)}
          />
        </div>
      )}

      {/* Existing Lesson Notes */}
      {lessonNotes && lessonNotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Lesson Notes</h2>
          <div className="mt-3 space-y-3">
            {lessonNotes.map((note) => {
              const player = note.players as unknown as { first_name: string; last_name: string } | null
              return (
                <div key={note.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="font-medium text-gray-900">
                    {player?.first_name} {player?.last_name}
                  </p>
                  {note.focus && <p className="mt-1 text-sm text-gray-600"><strong>Focus:</strong> {note.focus}</p>}
                  {note.progress && <p className="mt-1 text-sm text-gray-600"><strong>Progress:</strong> {note.progress}</p>}
                  {note.drills_used && (note.drills_used as string[]).length > 0 && (
                    <p className="mt-1 text-sm text-gray-600">
                      <strong>Drills:</strong> {(note.drills_used as string[]).join(', ')}
                    </p>
                  )}
                  {note.next_plan && <p className="mt-1 text-sm text-gray-600"><strong>Next plan:</strong> {note.next_plan}</p>}
                  {note.video_url && (
                    <p className="mt-1 text-sm">
                      <a href={note.video_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">
                        Video link
                      </a>
                    </p>
                  )}
                  {note.notes && <p className="mt-1 text-sm text-gray-500">{note.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Lesson Note Form */}
      {session.status !== 'cancelled' && roster.length > 0 && (
        <div className="mt-8">
          <LessonNoteForm sessionId={sessionId} roster={roster} />
        </div>
      )}
    </div>
  )
}
