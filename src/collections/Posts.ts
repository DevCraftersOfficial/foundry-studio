import type { CollectionConfig, Where } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { APIError } from 'payload'
import { formatSlug, isValidSlug } from '../lib/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'author', 'updatedAt'],
    preview: (doc) => {
      const secret = process.env.PREVIEW_SECRET || ''
      if (doc?.slug) {
        return `/api/preview?slug=${doc.slug}&secret=${secret}`
      }
      return '/'
    },
  },
  access: {
    // Public readers can only query published posts or scheduled posts whose time has passed.
    // Editors and Admins have full read access to drafts, in-review, scheduled, and published posts.
    // Authors can only read published posts and their own authored posts.
    read: ({ req: { user } }) => {
      if (user?.role === 'admin' || user?.role === 'editor') {
        return true
      }

      const now = new Date().toISOString()

      const publicWhere: Where[] = [
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
      ]

      if (user?.role === 'author') {
        return {
          or: [
            {
              author: {
                equals: user.id,
              },
            },
            ...publicWhere,
          ],
        }
      }

      return {
        or: publicWhere,
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins and Editors can update any post
      if (user.role === 'admin' || user.role === 'editor') return true
      // Authors can update only their own posts
      return {
        author: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Admins and Editors can delete any post
      if (user.role === 'admin' || user.role === 'editor') return true
      // Authors can delete only their own draft posts
      const filter: Where = {
        and: [
          {
            author: {
              equals: user.id,
            },
          },
          {
            status: {
              equals: 'draft',
            },
          },
        ],
      }
      return filter
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

        // 2. Author role publishing restrictions
        const isAuthor = req.user?.role === 'author'
        if (isAuthor && !req.context?.allowAuthorPublish) {
          if (operation === 'create') {
            if (data.status === 'published' || data.status === 'scheduled' || data.status === 'archived') {
              throw new APIError('Authors are not permitted to directly publish, schedule, or archive posts. Submit for review instead.', 403)
            }
          }

          if (operation === 'update') {
            if (data.status === 'published' || data.status === 'scheduled' || data.status === 'archived') {
              throw new APIError('Authors are not permitted to directly publish, schedule, or archive posts. Submit for review instead.', 403)
            }
          }
        }

        // 3. Validate scheduled status requirements
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

        // 4. Validate published status requirements
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

        const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'editor' || req.context?.allowExplicitAuthor

        // Enforce author to authenticated user on create if not privileged
        if (operation === 'create' && req.user) {
          if (!isPrivileged || !data.author) {
            data.author = req.user.id
          }
        }

        // Prevent unauthorized reassignment of author on update by normal authors
        if (operation === 'update' && req.user && data.author) {
          if (!isPrivileged && data.author !== req.user.id) {
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
          label: 'In Review',
          value: 'in_review',
        },
        {
          label: 'Scheduled',
          value: 'scheduled',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Archived',
          value: 'archived',
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
