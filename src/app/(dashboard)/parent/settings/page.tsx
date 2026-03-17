import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContactInfoForm } from './contact-info-form'
import { MediaConsentForm } from './media-consent-form'

export default async function ParentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
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

  const [{ data: family }, { data: players }] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).single(),
    supabase.from('players').select('id, first_name, last_name, media_consent').eq('family_id', familyId).order('first_name'),
  ])

  if (!family) redirect('/parent')

  const primaryContact = family.primary_contact as { name?: string; phone?: string; email?: string } | null
  const secondaryContact = family.secondary_contact as { name?: string; phone?: string; email?: string } | null

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Family Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Update your contact details and preferences.</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 space-y-8">
        {/* Contact Information */}
        <ContactInfoForm
          primaryContact={primaryContact}
          secondaryContact={secondaryContact}
          address={family.address}
        />

        {/* Media Consent */}
        {players && players.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Media Consent</h2>
            <p className="mt-1 text-sm text-gray-500">
              Control whether photos and videos of your child may be used for coaching and promotional purposes.
            </p>
            <div className="mt-4 space-y-3">
              {players.map((player) => (
                <MediaConsentForm
                  key={player.id}
                  playerId={player.id}
                  playerName={`${player.first_name} ${player.last_name}`}
                  currentConsent={player.media_consent ?? false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
