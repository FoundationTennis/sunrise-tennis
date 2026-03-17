/**
 * Format cents to AUD display string (e.g. 8500 -> "$85.00")
 */
export function formatCurrency(cents: number): string {
  const dollars = Math.abs(cents) / 100
  const formatted = `$${dollars.toFixed(2)}`
  return cents < 0 ? `-${formatted}` : formatted
}

/**
 * Parse a dollar string to cents (e.g. "$85.00" -> 8500, "-$170.00" -> -17000)
 */
export function parseCurrency(display: string): number {
  const negative = display.startsWith('-')
  const cleaned = display.replace(/[^0-9.]/g, '')
  const cents = Math.round(parseFloat(cleaned) * 100)
  return negative ? -cents : cents
}
