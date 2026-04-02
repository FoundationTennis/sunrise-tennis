import { NextRequest, NextResponse } from 'next/server'
import { createClient, requireAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const playerId = request.nextUrl.searchParams.get('playerId')?.trim()
  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: player, error } = await supabase
    .from('players')
    .select('first_name, last_name, families:family_id(family_name, primary_contact, secondary_contact)')
    .eq('id', playerId)
    .single()

  if (error || !player) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const family = player.families as unknown as {
    family_name: string
    primary_contact: { name?: string; phone?: string; email?: string; role?: string } | null
    secondary_contact: { name?: string; phone?: string; email?: string; role?: string } | null
  } | null

  return NextResponse.json({
    player_name: `${player.first_name} ${player.last_name ?? ''}`.trim(),
    family_name: family?.family_name ?? null,
    primary: family?.primary_contact
      ? { name: family.primary_contact.name, phone: family.primary_contact.phone, role: family.primary_contact.role }
      : null,
    secondary: family?.secondary_contact
      ? { name: family.secondary_contact.name, phone: family.secondary_contact.phone, role: family.secondary_contact.role }
      : null,
  })
}
