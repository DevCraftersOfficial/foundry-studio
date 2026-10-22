/**
 * Returns the normalized site base URL for canonical tags, OpenGraph, sitemap, and robots.
 *
 * Requirements:
 * - Development and test environments (NODE_ENV !== 'production') safely fall back to http://localhost:3000.
 * - Production (NODE_ENV === 'production') MUST NOT silently fall back to localhost or loopback addresses.
 * - Missing or malformed production URL configuration fails safely and visibly by throwing a descriptive Error.
 * - Strips trailing slashes cleanly.
 */
export function getSiteUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.SITE_URL

  if (!rawUrl || !rawUrl.trim()) {
    if (isProduction) {
      throw new Error(
        '[Site URL Error]: Missing production site URL. Please configure NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_SERVER_URL in production environment variables.',
      )
    }
    return 'http://localhost:3000'
  }

  const trimmed = rawUrl.trim().replace(/\/+$/, '')

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(
        `Invalid protocol "${parsed.protocol}". Site URL must use http: or https:.`,
      )
    }

    if (isProduction) {
      const hostname = parsed.hostname.toLowerCase()
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        throw new Error(
          `[Site URL Error]: Production site URL cannot point to localhost or loopback address (${hostname}). Please configure a valid production domain.`,
        )
      }
    }

    return trimmed
  } catch (err: unknown) {
    if (isProduction) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`[Site URL Error]: Malformed production site URL "${trimmed}": ${msg}`)
    }
    return 'http://localhost:3000'
  }
}
