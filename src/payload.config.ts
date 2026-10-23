import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
import { migrations } from './migrations'
import { validateEnv } from './lib/env'
import { getEmailAdapter } from './lib/email'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Fail fast in production runtime if required configuration is missing or insecure
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  validateEnv({ throwOnError: true })
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Foundry Studio by DevCrafters',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#AdminLogo',
        Icon: '@/components/admin/Icon#AdminIcon',
      },
      beforeNavLinks: ['@/components/admin/NavBrand#AdminNavBrand'],
      header: ['@/components/admin/StudioHeader#StudioHeader'],
      Nav: '@/components/admin/StudioNav#StudioNav',
      views: {
        dashboard: {
          Component: '@/components/admin/StudioDashboard#StudioDashboard',
        },
      },
    },
  },
  collections: [Users, Media, Posts, Categories, Tags],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  email: getEmailAdapter(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
    },
    prodMigrations: migrations,
    push: false,
  }),
  sharp,
  plugins: [],
})
