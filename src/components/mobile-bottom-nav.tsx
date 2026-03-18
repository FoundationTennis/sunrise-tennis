'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MobileBottomNavProps {
  items: NavItem[]
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== items[0]?.href && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex size-8 items-center justify-center rounded-xl transition-all',
                isActive && 'bg-primary/10 scale-110'
              )}>
                <item.icon className={cn('size-5', isActive && 'text-primary')} />
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
