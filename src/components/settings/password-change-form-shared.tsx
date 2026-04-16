'use client'

import { changePasswordSecure } from '@/lib/actions/account-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'

interface PasswordChangeFormSharedProps {
  redirectPath: string
}

export function PasswordChangeFormShared({ redirectPath }: PasswordChangeFormSharedProps) {
  return (
    <form action={changePasswordSecure}>
      <input type="hidden" name="redirect_path" value={redirectPath} />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border/60 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <Lock className="size-3.5 text-primary" />
            </div>
            Password
          </h2>
        </div>

        <div className="p-5">
          <p className="text-xs text-muted-foreground">
            Update your account password. You must enter your current password to confirm.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="current_password" className="text-xs">Current Password</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                required
                placeholder="Enter current password"
                className="mt-1"
                autoComplete="current-password"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="new_password" className="text-xs">New Password</Label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="mt-1"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm_password" className="text-xs">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  className="mt-1"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="submit" size="sm">Update Password</Button>
          </div>
        </div>
      </div>
    </form>
  )
}
