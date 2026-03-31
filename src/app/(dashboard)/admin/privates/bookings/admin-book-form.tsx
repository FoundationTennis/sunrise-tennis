'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminBookPrivate } from '../actions'

interface Family {
  id: string
  display_id: string
  family_name: string
}

interface Coach {
  id: string
  name: string
  rate: number
}

interface Props {
  families: Family[]
  coaches: Coach[]
}

export function AdminBookForm({ families, coaches }: Props) {
  const [showForm, setShowForm] = useState(false)

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} size="sm">
        Book Private on Behalf
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold text-foreground">Book Private Lesson</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Book a private lesson on behalf of a parent. Auto-confirmed.
        </p>
        <form action={adminBookPrivate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="family_id" className="text-xs">Family</Label>
            <select id="family_id" name="family_id" required className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select family...</option>
              {families.map(f => (
                <option key={f.id} value={f.id}>{f.display_id} - {f.family_name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="coach_id" className="text-xs">Coach</Label>
            <select id="coach_id" name="coach_id" required className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select coach...</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.name} - ${(c.rate / 100).toFixed(0)}/hr</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="player_name" className="text-xs">Player Name</Label>
            <Input id="player_name" name="player_name" required placeholder="First name of player" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="date" className="text-xs">Date</Label>
            <Input id="date" name="date" type="date" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="start_time" className="text-xs">Start Time</Label>
            <Input id="start_time" name="start_time" type="time" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="duration" className="text-xs">Duration</Label>
            <select id="duration" name="duration_minutes" required className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" size="sm">Book & Confirm</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
