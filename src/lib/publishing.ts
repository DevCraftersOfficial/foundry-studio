import type { Where } from 'payload'
import type { Post } from '@/payload-types'

/**
 * Returns the canonical Where filter for public reader queries across the platform.
 *
 * Strict Rule: Content is publicly readable IF AND ONLY IF:
 * 1. status is 'published'
 * 2. publishedAt is less than or equal to now (not in the future)
 *
 * Draft, In-Review, Scheduled (future or past), and Archived posts are strictly excluded.
 */
export function getPublicPostWhere(now: string = new Date().toISOString()): Where {
  return {
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
  }
}

/**
 * Deterministically checks whether a post object is eligible for public presentation.
 */
export function isPostPubliclyEligible(
  post: Partial<Post> | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!post || typeof post !== 'object') return false
  if (post.status !== 'published') return false
  if (!post.publishedAt) return false
  const pubTime = new Date(post.publishedAt).getTime()
  if (isNaN(pubTime)) return false
  return pubTime <= now
}
