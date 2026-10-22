import 'dotenv/config'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'

async function rotateAdmin() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const newAdminPassword = crypto.randomBytes(24).toString('base64url')
  const newPreviewSecret = crypto.randomBytes(24).toString('base64url')
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@foundrystudio.local'

  // 1. Update .env file securely
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8')
    if (envContent.includes('INITIAL_ADMIN_PASSWORD=')) {
      envContent = envContent.replace(/INITIAL_ADMIN_PASSWORD=.*/, `INITIAL_ADMIN_PASSWORD=${newAdminPassword}`)
    } else {
      envContent += `\nINITIAL_ADMIN_PASSWORD=${newAdminPassword}`
    }

    if (envContent.includes('PREVIEW_SECRET=')) {
      envContent = envContent.replace(/PREVIEW_SECRET=.*/, `PREVIEW_SECRET=${newPreviewSecret}`)
    } else {
      envContent += `\nPREVIEW_SECRET=${newPreviewSecret}`
    }

    if (!envContent.includes('INITIAL_ADMIN_EMAIL=')) {
      envContent += `\nINITIAL_ADMIN_EMAIL=${adminEmail}`
    }

    fs.writeFileSync(envPath, envContent, 'utf8')
  }

  // 2. Rotate password in database via Payload authentication routine
  const adminUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    overrideAccess: true,
  })

  if (adminUsers.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: adminUsers.docs[0].id,
      data: {
        password: newAdminPassword,
        role: 'admin',
      },
      overrideAccess: true,
    })
    payload.logger.info(`Rotated administrator password for ${adminEmail} successfully.`)
  } else {
    await payload.create({
      collection: 'users',
      data: {
        name: 'Platform Administrator',
        email: adminEmail,
        password: newAdminPassword,
        role: 'admin',
      },
      overrideAccess: true,
    })
    payload.logger.info(`Provisioned fresh administrator account for ${adminEmail}.`)
  }

  process.exit(0)
}

rotateAdmin().catch((err) => {
  console.error('Failed to rotate admin credentials:', err)
  process.exit(1)
})
