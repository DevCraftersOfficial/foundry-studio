import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

export type SeedAdminOptions = {
  adminEmail?: string
  adminPassword?: string
  adminName?: string
  allowPromotion?: boolean
  exitOnComplete?: boolean
}

export async function seedAdmin(options: SeedAdminOptions = {}) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const rawEmail = options.adminEmail || process.env.INITIAL_ADMIN_EMAIL || 'admin@foundrystudio.local'
  const adminEmail = rawEmail.trim().toLowerCase()
  const adminPassword = options.adminPassword || process.env.INITIAL_ADMIN_PASSWORD
  const adminName = (options.adminName || process.env.INITIAL_ADMIN_NAME || 'Platform Administrator').trim()
  const allowPromotion =
    options.allowPromotion !== undefined
      ? options.allowPromotion
      : process.env.ALLOW_EXISTING_ADMIN_PROMOTION === 'true'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(adminEmail)) {
    throw new Error(`Invalid INITIAL_ADMIN_EMAIL: "${rawEmail}". Must be a valid email address.`)
  }

  if (!adminPassword) {
    throw new Error(
      'INITIAL_ADMIN_PASSWORD environment variable is required to provision the administrator account.',
    )
  }

  payload.logger.info(`Checking for administrator account (${adminEmail})...`)

  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: adminEmail,
      },
    },
    overrideAccess: true,
  })

  if (existingUsers.totalDocs > 0) {
    const existing = existingUsers.docs[0]
    if (existing.role !== 'admin') {
      if (allowPromotion) {
        // Validate target account integrity before promotion: strictly match email and non-empty ID
        if (!existing.id || existing.email?.trim().toLowerCase() !== adminEmail) {
          throw new Error(`Target account validation failed. Cannot promote non-matching account.`)
        }
        await payload.update({
          collection: 'users',
          id: existing.id,
          data: {
            role: 'admin',
          },
          context: {
            allowExplicitRole: true,
          },
          overrideAccess: true,
        })
        payload.logger.info(`Promoted existing user ${adminEmail} to administrator role (explicitly authorized).`)
      } else {
        throw new Error(
          `User ${adminEmail} exists but is not an administrator. Set ALLOW_EXISTING_ADMIN_PROMOTION=true to explicitly authorize promotion.`,
        )
      }
    } else {
      payload.logger.info(`Administrator account ${adminEmail} already exists and is active.`)
    }
  } else {
    try {
      await payload.create({
        collection: 'users',
        data: {
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
      payload.logger.info(`Successfully provisioned administrator account: ${adminEmail}`)
    } catch (err: unknown) {
      // If a concurrent process created the user simultaneously, re-verify status
      const recheck = await payload.find({
        collection: 'users',
        where: { email: { equals: adminEmail } },
        overrideAccess: true,
      })
      if (recheck.totalDocs > 0 && recheck.docs[0].role === 'admin') {
        payload.logger.info(`Administrator account ${adminEmail} was provisioned concurrently and is active.`)
        if (options.exitOnComplete ?? (typeof process.argv[1] === 'string' && process.argv[1].endsWith('seed-admin.ts'))) {
          process.exit(0)
        }
        return
      }
      throw err
    }
  }

  if (options.exitOnComplete ?? (typeof process.argv[1] === 'string' && process.argv[1].endsWith('seed-admin.ts'))) {
    process.exit(0)
  }
}

const isCLI = typeof process.argv[1] === 'string' && process.argv[1].endsWith('seed-admin.ts')
if (isCLI) {
  seedAdmin().catch((err) => {
    console.error('Failed to seed administrator account:', err)
    process.exit(1)
  })
}
