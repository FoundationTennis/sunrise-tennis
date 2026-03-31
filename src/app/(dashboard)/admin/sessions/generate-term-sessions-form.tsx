'use client'

import { generateTermSessions } from '../actions'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

export function GenerateTermSessionsForm() {
  return (
    <details className="rounded-xl border border-border bg-card shadow-sm">
      <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-foreground">
        <span className="inline-flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Generate Term Sessions
        </span>
      </summary>
      <form action={generateTermSessions} className="space-y-4 px-6 pb-6">
        <p className="text-sm text-muted-foreground">
          Creates one session per program per matching day within the selected school term.
          Skips public holidays and existing sessions.
        </p>
        <div className="flex items-end gap-4">
          <div>
            <Label htmlFor="term">Term</Label>
            <select
              id="term"
              name="term"
              defaultValue="2"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
              <option value="4">Term 4</option>
            </select>
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              name="year"
              defaultValue="2026"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
          <Button type="submit">
            <Zap className="size-4" />
            Generate
          </Button>
        </div>
      </form>
    </details>
  )
}
