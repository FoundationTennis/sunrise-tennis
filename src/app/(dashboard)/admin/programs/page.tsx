import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { GraduationCap, Plus } from 'lucide-react'
import { ProgramViews } from './program-views'

export default async function ProgramsPage() {
  const supabase = await createClient()

  const { data: programs } = await supabase
    .from('programs')
    .select('*, venues(id, name), program_roster(count)')
    .order('day_of_week')
    .order('start_time')

  return (
    <div>
      <PageHeader
        title="Programs"
        action={
          <Button asChild>
            <Link href="/admin/programs/new">
              <Plus className="size-4" />
              Add program
            </Link>
          </Button>
        }
      />

      {programs && programs.length > 0 ? (
        <div className="mt-6">
          <ProgramViews programs={programs as never} />
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={GraduationCap}
            title="No programs yet"
            description="Create your first program to start scheduling sessions."
            action={
              <Button asChild size="sm">
                <Link href="/admin/programs/new">Add program</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
