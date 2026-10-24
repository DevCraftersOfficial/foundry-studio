import type { User } from '@/payload-types'

export interface AvatarDescriptor {
  url: string
  alt: string
  variant: 'default' | 'neutral' | 'male' | 'female' | 'custom'
}

export const DEFAULT_AVATARS = {
  default: {
    url: '/avatars/avatar-default.jpg',
    alt: 'Default editorial doodle portrait (journalist)',
    variant: 'default' as const,
  },
  neutral: {
    url: '/avatars/avatar-neutral.jpg',
    alt: 'Default editorial doodle portrait (journalist)',
    variant: 'neutral' as const,
  },
  male: {
    url: '/avatars/avatar-male.jpg',
    alt: 'Default editorial doodle portrait (male journalist)',
    variant: 'male' as const,
  },
  female: {
    url: '/avatars/avatar-female.jpg',
    alt: 'Default editorial doodle portrait (female journalist)',
    variant: 'female' as const,
  },
}

/**
 * Deterministically selects the appropriate avatar for a user or author entity.
 *
 * Rules:
 * 1. Custom profile image (if present on user object as `avatar` or `image`) takes highest precedence.
 * 2. Explicit avatar preference (if present on the object as `avatarPreference` or `avatarVariant`) is respected.
 * 3. Never infers or assigns an avatar based on a user's name, ID, parity, or arbitrary identifiers.
 * 4. Default is a neutral, friendly doodle-style portrait matching Foundry Studio's editorial aesthetic.
 * 5. Safe fallback if user or image value is invalid, empty, or undefined.
 */
export function getUserAvatar(
  user?: Partial<User> | {
    id?: number | string | null
    name?: string | null
    avatar?: unknown
    image?: unknown
    avatarPreference?: unknown
    avatarVariant?: unknown
  } | null
): AvatarDescriptor {
  if (!user || typeof user !== 'object') {
    return DEFAULT_AVATARS.default
  }

  // 1. Check for custom profile image if the schema or model supports it
  const record = user as Record<string, unknown>
  const customAvatar = record.avatar || record.image

  if (customAvatar) {
    if (typeof customAvatar === 'string' && customAvatar.trim().length > 0) {
      return {
        url: customAvatar.trim(),
        alt: user.name ? `${user.name}’s profile photo` : 'User profile photo',
        variant: 'custom',
      }
    }
    if (typeof customAvatar === 'object' && customAvatar !== null && 'url' in customAvatar) {
      const url = (customAvatar as { url?: unknown; alt?: unknown }).url
      if (typeof url === 'string' && url.trim().length > 0) {
        const alt = (customAvatar as { alt?: unknown }).alt
        return {
          url: url.trim(),
          alt:
            typeof alt === 'string' && alt.trim().length > 0
              ? alt.trim()
              : user.name
              ? `${user.name}’s profile photo`
              : 'User profile photo',
          variant: 'custom',
        }
      }
    }
  }

  // 2. Check for explicit avatar preference if supported on the model
  const pref = record.avatarPreference || record.avatarVariant
  if (pref === 'male') {
    return DEFAULT_AVATARS.male
  }
  if (pref === 'female') {
    return DEFAULT_AVATARS.female
  }
  if (pref === 'neutral' || pref === 'default') {
    return DEFAULT_AVATARS.neutral
  }

  // 3. Neutral default avatar for all users without gender inference
  return DEFAULT_AVATARS.default
}
