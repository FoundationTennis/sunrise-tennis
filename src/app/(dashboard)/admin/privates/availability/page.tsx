import { redirect } from 'next/navigation'

export default async function OldAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ coach_id?: string }>
}) {
  const { coach_id } = await searchParams
  const params = coach_id ? `?coach_id=${coach_id}` : ''
  redirect(`/admin/coaches/availability${params}`)
}
