'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { label: 'Programs', href: '#programs' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#E0D0BE]/50 bg-[#FFFBF7]/90 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Sun className={`size-6 transition-colors ${scrolled ? 'text-[#F5B041]' : 'text-[#F7CD5D]'}`} />
          <span className={`text-lg font-bold tracking-tight transition-colors ${scrolled ? 'text-[#1A2332]' : 'text-white'}`}>
            Sunrise Tennis
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                scrolled ? 'text-[#556270]' : 'text-white/80'
              }`}
            >
              {link.label}
            </a>
          ))}
          <Button asChild size="sm" className="rounded-full bg-[#E87450] px-5 text-white hover:bg-[#D06040]">
            <a href="#trial">Book a Free Trial</a>
          </Button>
          <a
            href="/login"
            className={`text-sm font-medium transition-colors hover:opacity-80 ${
              scrolled ? 'text-[#556270]' : 'text-white/70'
            }`}
          >
            Sign In
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden ${scrolled ? 'text-[#1A2332]' : 'text-white'}`}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#E0D0BE]/30 bg-[#FFFBF7]/95 px-4 pb-4 pt-2 backdrop-blur-md md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-[#1A2332]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#trial"
            onClick={() => setMenuOpen(false)}
            className="mt-2 block rounded-full bg-[#E87450] px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Book a Free Trial
          </a>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-2 block py-2 text-center text-sm text-[#556270]"
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  )
}
