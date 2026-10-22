import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'updatedAt'],
  },
  auth: true,
  access: {
    // Prevent unauthenticated public registration
    create: ({ req: { user } }) => Boolean(user),
    // Allow reading user public attributes (e.g. author name on posts)
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      return {
        id: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return {
        id: {
          equals: user.id,
        },
      }
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (!data) return data

        // Strip any injected privileged fields to prevent privilege escalation
        const privilegedKeys = ['role', 'roles', 'isAdmin', 'isStaff', 'superuser', 'permissions']
        for (const key of privilegedKeys) {
          if (key in data) {
            delete (data as Record<string, unknown>)[key]
          }
        }

        // Prevent client manipulation of internal authentication fields
        if (operation === 'update') {
          delete (data as Record<string, unknown>).salt
          delete (data as Record<string, unknown>).hash
          delete (data as Record<string, unknown>).resetPasswordToken
          delete (data as Record<string, unknown>).resetPasswordExpiration
          delete (data as Record<string, unknown>).loginAttempts
          delete (data as Record<string, unknown>).lockUntil
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
      label: 'Full Name',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        // Prevent anonymous readers from harvesting author emails via populated relationships
        read: ({ req: { user }, doc }) => Boolean(user) || (Boolean(user) && user?.id === doc?.id),
      },
    },
  ],
}
