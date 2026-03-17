'use client'

import { updatePlayerDetails } from '../../actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ParentPlayerEditForm({
  player,
}: {
  player: {
    id: string
    first_name: string
    last_name: string
    dob: string | null
    medical_notes: string | null
    media_consent: boolean | null
  }
}) {
  const updateWithId = updatePlayerDetails.bind(null, player.id)

  return (
    <details className="rounded-xl border border-border bg-card shadow-sm">
      <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-foreground">
        Edit Player Details
      </summary>
      <form action={updateWithId} className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" name="first_name" type="text" required defaultValue={player.first_name} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" type="text" required defaultValue={player.last_name} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" name="dob" type="date" defaultValue={player.dob ?? ''} className="mt-1" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              id="media_consent"
              name="media_consent"
              type="checkbox"
              defaultChecked={player.media_consent ?? false}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label htmlFor="media_consent" className="cursor-pointer">
              Allow photos and videos
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="medical_notes">Medical notes</Label>
            <Textarea id="medical_notes" name="medical_notes" rows={2} defaultValue={player.medical_notes ?? ''} placeholder="Allergies, injuries, conditions..." className="mt-1" />
          </div>
        </div>
        <Button type="submit">Save changes</Button>
      </form>
    </details>
  )
}
