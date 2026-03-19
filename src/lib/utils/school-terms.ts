/**
 * SA school term dates — hardcoded from education.sa.gov.au
 * Update annually when new dates are published.
 */

interface SchoolTerm {
  term: number
  year: number
  start: Date
  end: Date
}

// Source: https://www.education.sa.gov.au/students/term-dates-south-australian-state-schools
const SA_TERMS: SchoolTerm[] = [
  // 2025
  { term: 1, year: 2025, start: new Date(2025, 0, 28), end: new Date(2025, 3, 11) },
  { term: 2, year: 2025, start: new Date(2025, 3, 28), end: new Date(2025, 6, 4) },
  { term: 3, year: 2025, start: new Date(2025, 6, 21), end: new Date(2025, 8, 26) },
  { term: 4, year: 2025, start: new Date(2025, 9, 13), end: new Date(2025, 11, 12) },
  // 2026
  { term: 1, year: 2026, start: new Date(2026, 0, 27), end: new Date(2026, 3, 10) },
  { term: 2, year: 2026, start: new Date(2026, 3, 27), end: new Date(2026, 6, 3) },
  { term: 3, year: 2026, start: new Date(2026, 6, 20), end: new Date(2026, 8, 25) },
  { term: 4, year: 2026, start: new Date(2026, 9, 12), end: new Date(2026, 11, 11) },
]

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Returns term info for the week containing `monday`.
 * - During a term: "T1, Wk 8"
 * - During holidays: "Term 1 Holidays"
 * - Summer holidays: "Summer Holidays"
 * - Unknown: null
 */
export function getTermInfo(monday: Date): string | null {
  const day = startOfDay(monday)

  // Check if we're inside a term
  for (const t of SA_TERMS) {
    if (day >= startOfDay(t.start) && day <= startOfDay(t.end)) {
      const week = Math.floor(daysBetween(startOfDay(t.start), day) / 7) + 1
      return `T${t.term}, Wk ${week}`
    }
  }

  // Check if we're in holidays between terms
  const yearTerms = SA_TERMS.filter(t => t.year === day.getFullYear())
  for (let i = 0; i < yearTerms.length - 1; i++) {
    const afterTerm = startOfDay(yearTerms[i].end)
    const beforeTerm = startOfDay(yearTerms[i + 1].start)
    if (day > afterTerm && day < beforeTerm) {
      return `Term ${yearTerms[i].term} Holidays`
    }
  }

  // Check summer holidays (after T4 of previous year, before T1 of current year)
  const currentYearT1 = SA_TERMS.find(t => t.year === day.getFullYear() && t.term === 1)
  const prevYearT4 = SA_TERMS.find(t => t.year === day.getFullYear() - 1 && t.term === 4)
  if (currentYearT1 && day < startOfDay(currentYearT1.start)) {
    if (!prevYearT4 || day > startOfDay(prevYearT4.end)) {
      return 'Summer Holidays'
    }
  }

  // After T4 of current year
  const currentYearT4 = SA_TERMS.find(t => t.year === day.getFullYear() && t.term === 4)
  if (currentYearT4 && day > startOfDay(currentYearT4.end)) {
    return 'Summer Holidays'
  }

  return null
}
