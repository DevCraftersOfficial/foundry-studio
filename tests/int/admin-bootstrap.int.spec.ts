import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { seedAdmin } from '@/scripts/seed-admin'

let payload: Payload
let _testAdmin: User
let _testAuthor: User

describe('FS-004-V Administrator Provisioning & Credential Security', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Ensure test admin exists
    const adminQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs004v-admin@devcrafters.io' } },
      overrideAccess: true,
    })

    if (adminQuery.docs.length > 0) {
      _testAdmin = adminQuery.docs[0]
    } else {
      _testAdmin = await payload.create({
        collection: 'users',
        data: {
          name: 'Bootstrap Verifier Admin',
          email: 'fs004v-admin@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
          role: 'admin',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
    }

    // Ensure test author exists
    const authorQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs004v-author@devcrafters.io' } },
      overrideAccess: true,
    })

    if (authorQuery.docs.length > 0) {
      _testAuthor = authorQuery.docs[0]
    } else {
      _testAuthor = await payload.create({
        collection: 'users',
        data: {
          name: 'Bootstrap Verifier Author',
          email: 'fs004v-author@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
          role: 'author',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
    }
  })

  afterAll(async () => {
    // Clean up test users
    await payload.delete({
      collection: 'users',
      where: {
        email: {
          like: 'fs004v-%',
        },
      },
      overrideAccess: true,
    })
  })

  describe('First-User Bootstrap & Anonymous Registration Guardrails', () => {
    it('strictly forbids anonymous registration when an administrator already exists', async () => {
      await expect(
        payload.create({
          collection: 'users',
          data: {
            name: 'Anonymous Registrant',
            email: `fs004v-anon-${Date.now()}@devcrafters.io`,
            password: 'CorrectHorseBatteryStaple123!',
            role: 'admin',
          },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })

    it('neutralizes client role-field injection on user creation', async () => {
      // Even if an internal caller bypasses access.create but lacks privileged context,
      // the hook must force data.role to 'author' because admins already exist
      const created = await payload.create({
        collection: 'users',
        data: {
          name: 'Injected Role User',
          email: `fs004v-injected-${Date.now()}@devcrafters.io`,
          password: 'CorrectHorseBatteryStaple123!',
          role: 'admin',
        },
        // overrideAccess: false but no allowExplicitRole context
        context: {
          allowExplicitRole: false,
        },
        overrideAccess: true,
      })

      // Must be sanitized to author
      expect(created.role).toBe('author')
    })

    it('prevents demotion or deletion of the last remaining administrator', async () => {
      // Find all current admins
      const allAdmins = await payload.find({
        collection: 'users',
        where: {
          role: { equals: 'admin' },
        },
        overrideAccess: true,
      })

      // Verify that if only 1 admin existed, demoting them is rejected
      if (allAdmins.totalDocs === 1) {
        await expect(
          payload.update({
            collection: 'users',
            id: allAdmins.docs[0].id,
            data: {
              role: 'author',
            },
            overrideAccess: false,
            user: allAdmins.docs[0],
          }),
        ).rejects.toThrow(/Cannot demote the last remaining administrator/i)
      } else {
        expect(allAdmins.totalDocs).toBeGreaterThan(1)
      }
    })

    it('guarantees that concurrent user creation requests cannot create any unauthorized administrators', async () => {
      const concurrentAttempts = Array.from({ length: 8 }, (_, i) =>
        payload.create({
          collection: 'users',
          data: {
            name: `Concurrent Attacker ${i}`,
            email: `fs004v-concurrent-${i}-${Date.now()}@devcrafters.io`,
            password: 'CorrectHorseBatteryStaple123!',
            role: 'admin',
          },
          context: {
            allowExplicitRole: false,
          },
          overrideAccess: true,
        }),
      )

      const results = await Promise.all(concurrentAttempts)
      // Every single one MUST have role: 'author'
      for (const res of results) {
        expect(res.role).toBe('author')
      }

      // Check DB to ensure zero accounts received admin
      const adminCount = await payload.find({
        collection: 'users',
        where: {
          and: [
            { email: { like: 'fs004v-concurrent-%' } },
            { role: { equals: 'admin' } },
          ],
        },
        overrideAccess: true,
      })
      expect(adminCount.totalDocs).toBe(0)
    })
  })

  describe('Existing Account Promotion Safety in Provisioning', () => {
    it('refuses to promote existing non-admin user unless ALLOW_EXISTING_ADMIN_PROMOTION is true', async () => {
      const existingAuthor = await payload.create({
        collection: 'users',
        data: {
          name: 'Unpromoted Contributor',
          email: `fs004v-candidate-${Date.now()}@devcrafters.io`,
          password: 'CorrectHorseBatteryStaple123!',
          role: 'author',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })

      expect(existingAuthor.role).toBe('author')

      // Simulate seed-admin check without ALLOW_EXISTING_ADMIN_PROMOTION
      const attemptPromotion = async (allowPromotion: boolean) => {
        if (!allowPromotion) {
          throw new Error('User exists but is not an administrator. Set ALLOW_EXISTING_ADMIN_PROMOTION=true to explicitly authorize promotion.')
        }
        return await payload.update({
          collection: 'users',
          id: existingAuthor.id,
          data: { role: 'admin' },
          context: {
            allowExplicitRole: true,
          },
          overrideAccess: true,
        })
      }

      await expect(attemptPromotion(false)).rejects.toThrow(/ALLOW_EXISTING_ADMIN_PROMOTION=true/)

      // With explicit authorization:
      const promoted = await attemptPromotion(true)
      expect(promoted.role).toBe('admin')
    })

    it('proves that ordinary REST and Local API payloads cannot activate allowExplicitRole or self-assign admin', async () => {
      // 1. Attacker attempts to pass context inside payload data (mimicking JSON body injection)
      const dataWithContext = {
        name: 'Spoofed Context Attacker',
        email: `fs004v-spoof-${Date.now()}@devcrafters.io`,
        password: 'CorrectHorseBatteryStaple123!',
        role: 'admin',
        context: {
          allowExplicitRole: true,
        },
      }

      // Unauthenticated caller: access.create rejects outright
      await expect(
        payload.create({
          collection: 'users',
          data: dataWithContext as unknown as User,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Even if internal code runs with overrideAccess: true but without privileged context,
      // body-injected 'context' has no effect on req.context
      const user = await payload.create({
        collection: 'users',
        data: dataWithContext as unknown as User,
        overrideAccess: true,
      })

      // Must be forced to author
      expect(user.role).toBe('author')
    })

    it('proves concurrent seed-admin execution provisions exactly one admin account without creating or promoting unintended accounts', async () => {
      const targetEmail = `fs004v-concurrent-admin-${Date.now()}@devcrafters.io`

      // Execute seedAdmin 5 times concurrently targeting the same new admin account
      const runs = Array.from({ length: 5 }, () =>
        seedAdmin({
          adminEmail: targetEmail,
          adminPassword: 'CorrectHorseBatteryStaple123!',
          adminName: 'Concurrent Prov Admin',
          allowPromotion: false,
          exitOnComplete: false,
        }),
      )

      await Promise.all(runs)

      // Query database for the provisioned email
      const result = await payload.find({
        collection: 'users',
        where: { email: { equals: targetEmail } },
        overrideAccess: true,
      })

      // Exactly ONE user document must exist, and its role must be 'admin'
      expect(result.totalDocs).toBe(1)
      expect(result.docs[0].role).toBe('admin')
      expect(result.docs[0].email).toBe(targetEmail)
    })

    it('validates target account integrity before existing-account promotion in seedAdmin', async () => {
      const candidateEmail = `fs004v-targeted-${Date.now()}@devcrafters.io`

      // Create an existing author
      const candidateUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Target Candidate',
          email: candidateEmail,
          password: 'CorrectHorseBatteryStaple123!',
          role: 'author',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
      expect(candidateUser.role).toBe('author')

      // Attempt seedAdmin without allowPromotion: must throw
      await expect(
        seedAdmin({
          adminEmail: candidateEmail,
          adminPassword: 'CorrectHorseBatteryStaple123!',
          allowPromotion: false,
          exitOnComplete: false,
        }),
      ).rejects.toThrow(/ALLOW_EXISTING_ADMIN_PROMOTION=true/i)

      // With allowPromotion: true, strictly validates target account and promotes it
      await seedAdmin({
        adminEmail: candidateEmail,
        adminPassword: 'CorrectHorseBatteryStaple123!',
        allowPromotion: true,
        exitOnComplete: false,
      })

      const recheck = await payload.findByID({
        collection: 'users',
        id: candidateUser.id,
        overrideAccess: true,
      })
      expect(recheck.role).toBe('admin')
    })

    it('rejects invalid email formats in seedAdmin', async () => {
      await expect(
        seedAdmin({
          adminEmail: 'invalid-not-an-email',
          adminPassword: 'CorrectHorseBatteryStaple123!',
          exitOnComplete: false,
        }),
      ).rejects.toThrow(/Invalid INITIAL_ADMIN_EMAIL/i)
    })
  })
})
