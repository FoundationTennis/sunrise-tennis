import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * Upstash Redis client for persistent rate limiting.
 * Returns null if env vars are not configured (local dev fallback).
 */
function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  return new Redis({ url, token })
}

const redis = createRedis()

/**
 * Create a persistent rate limiter using Upstash Redis (sliding window).
 * Returns null if Redis is not configured — callers should fall back to in-memory.
 */
export function createRateLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null

  // Convert ms to seconds string for Upstash (e.g. 60000 → "60 s")
  const windowSec = Math.max(1, Math.floor(windowMs / 1000))
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: false,
  })
}
