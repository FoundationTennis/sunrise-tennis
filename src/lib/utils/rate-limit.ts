import { createRateLimiter } from '@/lib/upstash'

/**
 * Rate limiter with Upstash Redis for production (persistent across
 * serverless instances) and in-memory fallback for local dev.
 *
 * Usage: checkRateLimit('login:user@example.com', 5, 60_000)
 */

// ── In-memory fallback (local dev / missing env vars) ──────────────────

const hitMap = new Map<string, { count: number; resetAt: number }>()

function checkInMemory(key: string, limit: number, windowMs: number): boolean {
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

// Clean up stale entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hitMap) {
      if (now > entry.resetAt) hitMap.delete(key)
    }
  }, 60_000)
}

// ── Upstash cache (one Ratelimit instance per limit+window combo) ──────

const limiterCache = new Map<string, ReturnType<typeof createRateLimiter>>()

function getUpstashLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (limiter === undefined) {
    limiter = createRateLimiter(limit, windowMs)
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Check if a request is within rate limits.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory.
 *
 * @param key Unique identifier (e.g. 'login:user@example.com', 'msg:userId')
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const upstash = getUpstashLimiter(limit, windowMs)

  if (!upstash) {
    return checkInMemory(key, limit, windowMs)
  }

  // Upstash limit() is async but we keep the sync API for backwards compat.
  // Fire-and-forget the Redis call; use in-memory as immediate guard.
  // This means the first request always passes (in-memory), but Redis
  // provides distributed tracking across instances.
  upstash.limit(key).then(({ success }) => {
    if (!success) {
      // Mark in-memory as exceeded so subsequent sync calls in this
      // instance also block
      hitMap.set(key, { count: limit, resetAt: Date.now() + windowMs })
    }
  }).catch(() => {
    // Redis unavailable — in-memory continues to work
  })

  return checkInMemory(key, limit, windowMs)
}

/**
 * Async rate limit check — use this when you can await the result.
 * Provides accurate distributed rate limiting via Upstash.
 * Falls back to in-memory if Upstash is not configured.
 */
export async function checkRateLimitAsync(key: string, limit: number, windowMs: number): Promise<boolean> {
  const upstash = getUpstashLimiter(limit, windowMs)

  if (!upstash) {
    return checkInMemory(key, limit, windowMs)
  }

  try {
    const { success } = await upstash.limit(key)
    if (!success) {
      // Sync the in-memory map too
      hitMap.set(key, { count: limit, resetAt: Date.now() + windowMs })
    }
    return success
  } catch {
    // Redis unavailable — fall back
    return checkInMemory(key, limit, windowMs)
  }
}
