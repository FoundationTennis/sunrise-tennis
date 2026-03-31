/**
 * UTR (Universal Tennis Rating) API authentication and search.
 *
 * Authenticates with UTR using account credentials, caches the JWT,
 * and provides a typed search function for player lookups.
 */

let cachedToken: { jwt: string; expiresAt: number } | null = null

async function getUTRToken(): Promise<string> {
  // Return cached token if still valid (with 5-min safety margin)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.jwt
  }

  const email = process.env.UTR_API_EMAIL
  const password = process.env.UTR_API_PASSWORD
  if (!email || !password) {
    throw new Error('UTR credentials not configured')
  }

  const res = await fetch('https://api.universaltennis.com/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`UTR login failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const jwt = data.jwt ?? data.token ?? data.access_token

  if (!jwt || typeof jwt !== 'string') {
    throw new Error('UTR login response missing token')
  }

  // Cache for 23 hours (UTR tokens typically last 24h)
  cachedToken = { jwt, expiresAt: Date.now() + 23 * 60 * 60 * 1000 }
  return jwt
}

export interface UTRSearchResult {
  id: string
  displayName: string
  ageRange: string | null
  location: string | null
  threeMonthRating: number | null
  singlesUtrDisplay: string | null
  ratingStatusSingles: string | null
}

export async function searchUTRPlayers(
  query: string,
  top: number = 5,
): Promise<UTRSearchResult[]> {
  const token = await getUTRToken()

  const res = await fetch(
    `https://api.universaltennis.com/v2/search/players?query=${encodeURIComponent(query)}&top=${top}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 },
    },
  )

  if (!res.ok) {
    // If 401, clear cached token so next call re-authenticates
    if (res.status === 401) {
      cachedToken = null
    }
    throw new Error(`UTR search failed (${res.status})`)
  }

  const data = await res.json()

  return (data.hits ?? []).map((hit: Record<string, unknown>) => {
    const s = hit.source as Record<string, unknown>
    const loc = s.location as Record<string, unknown> | null
    return {
      id: String(s.id),
      displayName: (s.displayName ?? '') as string,
      ageRange: (s.ageRange ?? null) as string | null,
      location: (loc?.display ?? null) as string | null,
      threeMonthRating: (s.threeMonthRating ?? null) as number | null,
      singlesUtrDisplay: (s.singlesUtrDisplay ?? null) as string | null,
      ratingStatusSingles: (s.ratingStatusSingles ?? null) as string | null,
    }
  })
}
