/**
 * Simple in-memory rate limiter for serverless functions.
 * Resets on cold start — sufficient for preventing rapid-fire abuse
 * but not persistent across instances. For stronger protection,
 * use Upstash Redis rate limiting (free tier available).
 */

const hitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Check if a request is within rate limits.
 * @param key Unique identifier (e.g. IP address, user ID)
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = hitMap.get(key)

  if (!entry || now > entry.resetAt) {
    hitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Clean up stale entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hitMap) {
    if (now > entry.resetAt) hitMap.delete(key)
  }
}, 60_000)
