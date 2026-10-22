import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
  },
  auth: true,
  access: {
    // User creation via REST, GraphQL, and Local API strictly requires administrator privileges.
    // Anonymous registration is completely disabled. Initial admin provisioning is performed
    // exclusively via the explicit seed:admin CLI script.
    create: ({ req: { user } }) => Boolean(user) && user?.role === 'admin',
    // Allow reading user public attributes (e.g. author name on posts)
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins can update any user record; regular users can only update their own record
      if (user.role === 'admin') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Only admins can delete user accounts
      return user.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (!data) return data

        const isAdmin = req.user?.role === 'admin'
        const isExplicitlyAuthorized = Boolean(req.context?.allowExplicitRole)

        // Strict role authorization:
        if (operation === 'create') {
          if (!isAdmin && !isExplicitlyAuthorized) {
            // Unprivileged, self-service, or anonymous creations are unconditionally forced to 'author'.
            // Implicit anonymous bootstrap is removed to eliminate multi-admin race conditions.
            // Initial administrator provisioning must be performed explicitly via seed:admin.
            data.role = 'author'
          }
        }

        if (operation === 'update') {
          if (!isAdmin && !isExplicitlyAuthorized) {
            // Non-admins can NEVER mutate their role
            if (originalDoc) {
              data.role = originalDoc.role
            }
          }
        }

        // Prevent demoting the last remaining administrator
        if (operation === 'update' && originalDoc?.role === 'admin' && data.role && data.role !== 'admin') {
          const adminCount = await req.payload.count({
            collection: 'users',
            where: {
              role: { equals: 'admin' },
            },
          })
          if (adminCount.totalDocs <= 1) {
            throw new APIError('Cannot demote the last remaining administrator.', 400)
          }
        }

        // Strip any injected privileged fields to prevent privilege escalation
        const privilegedKeys = ['roles', 'isAdmin', 'isStaff', 'superuser', 'permissions']
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
    {
      name: 'role',
      type: 'select',
      defaultValue: 'author',
      options: [
        {
          label: 'Author',
          value: 'author',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Admin',
          value: 'admin',
        },
      ],
      access: {
        // Only admins can set or update user roles
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: 'Determines publishing permissions and administrative access.',
      },
    },
  ],
}
