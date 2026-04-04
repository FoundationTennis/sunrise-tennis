'use client'

import { NavTabs } from '@/components/nav-tabs'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  DollarSign,
} from 'lucide-react'

const navItems = [
  { href: '/coach', label: 'Overview', icon: LayoutDashboard },
  { href: '/coach/schedule', label: 'Schedule', icon: Calendar },
  { href: '/coach/availability', label: 'Availability', icon: Clock },
  { href: '/coach/privates', label: 'Privates', icon: Users },
  { href: '/coach/earnings', label: 'Earnings', icon: DollarSign },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      {/* Desktop: top tabs */}
      <div className="hidden md:block">
        <NavTabs items={navItems} />
      </div>
      {children}
      {/* Mobile: bottom nav — all 5 items fit */}
      <MobileBottomNav items={navItems} />
    </div>
  )
}
