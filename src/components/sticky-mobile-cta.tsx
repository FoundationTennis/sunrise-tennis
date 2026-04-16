'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after scrolling past the hero; hide when the footer enters view so the footer links stay tappable.
    const footer = document.querySelector('footer')

    let footerInView = false

    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.8
      setVisible(pastHero && !footerInView)
    }

    const onScroll = () => update()

    let observer: IntersectionObserver | null = null
    if (footer) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            footerInView = entry.isIntersecting
          }
          update()
        },
        { rootMargin: '0px 0px -20% 0px', threshold: 0 },
      )
      observer.observe(footer)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (observer) observer.disconnect()
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 md:hidden">
      {/* Top gradient fade for smooth visual transition */}
      <div className="h-4 bg-gradient-to-t from-white to-transparent" />
      <div className="flex items-center gap-2 border-t border-[#E0D0BE]/40 bg-white/95 px-4 pb-[env(safe-area-inset-bottom,8px)] pt-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <a
          href="#trial"
          className="flex-1 rounded-full bg-[#E87450] py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors active:bg-[#D06040]"
        >
          Book a Free Trial
        </a>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 rounded-full border border-[#E0D0BE] bg-white px-5 py-2.5 text-sm font-medium text-[#2B5EA7] transition-colors active:bg-[#FFF6ED]"
        >
          <LogIn className="size-3.5" />
          Sign In
        </Link>
      </div>
    </div>
  )
}
