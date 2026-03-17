'use client'

import { signout } from '@/app/(auth)/actions'

export function SignoutButton() {
  return (
    <form action={signout}>
      <button
        type="submit"
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        Sign out
      </button>
    </form>
  )
}
