'use client'

import { updateNotificationPreferences } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const OPTIONS = [
  { value: 'all', label: 'All sessions', description: 'Get reminders for every group and private session' },
  { value: 'first_week_and_privates', label: 'First week + privates', description: 'Private lessons always, group sessions only in the first week after enrolling' },
  { value: 'privates_only', label: 'Privates only', description: 'Only get reminders for private lessons' },
  { value: 'off', label: 'Off', description: 'No session reminders' },
] as const

export function NotificationPrefsForm({ currentPref }: { currentPref: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold text-foreground">Session Reminders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose when to receive push notification reminders the evening before sessions.
        </p>

        <form action={updateNotificationPreferences} className="mt-4 space-y-3">
          {OPTIONS.map((option) => (
            <Label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary/30 has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="session_reminders"
                value={option.value}
                defaultChecked={currentPref === option.value}
                className="mt-0.5 size-4 border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </Label>
          ))}

          <Button type="submit" size="sm" className="mt-2">
            Save preference
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
