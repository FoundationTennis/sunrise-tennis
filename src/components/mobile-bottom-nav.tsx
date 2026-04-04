'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MobileBottomNavProps {
  items: NavItem[]
  overflowItems?: NavItem[]
}

export function MobileBottomNav({ items, overflowItems }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [showOverflow, setShowOverflow] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  // Close overflow menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    if (showOverflow) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOverflow])

  // Close overflow on navigation
  useEffect(() => {
    setShowOverflow(false)
  }, [pathname])

  const rootHref = items[0]?.href
  const isOverflowActive = overflowItems?.some(
    item => pathname === item.href || (item.href !== rootHref && pathname.startsWith(item.href))
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient accent stripe */}
      <div className="gradient-stripe h-[2px]" />
      <div className="border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="flex items-stretch justify-around">
          {items.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== items[0]?.href && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground/70 active:text-foreground'
                )}
              >
                <div className={cn(
                  'flex size-8 items-center justify-center rounded-xl transition-all',
                  isActive
                    ? 'bg-primary/12 shadow-sm'
                    : ''
                )}>
                  <item.icon className={cn(
                    'size-[18px] transition-all',
                    isActive ? 'text-primary' : ''
                  )} />
                </div>
                <span className={cn(isActive && 'font-semibold')}>{item.label}</span>
              </Link>
            )
          })}

          {/* More button with overflow menu */}
          {overflowItems && overflowItems.length > 0 && (
            <div className="relative flex flex-1" ref={overflowRef}>
              <button
                onClick={() => setShowOverflow(prev => !prev)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-all',
                  isOverflowActive || showOverflow
                    ? 'text-primary'
                    : 'text-muted-foreground/70 active:text-foreground'
                )}
              >
                <div className={cn(
                  'flex size-8 items-center justify-center rounded-xl transition-all',
                  isOverflowActive ? 'bg-primary/12 shadow-sm' : ''
                )}>
                  <MoreHorizontal className={cn(
                    'size-[18px] transition-all',
                    isOverflowActive || showOverflow ? 'text-primary' : ''
                  )} />
                </div>
                <span className={cn((isOverflowActive || showOverflow) && 'font-semibold')}>More</span>
              </button>

              {/* Overflow popup */}
              {showOverflow && (
                <div className="absolute bottom-full right-0 mb-2 min-w-[160px] rounded-xl border border-border bg-card p-1.5 shadow-elevated">
                  {overflowItems.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== rootHref && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Safe area for phones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  )
}
