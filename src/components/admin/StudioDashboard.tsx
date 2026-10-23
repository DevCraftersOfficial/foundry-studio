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

async function fetchDashboardData(
  payloadInstance: Payload,
  user: TypedUserRecord,
): Promise<{ data?: StudioDashboardData; error?: string }> {
  const role = user.role || 'author'
  const isAuthor = role === 'author'
  const isAdmin = role === 'admin'

  try {
    if (isAuthor) {
      // Authors: Strictly query own drafts, own submissions in review, own scheduled, and published posts
      const [draftsRes, inReviewRes, scheduledRes, publishedRes] = await Promise.all([
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
          },
          reviewQueue: (inReviewRes.docs as PostDocLike[]).map(mapPostToQueueItem),
          drafts: (draftsRes.docs as PostDocLike[]).map(mapPostToQueueItem),
          scheduled: (scheduledRes.docs as PostDocLike[]).map(mapPostToQueueItem),
          published: (publishedRes.docs as PostDocLike[]).map(mapPostToQueueItem),
        },
      }
    }

    // Editors and Admins: Full newsroom visibility across all authors
    const [draftsRes, inReviewRes, scheduledRes, publishedRes, usersCount, mediaCount] = await Promise.all([
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
