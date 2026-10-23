import type { User } from '@/payload-types'

export interface AvatarDescriptor {
  url: string
  alt: string
  variant: 'male' | 'female' | 'custom'
}

export const DEFAULT_AVATARS = {
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
 * Deterministically extracts or computes a numeric seed from a user ID or identifier.
 * Works uniformly whether the ID is a number, numeric string, or UUID/hash string.
 */
function getNumericSeed(id: unknown): number {
  if (typeof id === 'number') {
    return Math.abs(Math.floor(id))
  }
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10)
    if (!isNaN(parsed)) {
      return Math.abs(parsed)
    }
    // Simple stable string hash for non-numeric string IDs (e.g. UUIDs)
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
  return 0
}

/**
 * Deterministically selects the appropriate avatar for a user or author entity.
 *
 * Rules:
 * 1. Custom profile image (if present on user object as `avatar` or `image`) takes precedence.
 * 2. If no custom image exists, deterministically selects between the two built-in doodle avatars
 *    using user ID parity (even IDs receive male doodle, odd IDs receive female doodle).
 * 3. Never infers or assigns an avatar based on a user's name.
 * 4. Safe fallback if user or ID is undefined.
 */
export function getUserAvatar(
  user?: Partial<User> | { id?: number | string | null; name?: string | null; avatar?: unknown } | null
): AvatarDescriptor {
  if (!user) {
    return DEFAULT_AVATARS.male
  }

  // 1. Check for custom profile image if the schema or model supports it
  const customAvatar = (user as Record<string, unknown>).avatar || (user as Record<string, unknown>).image
  if (customAvatar) {
    if (typeof customAvatar === 'string' && customAvatar.trim()) {
      return {
        url: customAvatar,
        alt: user.name ? `${user.name}’s profile photo` : 'User profile photo',
        variant: 'custom',
      }
    }
    if (typeof customAvatar === 'object' && customAvatar !== null && 'url' in customAvatar) {
      const url = (customAvatar as { url?: string; alt?: string }).url
      if (url) {
        return {
          url,
          alt: (customAvatar as { alt?: string }).alt || (user.name ? `${user.name}’s profile photo` : 'User profile photo'),
          variant: 'custom',
        }
      }
    }
  }

  // 2. Deterministic selection based strictly on persistent user ID parity
  const seed = getNumericSeed(user.id)
  return seed % 2 === 0 ? DEFAULT_AVATARS.male : DEFAULT_AVATARS.female
}
