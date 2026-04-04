'use client'

import { NavTabs } from '@/components/nav-tabs'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  CreditCard,
  Bell,
  Swords,
  UserPlus,
  UserCog,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/programs', label: 'Programs', icon: GraduationCap },
  { href: '/admin/coaches', label: 'Coaches', icon: UserCog },
  { href: '/admin/privates', label: 'Privates', icon: UserPlus },
  { href: '/admin/families', label: 'Families', icon: Users },
  { href: '/admin/players', label: 'Players', icon: UserCheck },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/competitions', label: 'Comps', icon: Swords },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
]

// Mobile: first 4 visible, rest in overflow
const mobileVisibleItems = navItems.slice(0, 4)
const mobileOverflowItems = navItems.slice(4)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      {/* Desktop: top tabs */}
      <div className="hidden md:block">
        <NavTabs items={navItems} />
      </div>
      {children}
      {/* Mobile: bottom nav */}
      <MobileBottomNav items={mobileVisibleItems} overflowItems={mobileOverflowItems} />
    </div>
  )
}
