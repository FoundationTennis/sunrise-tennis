'use client'

import { NavTabs } from '@/components/nav-tabs'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import {
  LayoutDashboard,
  GraduationCap,
  CreditCard,
  Trophy,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/parent', label: 'Overview', icon: LayoutDashboard },
  { href: '/parent/programs', label: 'Programs', icon: GraduationCap },
  { href: '/parent/payments', label: 'Payments', icon: CreditCard },
  { href: '/parent/teams', label: 'Teams', icon: Trophy },
  { href: '/parent/settings', label: 'Settings', icon: Settings },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      {/* Desktop: top tabs */}
      <div className="hidden md:block">
        <NavTabs items={navItems} />
      </div>
      {children}
      {/* Mobile: bottom nav */}
      <MobileBottomNav items={navItems} />
    </div>
  )
}
