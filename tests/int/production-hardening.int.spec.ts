import { describe, it, expect, vi } from 'vitest'
import type { Payload } from 'payload'
import * as payloadModule from 'payload'
import { validateEnv } from '@/lib/env'
import { getEmailAdapter } from '@/lib/email'
import { GET as healthHandler } from '@/app/api/health/route'
import config from '@/payload.config'
import { NextRequest } from 'next/server'

describe('FS-006 Production Hardening & Operational Validation', () => {
  describe('Environment Validation (validateEnv)', () => {
    it('accepts valid production configuration', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        DATABASE_URI: 'postgresql://postgres:password@db.example.com:5432/foundry_prod',
        PAYLOAD_SECRET: 'a_very_secure_secret_that_is_at_least_32_characters_long',
        PREVIEW_SECRET: 'preview_secret_at_least_16_chars',
        NEXT_PUBLIC_SITE_URL: 'https://foundry.example.com',
      }

      const result = validateEnv({ env: prodEnv, throwOnError: false })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects missing DATABASE_URI', () => {
      const invalidEnv = {
        NODE_ENV: 'production',
        PAYLOAD_SECRET: 'a_very_secure_secret_that_is_at_least_32_characters_long',
        PREVIEW_SECRET: 'preview_secret_at_least_16_chars',
        NEXT_PUBLIC_SITE_URL: 'https://foundry.example.com',
      }

      const result = validateEnv({ env: invalidEnv, throwOnError: false })
      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('DATABASE_URI'))).toBe(true)
      expect(() => validateEnv({ env: invalidEnv, throwOnError: true })).toThrow(/DATABASE_URI/)
    })

    it('rejects PAYLOAD_SECRET shorter than 32 characters in production', () => {
      const invalidEnv = {
        NODE_ENV: 'production',
        DATABASE_URI: 'postgresql://postgres:password@db.example.com:5432/foundry_prod',
        PAYLOAD_SECRET: 'short_secret_only_24_chars!',
        PREVIEW_SECRET: 'preview_secret_at_least_16_chars',
        NEXT_PUBLIC_SITE_URL: 'https://foundry.example.com',
      }

      const result = validateEnv({ env: invalidEnv, throwOnError: false })
      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('PAYLOAD_SECRET'))).toBe(true)
      expect(() => validateEnv({ env: invalidEnv, throwOnError: true })).toThrow(/PAYLOAD_SECRET/)
    })

    it('rejects PREVIEW_SECRET shorter than 16 characters in production', () => {
      const invalidEnv = {
        NODE_ENV: 'production',
        DATABASE_URI: 'postgresql://postgres:password@db.example.com:5432/foundry_prod',
        PAYLOAD_SECRET: 'a_very_secure_secret_that_is_at_least_32_characters_long',
        PREVIEW_SECRET: 'short_secret',
        NEXT_PUBLIC_SITE_URL: 'https://foundry.example.com',
      }

      const result = validateEnv({ env: invalidEnv, throwOnError: false })
      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('PREVIEW_SECRET'))).toBe(true)
      expect(() => validateEnv({ env: invalidEnv, throwOnError: true })).toThrow(/PREVIEW_SECRET/)
    })

    it('rejects localhost, loopback, or wildcard URLs in production', () => {
      const forbiddenUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://0.0.0.0:3000',
        'https://subdomain.local',
        'ftp://example.com',
        'not-a-valid-url',
      ]

      for (const forbiddenUrl of forbiddenUrls) {
        const invalidEnv = {
          NODE_ENV: 'production',
          DATABASE_URI: 'postgresql://postgres:password@db.example.com:5432/foundry_prod',
          PAYLOAD_SECRET: 'a_very_secure_secret_that_is_at_least_32_characters_long',
          PREVIEW_SECRET: 'preview_secret_at_least_16_chars',
          NEXT_PUBLIC_SITE_URL: forbiddenUrl,
        }

        const result = validateEnv({ env: invalidEnv, throwOnError: false })
        expect(result.isValid).toBe(false)
        expect(result.errors.some((err) => err.includes('NEXT_PUBLIC_SITE_URL'))).toBe(true)
      }
    })

    it('allows localhost and loopback in development without throwing', () => {
      const devEnv = {
        NODE_ENV: 'development',
        DATABASE_URI: 'postgresql://postgres:postgres@localhost:5432/foundry_dev',
        PAYLOAD_SECRET: 'dev_payload_secret_short',
        PREVIEW_SECRET: 'dev_preview_secret',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      }

      const result = validateEnv({ env: devEnv, throwOnError: false })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Email Adapter Configuration (getEmailAdapter)', () => {
    it('returns undefined (console fallback) in development when SMTP is unconfigured', () => {
      const adapter = getEmailAdapter({
        NODE_ENV: 'development',
      })
      expect(adapter).toBeUndefined()
    })

    it('returns an adapter that visibly throws in production when SMTP is unconfigured', async () => {
      const adapter = getEmailAdapter({
        NODE_ENV: 'production',
      })
      expect(adapter).toBeDefined()

      if (adapter) {
        const emailService = await adapter({ payload: {} as Payload })
        expect(emailService.name).toBe('unconfigured-production-email')
        await expect(
          emailService.sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            html: '<p>Test</p>',
          })
        ).rejects.toThrow(/Cannot dispatch email in production without configured SMTP provider/)
      }
    })

    it('configures nodemailer adapter when SMTP credentials are provided', async () => {
      const adapter = getEmailAdapter({
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.sendgrid.net',
        SMTP_PORT: '587',
        SMTP_USER: 'apikey',
        SMTP_PASS: 'SG.test_key',
        SMTP_FROM_ADDRESS: 'editorial@foundry.example.com',
        SMTP_FROM_NAME: 'Foundry Editorial',
      })
      expect(adapter).toBeDefined()

      if (adapter) {
        const emailService = await adapter({ payload: {} as Payload })
        expect(emailService.name).toBe('smtp')
        expect(emailService.defaultFromAddress).toBe('editorial@foundry.example.com')
        expect(emailService.defaultFromName).toBe('Foundry Editorial')
      }
    })
  })

  describe('Health Endpoint (/api/health)', () => {
    it('returns 200 OK for liveness probe (?check=live) with minimal payload', async () => {
      const req = new NextRequest('http://localhost:3000/api/health?check=live')
      const res = await healthHandler(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.status).toBe('alive')
      // Minimized payload: timestamps and internal details must be omitted
      expect(body.timestamp).toBeUndefined()
      expect(body.database).toBeUndefined()
      expect(JSON.stringify(body)).not.toMatch(/postgres|secret|password|token/i)
    })

    it('returns 200 OK for readiness probe with minimal connected database status', async () => {
      const req = new NextRequest('http://localhost:3000/api/health')
      const res = await healthHandler(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.status).toBe('ok')
      expect(body.database).toBe('connected')

      // Minimized payload: userCount, timestamps, and redundant service objects omitted
      expect(body.userCount).toBeUndefined()
      expect(body.timestamp).toBeUndefined()
      expect(body.services).toBeUndefined()

      // Strict leak check: zero credentials, URIs, versions, or internal connection strings
      const jsonStr = JSON.stringify(body)
      expect(jsonStr).not.toMatch(/postgresql:\/\/|secret|password|5432/i)
    })

    it('returns 503 degraded when database connection fails', async () => {
      const payloadConfig = await config
      const payload = await payloadModule.getPayload({ config: payloadConfig })
      const countSpy = vi
        .spyOn(payload, 'count')
        .mockRejectedValueOnce(new Error('Connection pool exhausted / DB unreachable'))

      try {
        const req = new NextRequest('http://localhost:3000/api/health')
        const res = await healthHandler(req)
        expect(res.status).toBe(503)

        const body = await res.json()
        expect(body.status).toBe('degraded')
        expect(body.database).toBe('disconnected')
        // Strict leak check: never expose stack traces, connection strings, or internal errors
        expect(body.error).toBeUndefined()
        expect(body.stack).toBeUndefined()
        expect(JSON.stringify(body)).not.toMatch(/exhausted|unreachable|postgres/i)
      } finally {
        countSpy.mockRestore()
      }
    })
  })

  describe('Security Headers', () => {
    it('configures tightened security headers in next.config.ts without unsafe-eval', async () => {
      // Import next.config
      const nextConfigModule = await import('../../next.config')
      const configObj = nextConfigModule.default || nextConfigModule
      expect(configObj.headers).toBeDefined()

      if (typeof configObj.headers === 'function') {
        const headerRoutes = await configObj.headers()
        expect(headerRoutes.length).toBeGreaterThan(0)

        const rootRoute = headerRoutes.find((r: { source: string }) => r.source === '/:path*')
        expect(rootRoute).toBeDefined()
        if (!rootRoute) return

        const headers = (rootRoute.headers || []) as Array<{ key: string; value: string }>
        const headerMap = new Map(headers.map((h) => [h.key, h.value]))

        expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff')
        expect(headerMap.get('X-Frame-Options')).toBe('SAMEORIGIN')
        expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
        expect(headerMap.get('Permissions-Policy')).toContain('camera=()')

        const csp = headerMap.get('Content-Security-Policy') || ''
        expect(csp).toContain("default-src 'self'")
        expect(csp).toContain("script-src 'self' 'unsafe-inline'")
        // Tightened: unsafe-eval is eliminated
        expect(csp).not.toContain("'unsafe-eval'")
        // Tightened: img-src and connect-src restricted to self/data/blob without wildcard https
        expect(csp).toContain("img-src 'self' data: blob:")
        expect(csp).toContain("connect-src 'self'")
        expect(csp).toContain("frame-ancestors 'self'")
        expect(csp).toContain("object-src 'none'")

        // HSTS is not enabled by default without explicit ENABLE_HSTS=true flag
        expect(headerMap.has('Strict-Transport-Security')).toBe(false)
      }
    })

    it('enables HSTS when ENABLE_HSTS is set to true', async () => {
      const originalVal = process.env.ENABLE_HSTS
      process.env.ENABLE_HSTS = 'true'
      try {
        const nextConfigModule = await import('../../next.config')
        const configObj = nextConfigModule.default || nextConfigModule
        if (typeof configObj.headers === 'function') {
          const headerRoutes = await configObj.headers()
          const rootRoute = headerRoutes.find((r: { source: string }) => r.source === '/:path*')
          expect(rootRoute).toBeDefined()
          if (!rootRoute) return

          const headers = (rootRoute.headers || []) as Array<{ key: string; value: string }>
          const headerMap = new Map(headers.map((h) => [h.key, h.value]))
          expect(headerMap.get('Strict-Transport-Security')).toBe('max-age=31536000')
        }
      } finally {
        if (originalVal !== undefined) {
          process.env.ENABLE_HSTS = originalVal
        } else {
          delete process.env.ENABLE_HSTS
        }
      }
    })
  })
})
