import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { GraduationCap } from 'lucide-react'
import { ParentProgramFilters } from './program-filters'

export default async function ParentProgramsPage() {
  const supabase = await createClient()

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

  // Get family's players to know their levels
  const { data: players } = await supabase
    .from('players')
    .select('id, first_name, ball_color, level, status')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('first_name')

  const playerLevels = players?.map(p => p.ball_color).filter(Boolean) as string[] ?? []
  const playerIds = players?.map(p => p.id) ?? []

  // Get all active programs
  const { data: programs } = await supabase
    .from('programs')
    .select('*, program_roster(id, player_id, status)')
    .eq('status', 'active')
    .order('day_of_week')
    .order('start_time')

  return (
    <div>
      <PageHeader title="Available Programs" description="Browse and enrol in programs for your players." />

      {programs && programs.length > 0 ? (
        <div className="mt-6">
          <ParentProgramFilters
            programs={programs as never}
            playerLevels={playerLevels}
            familyPlayerIds={playerIds}
          />
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={GraduationCap}
            title="No programs available"
            description="Check back soon for new programs."
          />
        </div>
      )}
    </div>
  )
}
