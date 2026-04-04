'use client'

import { adminCompleteSession } from '../../../../actions'
import { Button } from '@/components/ui/button'

export function MarkCompleteForm({ sessionId }: { sessionId: string }) {
  const completeWithId = adminCompleteSession.bind(null, sessionId)

  return (
    <details className="rounded-xl border border-success/30 bg-card">
      <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-success">
        Mark session complete
      </summary>
      <form action={completeWithId} className="space-y-4 px-6 pb-6">
        <p className="text-sm text-muted-foreground">
          This marks the session as completed. Make sure attendance has been recorded first.
        </p>
        <Button type="submit" variant="default">
          Confirm complete
        </Button>
      </form>
    </details>
  )
}
