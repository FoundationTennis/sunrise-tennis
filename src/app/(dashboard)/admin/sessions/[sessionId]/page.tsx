import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OldSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  // Look up the session's program to redirect to the new URL
  const { data: session } = await supabase
    .from('sessions')
    .select('program_id')
    .eq('id', sessionId)
    .single()

  if (session?.program_id) {
    redirect(`/admin/programs/${session.program_id}/sessions/${sessionId}`)
  }

  // Fallback to programs page if no program associated
  redirect('/admin/programs')
}
