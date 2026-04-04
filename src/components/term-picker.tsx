'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllTerms, getCurrentOrNextTerm, type SchoolTerm } from '@/lib/utils/school-terms'

/**
 * Term navigation component. Stores selection in URL search params (?term=2&year=2026).
 * The parent server component reads these params to filter data.
 */
export function TermPicker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const allTerms = getAllTerms()
  const termParam = searchParams.get('term')
  const yearParam = searchParams.get('year')

  // Determine current selection
  let currentTerm: SchoolTerm | null = null
  if (termParam && yearParam) {
    currentTerm = allTerms.find(t => t.term === Number(termParam) && t.year === Number(yearParam)) ?? null
  }
  if (!currentTerm) {
    currentTerm = getCurrentOrNextTerm(new Date()) ?? allTerms[allTerms.length - 1] ?? null
  }

  const currentIndex = currentTerm ? allTerms.findIndex(t => t.term === currentTerm!.term && t.year === currentTerm!.year) : -1

  const navigate = useCallback((term: SchoolTerm) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('term', String(term.term))
    params.set('year', String(term.year))
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  if (!currentTerm) return null

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allTerms.length - 1

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => hasPrev && navigate(allTerms[currentIndex - 1])}
        disabled={!hasPrev}
        className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous term"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[100px] text-center text-sm font-semibold text-foreground">
        Term {currentTerm.term}, {currentTerm.year}
      </span>
      <button
        onClick={() => hasNext && navigate(allTerms[currentIndex + 1])}
        disabled={!hasNext}
        className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next term"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

