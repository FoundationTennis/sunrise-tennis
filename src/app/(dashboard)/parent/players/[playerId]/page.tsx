import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils/dates'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function ParentPlayerDetailPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params
  const supabase = await createClient()

  // Verify parent owns this player via family_id
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

  // Fetch player (scoped to this family)
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .eq('family_id', familyId)
    .single()

  if (!player) notFound()

  // Fetch enrolled programs and recent lesson notes in parallel
  const [{ data: enrollments }, { data: lessonNotes }] = await Promise.all([
    supabase
      .from('program_roster')
      .select('id, status, enrolled_at, programs:program_id(id, name, type, level, day_of_week, start_time, end_time)')
      .eq('player_id', playerId)
      .eq('status', 'enrolled'),
    supabase
      .from('lesson_notes')
      .select('id, focus, notes, progress, next_plan, drills_used, video_url, created_at, sessions:session_id(date, programs:program_id(name))')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const currentFocus = player.current_focus as string[] | null

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/parent" className="text-sm text-gray-500 hover:text-gray-700">&larr; Overview</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{player.first_name} {player.last_name}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          player.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {player.status}
        </span>
      </div>

      <div className="mt-6 space-y-8">
        {/* Player Profile */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Player Profile</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Ball Colour</dt>
              <dd className="text-sm capitalize text-gray-900">{player.ball_color ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Level</dt>
              <dd className="text-sm capitalize text-gray-900">{player.level ?? '-'}</dd>
            </div>
            {player.dob && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Date of Birth</dt>
                <dd className="text-sm text-gray-900">{formatDate(player.dob)}</dd>
              </div>
            )}
            {currentFocus && currentFocus.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">Current Focus Areas</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {currentFocus.map((focus) => (
                    <span key={focus} className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                      {focus}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {player.short_term_goal && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">Short-Term Goal</dt>
                <dd className="text-sm text-gray-900">{player.short_term_goal}</dd>
              </div>
            )}
            {player.long_term_goal && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">Long-Term Goal</dt>
                <dd className="text-sm text-gray-900">{player.long_term_goal}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Enrolled Programs */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Enrolled Programs</h2>

          {enrollments && enrollments.length > 0 ? (
            <div className="mt-4 space-y-3">
              {enrollments.map((enrollment) => {
                const program = enrollment.programs as unknown as {
                  id: string; name: string; type: string; level: string;
                  day_of_week: number | null; start_time: string | null; end_time: string | null
                } | null
                if (!program) return null
                return (
                  <div key={enrollment.id} className="rounded-lg border border-gray-200 p-4">
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
                    {program.level && (
                      <p className="mt-1 text-xs capitalize text-gray-400">{program.level} level</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Not enrolled in any programs.</p>
          )}
        </div>

        {/* Lesson Notes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Lesson Notes</h2>

          {lessonNotes && lessonNotes.length > 0 ? (
            <div className="mt-4 space-y-4">
              {lessonNotes.map((note) => {
                const session = note.sessions as unknown as { date: string; programs: { name: string } | null } | null
                const drills = note.drills_used as string[] | null
                return (
                  <div key={note.id} className="border-l-2 border-orange-300 pl-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {session?.date ? formatDate(session.date) : 'Unknown date'}
                      </p>
                      {session?.programs?.name && (
                        <span className="text-xs text-gray-400">· {session.programs.name}</span>
                      )}
                    </div>
                    {note.focus && (
                      <p className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">Focus:</span> {note.focus}
                      </p>
                    )}
                    {note.notes && (
                      <p className="mt-1 text-sm text-gray-600">{note.notes}</p>
                    )}
                    {note.progress && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Progress:</span> {note.progress}
                      </p>
                    )}
                    {note.next_plan && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Next plan:</span> {note.next_plan}
                      </p>
                    )}
                    {drills && drills.length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">Drills: {drills.join(', ')}</p>
                    )}
                    {note.video_url && (
                      <a
                        href={note.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-orange-600 hover:text-orange-500"
                      >
                        Watch video &rarr;
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No lesson notes yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
