/**
 * Centralized Server-Side Environment Validator for Foundry Studio
 *
 * Validates critical runtime configuration for security, integrity, and safe production operations.
 * Secrets are strictly validated without ever printing their contents into logs or error messages.
 */

export interface EnvValidationResult {
  valid: boolean
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateEnv(
  options: { throwOnError?: boolean; env?: Record<string, string | undefined> } = {},
): EnvValidationResult {
  const currentEnv = options.env || process.env
  const isProduction = currentEnv.NODE_ENV === 'production'
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Database Connection String
  const dbUri = currentEnv.DATABASE_URI || currentEnv.DATABASE_URL
  if (!dbUri || !dbUri.trim()) {
    errors.push('DATABASE_URI (or DATABASE_URL) is required for database connectivity.')
  } else {
    const trimmedDb = dbUri.trim()
    if (
      !trimmedDb.startsWith('postgres://') &&
      !trimmedDb.startsWith('postgresql://') &&
      !trimmedDb.startsWith('mongodb://') &&
      !trimmedDb.startsWith('mongodb+srv://')
    ) {
      errors.push(
        'DATABASE_URI must be a valid PostgreSQL or MongoDB connection string (postgresql://... or mongodb+srv://...).',
      )
    }
  }

  // 2. Payload CMS Secret
  const payloadSecret = currentEnv.PAYLOAD_SECRET
  if (!payloadSecret || !payloadSecret.trim()) {
    errors.push('PAYLOAD_SECRET is required to sign session tokens and cryptographic data.')
  } else if (payloadSecret.trim().length < 32) {
    if (isProduction) {
      errors.push(
        `PAYLOAD_SECRET must be at least 32 characters in production (currently ${payloadSecret.trim().length} characters).`,
      )
    } else {
      warnings.push(
        `PAYLOAD_SECRET is short (${payloadSecret.trim().length} characters). Use at least 32 characters in production.`,
      )
    }
  }

  // 3. Editorial Preview Secret
  const previewSecret = currentEnv.PREVIEW_SECRET
  if (!previewSecret || !previewSecret.trim()) {
    if (isProduction) {
      errors.push('PREVIEW_SECRET is required to secure draft preview endpoints in production.')
    } else {
      warnings.push('PREVIEW_SECRET is missing; draft preview endpoints will reject preview requests.')
    }
  } else if (previewSecret.trim().length < 16) {
    if (isProduction) {
      errors.push(
        `PREVIEW_SECRET must be at least 16 characters in production (currently ${previewSecret.trim().length} characters).`,
      )
    } else {
      warnings.push(
        `PREVIEW_SECRET is short (${previewSecret.trim().length} characters). Use at least 16 characters in production.`,
      )
    }
  }

  // 4. Production Canonical Site URL
  const siteUrl =
    currentEnv.NEXT_PUBLIC_SITE_URL ||
    currentEnv.NEXT_PUBLIC_SERVER_URL ||
    currentEnv.SITE_URL

  if (!siteUrl || !siteUrl.trim()) {
    if (isProduction) {
      errors.push(
        'NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_SERVER_URL) is required in production to generate canonical metadata, sitemaps, and robots.',
      )
    }
  } else {
    const trimmedUrl = siteUrl.trim().replace(/\/+$/, '')
    try {
      const parsed = new URL(trimmedUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push(`NEXT_PUBLIC_SITE_URL protocol "${parsed.protocol}" is invalid. Must use http: or https:.`)
      }

      if (isProduction) {
        const host = parsed.hostname.toLowerCase()
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '0.0.0.0' ||
          host === '*' ||
          host.endsWith('.local')
        ) {
          errors.push(
            `NEXT_PUBLIC_SITE_URL cannot point to localhost, loopback, or wildcard domain ("${host}") in production. Please configure a valid public domain.`,
          )
        }
      }
    } catch {
      errors.push(`NEXT_PUBLIC_SITE_URL "${trimmedUrl}" is malformed and could not be parsed.`)
    }
  }

  const result: EnvValidationResult = {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
    warnings,
  }

  if (options.throwOnError && !result.valid) {
    throw new Error(
      `[Startup Environment Validation Failed]:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    )
  }

  return result
}
