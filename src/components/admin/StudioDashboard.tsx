import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { AdminViewServerProps, Payload } from 'payload'
import {
  StudioDashboardView,
  StudioDashboardData,
  DashboardQueueItem,
} from './StudioDashboardView'

interface TypedUserRecord {
  id: string | number
  email: string
  name?: string | null
  role?: 'admin' | 'editor' | 'author'
}

interface PostDocLike {
  id: string | number
  title?: string | null
  slug?: string | null
  updatedAt: string
  createdAt?: string
  publishedAt?: string
  author?: { name?: string | null; email?: string | null } | string | number | null
  categories?: Array<{ name?: string | null } | string | number> | null
}

function mapPostToQueueItem(doc: PostDocLike): DashboardQueueItem {
  let authorName: string | undefined = undefined
  if (doc.author && typeof doc.author === 'object') {
    authorName = doc.author.name || doc.author.email || undefined
  }

  let categoryTitle: string | undefined = undefined
  if (Array.isArray(doc.categories) && doc.categories.length > 0) {
    const firstCat = doc.categories[0]
    if (typeof firstCat === 'object' && firstCat !== null && 'name' in firstCat && typeof firstCat.name === 'string') {
      categoryTitle = firstCat.name
    }
  }

  return {
    id: doc.id,
    title: doc.title || 'Untitled Dispatch',
    slug: doc.slug || '',
    authorName,
    categoryTitle,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    publishedAt: doc.publishedAt,
  }
}

import type { Where } from 'payload'

async function fetchDashboardData(
  payloadInstance: Payload,
  user: TypedUserRecord,
): Promise<{ data?: StudioDashboardData; error?: string }> {
  const role = user.role || 'author'
  const isAuthor = role === 'author'
  const isAdmin = role === 'admin'

  // Helper: build 7-day publication velocity array (counts per day, oldest → newest)
  async function getVelocity(authorId?: string | number): Promise<number[]> {
    const now = new Date()
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 86400000)

    const baseWhere: Where = {
      and: [
        { status: { equals: 'published' } },
        { publishedAt: { greater_than_equal: sevenDaysAgo.toISOString() } },
      ],
    };
    if (!baseWhere.and) baseWhere.and = []
    const where: Where = authorId !== undefined
      ? { and: baseWhere.and.concat({ author: { equals: authorId } }) }
      : baseWhere

    const res = await payloadInstance.find({
      collection: 'posts',
      where,
      limit: 500,
      depth: 0,
      overrideAccess: false,
      user,
    })

    const counts = new Array(7).fill(0)
    for (const doc of res.docs as Array<{ publishedAt?: string }>) {
      if (!doc.publishedAt) continue
      const d = new Date(doc.publishedAt)
      const dayIdx = Math.floor((startOfToday.getTime() - new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).getTime()) / 86400000)
      if (dayIdx >= 0 && dayIdx < 7) counts[dayIdx]++
    }
    return counts.reverse() // oldest → newest
  }

  try {
    if (isAuthor) {
      // Authors: Strictly query own drafts, own submissions in review, own scheduled, and published posts
      const [draftsRes, inReviewRes, scheduledRes, publishedRes, velocity] = await Promise.all([
        payloadInstance.find({
          collection: 'posts',
          where: {
            and: [
              { status: { equals: 'draft' } },
              { author: { equals: user.id } },
            ],
          },
          limit: 5,
          sort: '-updatedAt',
          depth: 1,
          overrideAccess: false,
          user,
        }),
        payloadInstance.find({
          collection: 'posts',
          where: {
            and: [
              { status: { equals: 'in_review' } },
              { author: { equals: user.id } },
            ],
          },
          limit: 8,
          sort: '-updatedAt',
          depth: 1,
          overrideAccess: false,
          user,
        }),
        payloadInstance.find({
          collection: 'posts',
          where: {
            and: [
              { status: { equals: 'scheduled' } },
              { author: { equals: user.id } },
            ],
          },
          limit: 5,
          sort: 'publishedAt',
          depth: 1,
          overrideAccess: false,
          user,
        }),
        payloadInstance.find({
          collection: 'posts',
          where: {
            status: { equals: 'published' },
          },
          limit: 5,
          sort: '-publishedAt',
          depth: 1,
          overrideAccess: false,
          user,
        }),
        getVelocity(user.id),
      ])

      return {
        data: {
          user: {
            id: user.id,
            name: user.name || null,
            email: user.email,
            role: 'author',
          },
          metrics: {
            drafts: draftsRes.totalDocs,
            inReview: inReviewRes.totalDocs,
            scheduled: scheduledRes.totalDocs,
            published: publishedRes.totalDocs,
            velocity,
          },
          reviewQueue: (inReviewRes.docs as PostDocLike[]).map(mapPostToQueueItem),
          drafts: (draftsRes.docs as PostDocLike[]).map(mapPostToQueueItem),
          scheduled: (scheduledRes.docs as PostDocLike[]).map(mapPostToQueueItem),
          published: (publishedRes.docs as PostDocLike[]).map(mapPostToQueueItem),
        },
      }
    }

    // Editors and Admins: Full newsroom visibility across all authors
    const [draftsRes, inReviewRes, scheduledRes, publishedRes, usersCount, mediaCount, velocity] = await Promise.all([
      payloadInstance.find({
        collection: 'posts',
        where: {
          status: { equals: 'draft' },
        },
        limit: 5,
        sort: '-updatedAt',
        depth: 1,
        overrideAccess: false,
        user,
      }),
      payloadInstance.find({
        collection: 'posts',
        where: {
          status: { equals: 'in_review' },
        },
        limit: 8,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: false,
        user,
      }),
      payloadInstance.find({
        collection: 'posts',
        where: {
          status: { equals: 'scheduled' },
        },
        limit: 5,
        sort: 'publishedAt',
        depth: 1,
        overrideAccess: false,
        user,
      }),
      payloadInstance.find({
        collection: 'posts',
        where: {
          status: { equals: 'published' },
        },
        limit: 5,
        sort: '-publishedAt',
        depth: 1,
        overrideAccess: false,
        user,
      }),
      isAdmin
        ? payloadInstance.count({ collection: 'users' })
        : Promise.resolve({ totalDocs: 0 }),
      isAdmin
        ? payloadInstance.count({ collection: 'media' })
        : Promise.resolve({ totalDocs: 0 }),
      getVelocity(),
    ])

    return {
      data: {
        user: {
          id: user.id,
          name: user.name || null,
          email: user.email,
          role: role as 'admin' | 'editor',
        },
        metrics: {
          drafts: draftsRes.totalDocs,
          inReview: inReviewRes.totalDocs,
          scheduled: scheduledRes.totalDocs,
          published: publishedRes.totalDocs,
          totalUsers: isAdmin ? usersCount.totalDocs : undefined,
          totalMedia: isAdmin ? mediaCount.totalDocs : undefined,
          velocity,
        },
        reviewQueue: (inReviewRes.docs as PostDocLike[]).map(mapPostToQueueItem),
        drafts: (draftsRes.docs as PostDocLike[]).map(mapPostToQueueItem),
        scheduled: (scheduledRes.docs as PostDocLike[]).map(mapPostToQueueItem),
        published: (publishedRes.docs as PostDocLike[]).map(mapPostToQueueItem),
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database query error'
    return { error: message }
  }
}

export const StudioDashboard: React.FC<AdminViewServerProps> = async (props) => {
  const user = props.user
  if (!user) {
    return <StudioDashboardView state="permission-denied" />
  }

  const typedUser = user as unknown as TypedUserRecord

  let payload = props.payload
  if (!payload) {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  }

  const { data, error } = await fetchDashboardData(payload, typedUser)

  if (error || !data) {
    return <StudioDashboardView state="error" errorMessage={error} />
  }

  return <StudioDashboardView state="ideal" data={data} />
}
