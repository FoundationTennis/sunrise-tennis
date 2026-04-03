'use client'

import { createSessionNote } from '../../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function SessionNoteForm({
  sessionId,
  existingNote,
}: {
  sessionId: string
  existingNote?: string
}) {
  const saveNote = createSessionNote.bind(null, sessionId)

  return (
    <form action={saveNote}>
      <h3 className="text-sm font-semibold text-foreground mb-1">Session Notes</h3>
      <p className="text-xs text-muted-foreground mb-2">Visible to you and admin only.</p>
      <Textarea
        name="session_notes"
        rows={3}
        defaultValue={existingNote ?? ''}
        placeholder="Overall session notes, observations, adjustments..."
      />
      <div className="mt-2 flex justify-end">
        <Button type="submit" size="sm">
          {existingNote ? 'Update notes' : 'Save notes'}
        </Button>
      </div>
    </form>
  )
}
