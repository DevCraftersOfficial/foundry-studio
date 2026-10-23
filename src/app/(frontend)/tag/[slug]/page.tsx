import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Post, Category, Tag, Media, User } from '@/payload-types'
import { getPublicPostWhere } from '@/lib/publishing'
import { calculateReadingTime } from '@/lib/reading-time'
import { CategoryNav } from '@/components/editorial/CategoryNav'
import { Avatar } from '@/components/ui/Avatar'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return ''
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const tagData = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (tagData.docs.length === 0) {
    return {
      title: 'Topic Not Found',
      robots: { index: false, follow: false },
    }
  }

  const tag = tagData.docs[0] as Tag
  const title = `#${tag.name} Topic Archive | Foundry Studio`
  const description = `Read all published dispatches and analyses filed under topic #${tag.name} on Foundry Studio.`

  return {
    title,
    description,
    alternates: {
      canonical: `/tag/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/tag/${slug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function TagArchivePage({ params }: PageProps) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  // 1. Fetch Tag
  const tagData = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (tagData.docs.length === 0) {
    notFound()
  }

  const tag = tagData.docs[0] as Tag

  // 2. Fetch published posts filed under this tag
  const postsData = await payload.find({
    collection: 'posts',
    where: {
      and: [
        getPublicPostWhere(now),
        {
          tags: {
            contains: tag.id,
          },
        },
      ],
    },
    sort: '-publishedAt',
    depth: 2,
    limit: 30,
  })

  const categoriesData = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 10,
  })

  const posts = postsData.docs as Post[]
  const categories = categoriesData.docs as Category[]

  return (
    <div>
      <CategoryNav categories={categories} />

      <div className="container">
        {/* Tag Header */}
        <header className="category-header" aria-label="Topic Header">
          <div className="category-header-meta">
            <span className="category-pill-active">Topic Archive</span>
            <span className="category-count">
              {posts.length} {posts.length === 1 ? 'Dispatch' : 'Dispatches'}
            </span>
          </div>
          <h1 className="category-title">#{tag.name}</h1>
          <p className="category-description">
            All editorial investigations, reporting, and critical commentary categorized under topic #{tag.name}.
          </p>
        </header>

        {/* Tag Dispatches Section */}
        <section className="articles-section" aria-label={`Dispatches filed under #${tag.name}`}>
          {posts.length > 0 ? (
            <div className="article-grid">
              {posts.map((post) => {
                const category =
                  post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
                    ? (post.categories[0] as Category).name
                    : null

                const author = typeof post.author === 'object' && post.author ? (post.author as User) : null
                const authorName = author?.name || 'Foundry Editorial'
                const readingTime = calculateReadingTime(post.content)

                return (
                  <article key={post.id} className="article-card">
                    {post.featuredImage && typeof post.featuredImage === 'object' && (
                      <div className="article-card-image" style={{ position: 'relative' }}>
                        <Image
                          src={(post.featuredImage as Media).url || ''}
                          alt={(post.featuredImage as Media).alt || post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="article-card-meta">
                      {category && <span className="category-badge">{category}</span>}
                      <time className="meta-time" dateTime={post.publishedAt || ''}>
                        {formatDate(post.publishedAt)}
                      </time>
                      <span
                        className="reading-time-pill"
                        aria-label={`Estimated reading time: ${readingTime.text}`}
                      >
                        {readingTime.text}
                      </span>
                    </div>
                    <h3 className="article-card-title">
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    {post.excerpt && <p className="article-card-excerpt">{post.excerpt}</p>}
                    <div className="article-card-footer">
                      <span className="article-card-byline">
                        <Avatar user={author} size="xs" decorative={true} />
                        {author ? (
                          <Link href={`/author/${author.id}`}>By {authorName}</Link>
                        ) : (
                          <span>By {authorName}</span>
                        )}
                      </span>
                      <span>Read Story &rarr;</span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-title">No Dispatches Under This Topic</h3>
              <p className="empty-state-text">
                There are currently no published stories filed under #{tag.name}. Explore our other editorial beats.
              </p>
              <Link href="/" className="empty-state-link">
                &larr; Return to Front Page
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
