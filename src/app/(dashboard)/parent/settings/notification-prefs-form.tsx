'use client'

import { updateNotificationPreferences } from '../actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bell } from 'lucide-react'

const OPTIONS = [
  { value: 'all', label: 'All sessions', description: 'Get reminders for every group and private session' },
  { value: 'first_week_and_privates', label: 'First week + privates', description: 'Private lessons always, group sessions only in the first week after enrolling' },
  { value: 'privates_only', label: 'Privates only', description: 'Only get reminders for private lessons' },
  { value: 'off', label: 'Off', description: 'No session reminders' },
] as const

export function NotificationPrefsForm({
  currentPref,
  preChargeHeadsUp,
}: {
  currentPref: string
  preChargeHeadsUp: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
            <Bell className="size-3.5 text-primary" />
          </div>
          Notifications
        </h2>
      </div>

      <form action={updateNotificationPreferences} className="p-5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session Reminders</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose when to receive push notification reminders the evening before sessions.
          </p>
          <div className="mt-3 space-y-2">
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
          </div>
        </div>

        <div className="border-t border-border/40 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing heads-up</h3>
          <Label className="mt-2 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary/30 has-[:checked]:bg-primary/5">
            <input
              type="checkbox"
              name="pre_charge_heads_up"
              defaultChecked={preChargeHeadsUp}
              className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Heads-up before a charge posts</span>
              <p className="text-xs text-muted-foreground">Get a push notification ~10 days before sessions add to your balance.</p>
            </div>
          </Label>
        </div>

        <div className="flex justify-end border-t border-border/40 pt-4">
          <Button type="submit" size="sm">Save preferences</Button>
        </div>
      </form>
    </div>
  )
}
