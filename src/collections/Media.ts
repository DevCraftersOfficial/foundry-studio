import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB limit
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
    delete: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        if (operation === 'create' || operation === 'update') {
          const file = (args as { file?: { name?: string; size?: number; mimetype?: string } }).file
          if (file?.size && file.size > MAX_FILE_SIZE) {
            throw new APIError(`File size exceeds the 10MB limit (received ${(file.size / (1024 * 1024)).toFixed(2)}MB).`, 400)
          }
          if (file?.name && file.name.toLowerCase().endsWith('.svg')) {
            throw new APIError('SVG uploads are disallowed due to embedded script and XML entity security risks.', 400)
          }
          if (file?.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new APIError(`Unsupported file type: "${file.mimetype}". Allowed types: JPEG, PNG, WebP, AVIF, GIF.`, 400)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text (for accessibility)',
      admin: {
        description: 'Required screen-reader description of image content to satisfy WCAG 2.2 AA accessibility standards.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      label: 'Caption / Credit',
      admin: {
        description: 'Optional editorial caption or photojournalism attribution displayed below the media.',
      },
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ALLOWED_MIME_TYPES,
    focalPoint: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        position: 'centre',
      },
      {
        name: 'feature',
        width: 1200,
        height: 675,
        position: 'centre',
      },
    ],
  },
}
