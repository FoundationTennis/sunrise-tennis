'use client'

import { useState } from 'react'
import { generateCalendarToken, revokeCalendarToken } from '../actions'
import { Button } from '@/components/ui/button'
import { Calendar, Copy, Check, RefreshCw, Trash2 } from 'lucide-react'

export function CalendarSyncForm({ calendarToken }: { calendarToken: string | null }) {
  const [copied, setCopied] = useState(false)

  const feedUrl = calendarToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/feed?token=${calendarToken}`
    : null

  function handleCopy() {
    if (!feedUrl) return
    navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
            <Calendar className="size-3.5 text-primary" />
          </div>
          Calendar Sync
        </h2>
      </div>

      <div className="p-5">
        <p className="text-xs text-muted-foreground">
          Subscribe to your family&apos;s session schedule in Google Calendar, Apple Calendar, or Outlook.
        </p>

        {calendarToken && feedUrl ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground select-all"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-foreground">How to subscribe:</p>
              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                <li><strong>Google Calendar:</strong> Settings &rarr; Add calendar &rarr; From URL &rarr; paste link</li>
                <li><strong>Apple Calendar:</strong> File &rarr; New Calendar Subscription &rarr; paste link</li>
                <li><strong>Outlook:</strong> Add calendar &rarr; Subscribe from web &rarr; paste link</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <form action={generateCalendarToken}>
                <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw className="size-3.5" />
                  Regenerate link
                </Button>
              </form>
              <form action={revokeCalendarToken}>
                <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="size-3.5" />
                  Revoke
                </Button>
              </form>
            </div>

            <p className="text-[11px] text-muted-foreground">
              This link contains a private token. Anyone with this link can see your schedule. Regenerate or revoke if shared accidentally.
            </p>
          </div>
        ) : (
          <form action={generateCalendarToken} className="mt-4">
            <Button type="submit" size="sm" className="gap-1.5">
              <Calendar className="size-4" />
              Generate calendar link
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Creates a subscribable link that shows your enrolled sessions in your phone&apos;s calendar app.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
