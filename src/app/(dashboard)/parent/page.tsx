import { createClient } from '@/lib/supabase/server'

export default async function ParentDashboard() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('players')
    .select('id, first_name, last_name, ball_color, level')
    .order('first_name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Your children, sessions, and account overview.</p>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Your Players</h2>
        {players && players.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {players.map((player) => (
              <div key={player.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="font-medium text-gray-900">
                  {player.first_name} {player.last_name}
                </p>
                {player.ball_color && (
                  <p className="mt-1 text-sm text-gray-500 capitalize">{player.ball_color} ball</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No players linked to your account yet.</p>
        )}
      </div>
    </div>
  )
}
