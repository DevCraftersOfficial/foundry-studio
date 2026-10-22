import type { CollectionConfig } from 'payload'
import { formatSlug, isValidSlug } from '../lib/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    // Categories are publicly readable
    read: () => true,
    // Taxonomy management is restricted to Editors and Administrators
    create: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
    update: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
    delete: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (!data.slug && data.name) {
          data.slug = formatSlug(data.name)
        } else if (data.slug) {
          data.slug = formatSlug(data.slug)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (val: unknown) => {
        if (!val || typeof val !== 'string') return 'Slug is required'
        if (isValidSlug(val)) return true
        return 'Slug must be URL-safe (lowercase alphanumeric characters separated by single hyphens)'
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
  ],
}
