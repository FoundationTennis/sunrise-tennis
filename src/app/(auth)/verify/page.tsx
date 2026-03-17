'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyMessage() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const message = type === 'magic-link'
    ? 'We sent you a magic link. Check your email and click the link to sign in.'
    : 'We sent you a confirmation email. Click the link to verify your account, then sign in.'

  return <p className="text-sm text-gray-600">{message}</p>
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        </div>

        <Suspense>
          <VerifyMessage />
        </Suspense>

        <Link
          href="/login"
          className="mt-8 inline-block text-sm text-orange-600 hover:text-orange-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
