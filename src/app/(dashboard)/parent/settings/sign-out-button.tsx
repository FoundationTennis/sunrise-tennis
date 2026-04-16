'use client'

import { signout } from '@/app/(auth)/actions'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <div className="overflow-hidden rounded-xl border border-danger/20 bg-danger-light/20 shadow-card">
      <div className="border-b border-danger/10 px-5 py-3">
        <h2 className="text-sm font-semibold text-danger">Account</h2>
      </div>
      <form action={signout}>
        <button
          type="submit"
          className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-danger-light/40"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger-light text-danger">
            <LogOut className="size-4" />
          </div>
          <span className="flex-1 text-sm font-medium text-danger">Sign out</span>
        </button>
      </form>
    </div>
  )
}
