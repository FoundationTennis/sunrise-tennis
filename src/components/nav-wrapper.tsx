'use client'

import { NavTabs } from '@/components/nav-tabs'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number | boolean
}

interface NavWrapperProps {
  items: NavItem[]
  mobileVisibleCount?: number
  children: React.ReactNode
}

export function NavWrapper({ items, mobileVisibleCount = 4, children }: NavWrapperProps) {
  const mobileVisible = items.slice(0, mobileVisibleCount)
  const mobileOverflow = items.slice(mobileVisibleCount)

  return (
    <div className="pb-20 md:pb-0">
      {/* Desktop: top tabs — all items */}
      <div className="hidden md:block">
        <NavTabs items={items} />
      </div>
      {children}
      {/* Mobile: bottom nav with overflow */}
      <MobileBottomNav
        items={mobileVisible}
        overflowItems={mobileOverflow.length > 0 ? mobileOverflow : undefined}
      />
    </div>
  )
}
