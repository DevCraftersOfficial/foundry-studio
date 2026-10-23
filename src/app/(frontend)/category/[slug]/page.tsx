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
  const title = `${category.name} Section`
  const description = category.description || `Read stories published in ${category.name} on Foundry Studio.`

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${category.name} Section | Foundry Studio`,
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

  // 2. Fetch all categories for navigation
  const allCategoriesData = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 10,
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
    limit: 20,
  })

  const posts = postsData.docs as Post[]

  return (
    <div>
      {/* Category Navigation Bar with current active section */}
      <CategoryNav categories={allCategories} activeSlug={slug} />

      <div className="container">
        <header className="category-header" aria-label="Section Header">
          <div className="category-header-meta">
            <span className="category-pill-active">Section Beat</span>
            <span className="category-count">
              {posts.length} {posts.length === 1 ? 'Dispatch' : 'Dispatches'}
            </span>
          </div>
          <h1 className="category-title">{category.name}</h1>
          {category.description && (
            <p className="category-description">{category.description}</p>
          )}
        </header>

        <section className="articles-section" aria-label={`Dispatches in ${category.name}`}>
          {posts.length > 0 ? (
            <div className="article-grid">
              {posts.map((post) => {
                const author =
                  typeof post.author === 'object' && post.author ? (post.author as User) : null
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
                      <span className="category-badge">{category.name}</span>
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
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
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
              <h2 className="empty-state-title">No Dispatches in {category.name}</h2>
              <p className="empty-state-text">
                There are currently no live dispatches under this section. Explore our other editorial beats.
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
