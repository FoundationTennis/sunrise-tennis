import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatTime } from '@/lib/utils/dates'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function CoachProgramsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
        <p className="mt-4 text-sm text-gray-600">Coach profile not linked.</p>
      </div>
    )
  }

  // Get all programs assigned to this coach
  const { data: assignments } = await supabase
    .from('program_coaches')
    .select('role, programs:program_id(id, name, type, level, day_of_week, start_time, end_time, status, max_capacity)')
    .eq('coach_id', coachId)

  // Get roster counts for each program
  const programIds = assignments?.map(a => {
    const prog = a.programs as unknown as { id: string } | null
    return prog?.id
  }).filter(Boolean) as string[] ?? []

  const { data: rosterCounts } = programIds.length > 0
    ? await supabase
        .from('program_roster')
        .select('program_id')
        .in('program_id', programIds)
        .eq('status', 'enrolled')
    : { data: null }

  const countMap = new Map<string, number>()
  rosterCounts?.forEach(r => {
    countMap.set(r.program_id, (countMap.get(r.program_id) ?? 0) + 1)
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Programs</h1>
      <p className="mt-1 text-sm text-gray-600">Programs you are assigned to coach.</p>

      {assignments && assignments.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {assignments.map((assignment) => {
            const program = assignment.programs as unknown as {
              id: string; name: string; type: string; level: string;
              day_of_week: number | null; start_time: string | null; end_time: string | null;
              status: string; max_capacity: number | null
            } | null
            if (!program) return null

            const enrolled = countMap.get(program.id) ?? 0

            return (
              <div key={program.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium capitalize text-orange-700">
                      {program.type}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                      {assignment.role}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {program.day_of_week != null && DAYS[program.day_of_week]}
                  {program.start_time && ` · ${formatTime(program.start_time)}`}
                  {program.end_time && ` - ${formatTime(program.end_time)}`}
                </p>
                <p className="mt-1 text-sm text-gray-500 capitalize">
                  Level: {program.level}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Enrolled: {enrolled}{program.max_capacity ? ` / ${program.max_capacity}` : ''}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">You are not assigned to any programs yet.</p>
      )}
    </div>
  )
}
