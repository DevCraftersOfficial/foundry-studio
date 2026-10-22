import type { CollectionConfig, Where } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { APIError } from 'payload'
import { formatSlug, isValidSlug } from '../lib/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'author', 'updatedAt'],
  },
  access: {
    // Public readers can only query published posts or scheduled posts whose time has passed.
    // Authenticated editorial users have full read access to drafts, scheduled, and published posts.
    read: ({ req: { user } }) => {
      if (user) {
        return true
      }

      const now = new Date().toISOString()

      const filter: Where = {
        or: [
          {
            and: [
              {
                status: {
                  equals: 'published',
                },
              },
              {
                publishedAt: {
                  less_than_equal: now,
                },
              },
            ],
          },
          {
            and: [
              {
                status: {
                  equals: 'scheduled',
                },
              },
              {
                publishedAt: {
                  less_than_equal: now,
                },
              },
            ],
          },
        ],
      }

      return filter
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      // Ordinary authors can only update their own posts
      return {
        author: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Ordinary authors can only delete their own posts
      return {
        author: {
          equals: user.id,
        },
      }
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data

        // 1. Auto-generate slug from title only if slug is omitted
        if (!data.slug && data.title) {
          data.slug = formatSlug(data.title)
        }

        // 2. Validate scheduled status requirements
        if (data.status === 'scheduled') {
          if (!data.publishedAt) {
            throw new APIError('A valid publication date (publishedAt) is required when status is "scheduled".', 400)
          }

          // Ensure scheduled date is in the future unless explicitly bypassed via context
          if ((operation === 'create' || operation === 'update') && !req.context?.allowPastScheduled) {
            const pubTime = new Date(data.publishedAt as string | number | Date).getTime()
            if (isNaN(pubTime)) {
              throw new APIError('Invalid publication date format.', 400)
            }
            if (pubTime <= Date.now()) {
              throw new APIError('Scheduled publication date must be set to a future date and time.', 400)
            }
          }
        }

        // 3. Validate published status requirements
        if (data.status === 'published') {
          if (!data.publishedAt) {
            data.publishedAt = new Date().toISOString()
          } else {
            const pubTime = new Date(data.publishedAt as string | number | Date).getTime()
            if (isNaN(pubTime)) {
              throw new APIError('Invalid publication date format.', 400)
            }
            if (pubTime > Date.now() && !req.context?.allowFuturePublished) {
              throw new APIError('A published post cannot have a future publication date. Set status to "scheduled" instead.', 400)
            }
          }
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data

        // Enforce author to authenticated user on create to prevent author spoofing
        if (operation === 'create' && req.user && !req.context?.allowExplicitAuthor) {
          data.author = req.user.id
        }

        // Prevent unauthorized reassignment of author on update
        if (operation === 'update' && req.user && data.author && !req.context?.allowExplicitAuthor) {
          if (data.author !== req.user.id) {
            throw new APIError('Cannot reassign post author to another user.', 403)
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Post Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'URL Slug',
      validate: (val: unknown) => {
        if (!val || typeof val !== 'string') return 'Slug is required'
        if (isValidSlug(val)) return true
        return 'Slug must be URL-safe (lowercase alphanumeric characters separated by single hyphens)'
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Scheduled',
          value: 'scheduled',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publication Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featuredImage',
      type: 'relationship',
      relationTo: 'media',
      hasMany: false,
      label: 'Featured Image',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Tags',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Summary / Excerpt',
      maxLength: 300,
      admin: {
        description: 'Brief standfirst summary (max 300 characters) for search engines and article cards.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor(),
      required: true,
      label: 'Article Content',
    },
  ],
}
