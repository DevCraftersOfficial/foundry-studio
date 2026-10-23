import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSiteUrl } from '@/lib/site-url'
import { getPublicPostWhere } from '@/lib/publishing'
import type { Post, Category, Tag } from '@/payload-types'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  // Strictly query ONLY eligible published content whose publication date has arrived.
  // Drafts, in-review, archived, and future-scheduled posts MUST NEVER be included in public sitemaps.
  const postsResult = await payload.find({
    collection: 'posts',
    where: getPublicPostWhere(now),
    sort: '-publishedAt',
    limit: 1000,
    overrideAccess: true,
  })

  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 100,
    overrideAccess: true,
  })

  const tagsResult = await payload.find({
    collection: 'tags',
    limit: 200,
    overrideAccess: true,
  })

  const posts = postsResult.docs as Post[]
  const categories = categoriesResult.docs as Category[]
  const tags = tagsResult.docs as Tag[]

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.publishedAt || now),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    lastModified: tag.updatedAt ? new Date(tag.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  // Extract unique author IDs from eligible published posts only
  const authorIds = Array.from(
    new Set(
      posts
        .map((p) => (typeof p.author === 'object' && p.author !== null ? p.author.id : p.author))
        .filter((id): id is number => typeof id === 'number')
    )
  )

  const authorEntries: MetadataRoute.Sitemap = authorIds.map((id) => ({
    url: `${baseUrl}/author/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...categoryEntries,
    ...tagEntries,
    ...authorEntries,
    ...postEntries,
  ]
}
