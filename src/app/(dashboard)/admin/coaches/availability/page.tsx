import { createClient, requireAdmin } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { AdminAvailabilityManager } from '../../privates/availability/admin-availability-manager'

export default async function CoachAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; coach_id?: string }>
}) {
  const { error, coach_id: selectedCoachId } = await searchParams
  await requireAdmin()
  const supabase = await createClient()

  const { data: rawCoaches } = await supabase
    .from('coaches')
    .select('id, name, is_owner, status, hourly_rate')
    .eq('status', 'active')

  const coaches = (rawCoaches ?? [])
    .filter(c => ((c.hourly_rate as { private_rate_cents?: number } | null)?.private_rate_cents ?? 0) > 0)
    .sort((a, b) => {
      const rA = (a.hourly_rate as { private_rate_cents?: number } | null)?.private_rate_cents ?? 0
      const rB = (b.hourly_rate as { private_rate_cents?: number } | null)?.private_rate_cents ?? 0
      return rB - rA || a.name.localeCompare(b.name)
    })

  let windows = null
  let exceptions = null

  if (selectedCoachId) {
    const [windowsRes, exceptionsRes] = await Promise.all([
      supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', selectedCoachId)
        .order('day_of_week')
        .order('start_time'),
      supabase
        .from('coach_availability_exceptions')
        .select('*')
        .eq('coach_id', selectedCoachId)
        .gte('exception_date', new Date().toISOString().split('T')[0])
        .order('exception_date'),
    ])
    windows = windowsRes.data
    exceptions = exceptionsRes.data
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coach Availability"
        description="Set availability windows and exceptions for each coach"
        breadcrumbs={[{ label: 'Coaches', href: '/admin/coaches' }]}
      />

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          {decodeURIComponent(error)}
        </div>
      )}

      <AdminAvailabilityManager
        coaches={coaches ?? []}
        selectedCoachId={selectedCoachId ?? null}
        windows={windows}
        exceptions={exceptions}
      />
    </div>
  )
}
