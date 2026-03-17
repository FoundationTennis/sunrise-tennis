'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const views = [
  { href: '/admin', label: 'Admin' },
  { href: '/coach', label: 'Coach' },
  { href: '/parent', label: 'Parent' },
]

export function RoleSwitcher() {
  const pathname = usePathname()

  const activeView = views.find(v => pathname.startsWith(v.href))

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-0.5">
      {views.map((view) => {
        const isActive = activeView?.href === view.href
        return (
          <Link
            key={view.href}
            href={view.href}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-orange-600 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {view.label}
          </Link>
        )
      })}
    </div>
  )
}
