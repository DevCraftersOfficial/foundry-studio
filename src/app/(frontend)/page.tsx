import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Post, Category, Media, User } from '@/payload-types'
import { getPublicPostWhere } from '@/lib/publishing'
import { calculateReadingTime } from '@/lib/reading-time'
import { CategoryNav } from '@/components/editorial/CategoryNav'
import { Avatar } from '@/components/ui/Avatar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Foundry Studio — Independent Journalism & Editorial Publishing',
  description: 'An authoritative editorial publication dedicated to investigative journalism, critical cultural analysis, and literary craftsmanship.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Foundry Studio — Independent Journalism & Editorial Publishing',
    description: 'An authoritative editorial publication dedicated to investigative journalism, critical cultural analysis, and literary craftsmanship.',
    type: 'website',
    url: '/',
  },
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

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  // 1. Fetch published posts using canonical eligibility filter
  const postsData = await payload.find({
    collection: 'posts',
    where: getPublicPostWhere(now),
    sort: '-publishedAt',
    depth: 2,
    limit: 12,
  })

  // 2. Fetch categories for navigation and beats section
  const categoriesData = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 10,
  })

  const posts = postsData.docs as Post[]
  const categories = categoriesData.docs as Category[]

  const featuredPost = posts.length > 0 ? posts[0] : null
  const secondaryPost = posts.length > 1 ? posts[1] : null
  const gridPosts = posts.length > 2 ? posts.slice(2) : []

  const featuredReadingTime = featuredPost ? calculateReadingTime(featuredPost.content) : null
  const secondaryReadingTime = secondaryPost ? calculateReadingTime(secondaryPost.content) : null

  const featuredAuthor =
    featuredPost && typeof featuredPost.author === 'object' && featuredPost.author
      ? (featuredPost.author as User)
      : null

  const secondaryAuthor =
    secondaryPost && typeof secondaryPost.author === 'object' && secondaryPost.author
      ? (secondaryPost.author as User)
      : null

  const featuredCategory =
    featuredPost?.categories && featuredPost.categories.length > 0 && typeof featuredPost.categories[0] === 'object'
      ? (featuredPost.categories[0] as Category)
      : null

  const secondaryCategory =
    secondaryPost?.categories && secondaryPost.categories.length > 0 && typeof secondaryPost.categories[0] === 'object'
      ? (secondaryPost.categories[0] as Category)
      : null

  return (
    <div>
      {/* Category Navigation Bar */}
      <CategoryNav categories={categories} activeSlug="frontpage" />

      <div className="container">
        {/* Asymmetric Editorial Hero Section */}
        {featuredPost && (
          <section className="editorial-hero" aria-label="Lead Stories">
            <div className={`editorial-hero-grid ${secondaryPost ? 'editorial-hero-grid--dual' : 'editorial-hero-grid--single'}`}>
              {/* Primary Lead Story (Broadsheet Hero) */}
              <article className="hero-lead-card">
                <div className="hero-lead-image-wrap">
                  {featuredPost.featuredImage && typeof featuredPost.featuredImage === 'object' ? (
                    <Image
                      src={(featuredPost.featuredImage as Media).url || ''}
                      alt={(featuredPost.featuredImage as Media).alt || featuredPost.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 65vw"
                      className="hero-lead-image"
                      priority
                    />
                  ) : (
                    <div className="hero-image-placeholder">
                      <span>Foundry Lead Dispatch</span>
                    </div>
                  )}
                </div>

                <div className="hero-lead-content">
                  <div className="hero-meta">
                    {featuredCategory && (
                      <Link href={`/category/${featuredCategory.slug}`} className="category-badge">
                        {featuredCategory.name}
                      </Link>
                    )}
                    <time className="meta-time" dateTime={featuredPost.publishedAt || ''}>
                      {formatDate(featuredPost.publishedAt)}
                    </time>
                    {featuredReadingTime && (
                      <span
                        className="reading-time-pill"
                        aria-label={`Estimated reading time: ${featuredReadingTime.text}`}
                      >
                        {featuredReadingTime.text}
                      </span>
                    )}
                  </div>

                  <h1 className="hero-lead-title">
                    <Link href={`/posts/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h1>

                  {featuredPost.excerpt && (
                    <p className="hero-lead-excerpt">{featuredPost.excerpt}</p>
                  )}

                  <div className="hero-byline-row">
                    <Avatar user={featuredAuthor} size="sm" decorative={true} />
                    <span className="byline-author-info">
                      <span>By </span>
                      {featuredAuthor ? (
                        <Link href={`/author/${featuredAuthor.id}`} className="byline-author-name">
                          {featuredAuthor.name}
                        </Link>
                      ) : (
                        <span className="byline-author-name">Foundry Editorial</span>
                      )}
                    </span>
                    <span className="hero-read-cta">
                      <Link href={`/posts/${featuredPost.slug}`}>Read Full Dispatch &rarr;</Link>
                    </span>
                  </div>
                </div>
              </article>

              {/* Secondary Feature Sidebar (Asymmetric Column) */}
              {secondaryPost && (
                <aside className="hero-secondary-card" aria-label="Editor's Selection">
                  <div className="hero-secondary-badge-row">
                    <span className="hero-section-kicker">Editor’s Selection</span>
                  </div>

                  {secondaryPost.featuredImage && typeof secondaryPost.featuredImage === 'object' && (
                    <div className="hero-secondary-image-wrap">
                      <Image
                        src={(secondaryPost.featuredImage as Media).url || ''}
                        alt={(secondaryPost.featuredImage as Media).alt || secondaryPost.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 35vw"
                        className="hero-secondary-image"
                      />
                    </div>
                  )}

                  <div className="hero-secondary-content">
                    <div className="hero-meta">
                      {secondaryCategory && (
                        <Link href={`/category/${secondaryCategory.slug}`} className="category-badge">
                          {secondaryCategory.name}
                        </Link>
                      )}
                      <time className="meta-time" dateTime={secondaryPost.publishedAt || ''}>
                        {formatDate(secondaryPost.publishedAt)}
                      </time>
                      {secondaryReadingTime && (
                        <span
                          className="reading-time-pill"
                          aria-label={`Estimated reading time: ${secondaryReadingTime.text}`}
                        >
                          {secondaryReadingTime.text}
                        </span>
                      )}
                    </div>

                    <h2 className="hero-secondary-title">
                      <Link href={`/posts/${secondaryPost.slug}`}>{secondaryPost.title}</Link>
                    </h2>

                    {secondaryPost.excerpt && (
                      <p className="hero-secondary-excerpt">{secondaryPost.excerpt}</p>
                    )}

                    <div className="hero-byline-row">
                      <Avatar user={secondaryAuthor} size="xs" decorative={true} />
                      <span className="byline-author-info">
                        <span>By </span>
                        {secondaryAuthor ? (
                          <Link href={`/author/${secondaryAuthor.id}`} className="byline-author-name">
                            {secondaryAuthor.name}
                          </Link>
                        ) : (
                          <span className="byline-author-name">Foundry Editorial</span>
                        )}
                      </span>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </section>
        )}

        {/* Regular Articles Section */}
        {gridPosts.length > 0 && (
          <section className="articles-section" aria-label="Recent Dispatches">
            <div className="section-header">
              <div className="section-header-left">
                <span className="section-kicker">Frontpage Wire</span>
                <h2 className="section-title">Latest Dispatches</h2>
              </div>
              <Link href="/search" className="section-header-link">
                Search Complete Archives &rarr;
              </Link>
            </div>

            <div className="article-grid">
              {gridPosts.map((post) => {
                const category =
                  post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
                    ? (post.categories[0] as Category)
                    : null

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
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="article-card-meta">
                      {category && (
                        <Link href={`/category/${category.slug}`} className="category-badge">
                          {category.name}
                        </Link>
                      )}
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
                      <Link href={`/posts/${post.slug}`} className="article-card-cta">
                        Read Story &rarr;
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Editorial Beats Directory */}
        {categories.length > 0 && (
          <section className="editorial-beats-section" aria-label="Editorial Sections">
            <div className="section-header">
              <div className="section-header-left">
                <span className="section-kicker">Coverage</span>
                <h2 className="section-title">Editorial Beats &amp; Sections</h2>
              </div>
            </div>
            <div className="beats-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="beat-card">
                  <span className="beat-card-name">{cat.name}</span>
                  {cat.description && <span className="beat-card-desc">{cat.description}</span>}
                  <span className="beat-card-link">Browse Section &rarr;</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="empty-state">
            <h1 className="empty-state-title">The Foundry Presses are Preparing</h1>
            <p className="empty-state-text">
              No articles are currently live. Editorial writers and editors can log in to the editorial workspace to draft, review, and release inaugural stories.
            </p>
            <Link href="/admin" className="empty-state-link">
              Access Editorial Workspace
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
