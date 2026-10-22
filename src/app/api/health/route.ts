import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * Health & Readiness endpoint for Foundry Studio.
 *
 * Checks:
 * - Liveness (?check=live): Confirms the Next.js/Node runtime is alive.
 * - Readiness (?check=ready or default): Verifies database connectivity.
 *
 * Security: Returns minimal telemetry; zero secrets, database URLs, or system versions.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const check = searchParams.get('check')

  // Liveness Probe (process is alive and responding)
  if (check === 'live') {
    return NextResponse.json(
      {
        status: 'alive',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  }

  // Readiness Probe (verifies database connection pool health)
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Execute lightweight count to verify connection pool
    await payload.count({
      collection: 'users',
    })

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'disconnected',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}
