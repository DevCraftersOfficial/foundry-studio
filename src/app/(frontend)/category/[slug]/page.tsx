import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Post, Category, Media, User } from '@/payload-types'
import { getPublicPostWhere } from '@/lib/publishing'
import { calculateReadingTime } from '@/lib/reading-time'
import { CategoryNav } from '@/components/editorial/CategoryNav'
import { Avatar } from '@/components/ui/Avatar'
import { cleanEditorialTitle, cleanEditorialCategory } from '@/lib/editorial-format'

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

  const categoryData = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (categoryData.docs.length === 0) {
    return {
      title: 'Category Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const category = categoryData.docs[0] as Category
  const cleanName = cleanEditorialCategory(category.name)
  const title = `${cleanName} Section`
  const description = category.description || `Read stories published in ${cleanName} on Foundry Studio.`

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${cleanName} Section | Foundry Studio`,
      description,
      type: 'website',
      url: `/category/${slug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  // 1. Fetch category
  const categoryData = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (categoryData.docs.length === 0) {
    notFound()
  }

  const category = categoryData.docs[0] as Category
  const cleanName = cleanEditorialCategory(category.name)

  // 2. Fetch all categories for navigation
  const allCategoriesData = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 20,
  })
  const allCategories = allCategoriesData.docs as Category[]

  // 3. Fetch all published posts in this category using canonical filter
  const postsData = await payload.find({
    collection: 'posts',
    where: {
      and: [
        getPublicPostWhere(now),
        {
          categories: { contains: category.id },
        },
      ],
    },
    sort: '-publishedAt',
    depth: 2,
    limit: 30,
  })

  const posts = postsData.docs as Post[]

  // Deduplicate identical test-generated posts by clean story title
  const seenPostTitles = new Set<string>()
  const displayPosts = posts.filter((p) => {
    const clean = cleanEditorialTitle(p.title).toLowerCase()
    if (seenPostTitles.has(clean)) return false
    seenPostTitles.add(clean)
    return true
  })

  return (
    <div>
      {/* Category Navigation Bar with current active section */}
      <CategoryNav categories={allCategories} activeSlug={slug} />

      <div className="container">
        <header className="category-header" aria-label="Section Header">
          <div className="category-header-meta">
            <span className="category-pill-active">Section Beat</span>
            <span className="category-count">
              {displayPosts.length} {displayPosts.length === 1 ? 'Dispatch' : 'Dispatches'}
            </span>
          </div>
          <h1 className="category-title">{cleanName}</h1>
          {category.description && (
            <p className="category-description">{category.description}</p>
          )}
        </header>

        <section className="articles-section" aria-label={`Dispatches in ${cleanName}`}>
          {displayPosts.length > 0 ? (
            <div className="article-grid">
              {displayPosts.map((post) => {
                const author =
                  typeof post.author === 'object' && post.author ? (post.author as User) : null
                const authorName = author?.name || 'Foundry Editorial'
                const readingTime = calculateReadingTime(post.content)

                return (
                  <article key={post.id} className="article-card">
                    {post.featuredImage && typeof post.featuredImage === 'object' && (post.featuredImage as Media).url && (
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
                      <span className="category-badge">{cleanName}</span>
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
                    <h2 className="article-card-title">
                      <Link href={`/posts/${post.slug}`}>
                        {cleanEditorialTitle(post.title)}
                      </Link>
                    </h2>
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
                      <Link href={`/posts/${post.slug}`} className="article-card-cta">
                        Read Story &rarr;
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h2 className="empty-state-title">No Dispatches Filed in {cleanName}</h2>
              <p className="empty-state-text">
                This beat currently has no published articles. Dispatches submitted and approved for release will appear here.
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
