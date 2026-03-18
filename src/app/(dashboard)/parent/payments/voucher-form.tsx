'use client'

import { submitVoucher } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Ticket } from 'lucide-react'

export function VoucherForm() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
            <Ticket className="size-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Submit Sports Voucher</h3>
            <p className="text-xs text-muted-foreground">SA Active Kids or Get Active voucher - $100 credit</p>
          </div>
        </div>

        <form action={submitVoucher} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="voucher_code">Voucher code</Label>
            <input
              id="voucher_code"
              name="voucher_code"
              type="text"
              required
              placeholder="Enter your voucher code"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <Label htmlFor="voucher_type">Voucher type</Label>
            <select
              id="voucher_type"
              name="voucher_type"
              required
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="active_kids">Active Kids</option>
              <option value="get_active">Get Active</option>
            </select>
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Credit amount: </span>
            <span className="font-medium text-foreground">$100.00</span>
          </div>

          <Button type="submit" className="w-full">
            Submit Voucher
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
