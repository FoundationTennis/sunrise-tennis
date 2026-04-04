'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { waiveChargeAction } from '@/app/(dashboard)/admin/payments/actions'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function StatementWaiveButton({ chargeId }: { chargeId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleWaive() {
    setPending(true)
    try {
      await waiveChargeAction(chargeId, 'Admin waiver (statement)')
      router.refresh()
    } catch {
      // Action redirects on error
    } finally {
      setPending(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button size="xs" variant="destructive" disabled={pending} onClick={handleWaive}>
          {pending ? '...' : 'Confirm'}
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setConfirming(false)}>
          <X className="size-3" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="xs"
      variant="ghost"
      className="text-xs text-muted-foreground hover:text-danger"
      onClick={() => setConfirming(true)}
    >
      Waive
    </Button>
  )
}
