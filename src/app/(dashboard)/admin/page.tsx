import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: familyCount },
    { count: playerCount },
    { count: programCount },
  ] = await Promise.all([
    supabase.from('families').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Manage clients, programs, and coaching operations.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Families" value={familyCount ?? 0} />
        <StatCard label="Players" value={playerCount ?? 0} />
        <StatCard label="Programs" value={programCount ?? 0} />
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="mt-2 text-sm text-gray-500">
          Client management, program setup, and more coming in the next build phase.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
