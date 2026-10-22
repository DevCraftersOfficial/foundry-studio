import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Post, Category, Media, User } from '@/payload-types'

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

  // 1. Fetch published posts
  const postsData = await payload.find({
    collection: 'posts',
    where: {
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
    },
    sort: '-publishedAt',
    depth: 2,
    limit: 10,
  })

  // 2. Fetch categories for navigation
  const categoriesData = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 10,
  })

  const posts = postsData.docs as Post[]
  const categories = categoriesData.docs as Category[]

  const featuredPost = posts.length > 0 ? posts[0] : null
  const regularPosts = posts.length > 1 ? posts.slice(1) : []

  return (
    <div>
      {/* Category Navigation Bar */}
      {categories.length > 0 && (
        <nav className="nav-bar" aria-label="Sections">
          <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <Link href="/" className="nav-link active">
              Front Page
            </Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="nav-link">
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className="container">
        {/* Featured Story */}
        {featuredPost && (
          <section className="featured-hero" aria-label="Lead Story">
            <div className="hero-grid">
              <div className="hero-content">
                <div className="hero-meta">
                  {featuredPost.categories && featuredPost.categories.length > 0 && (
                    <span className="category-badge">
                      {typeof featuredPost.categories[0] === 'object'
                        ? (featuredPost.categories[0] as Category).name
                        : 'Dispatch'}
                    </span>
                  )}
                  <time className="meta-time" dateTime={featuredPost.publishedAt || ''}>
                    {formatDate(featuredPost.publishedAt)}
                  </time>
                </div>
                <h2 className="hero-title">
                  <Link href={`/posts/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>
                {featuredPost.excerpt && (
                  <p className="hero-excerpt">{featuredPost.excerpt}</p>
                )}
                <div className="byline">
                  <span>By</span>
                  <span className="byline-author">
                    {typeof featuredPost.author === 'object' && featuredPost.author
                      ? (featuredPost.author as User).name
                      : 'Foundry Editorial'}
                  </span>
                </div>
              </div>
              <div className="hero-image-wrap">
                {featuredPost.featuredImage && typeof featuredPost.featuredImage === 'object' ? (
                  <Image
                    src={(featuredPost.featuredImage as Media).url || ''}
                    alt={(featuredPost.featuredImage as Media).alt || featuredPost.title}
                    fill
                    className="hero-image"
                    priority
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Foundry Studio Lead Dispatch
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Regular Articles Section */}
        {regularPosts.length > 0 && (
          <section className="articles-section" aria-label="Recent Stories">
            <div className="section-header">
              <h3 className="section-title">Latest Dispatches</h3>
            </div>
            <div className="article-grid">
              {regularPosts.map((post) => {
                const category =
                  post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
                    ? (post.categories[0] as Category).name
                    : null
                const authorName =
                  typeof post.author === 'object' && post.author
                    ? (post.author as User).name
                    : 'Foundry Editorial'

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
                    </div>
                    <h4 className="article-card-title">
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                    </h4>
                    {post.excerpt && <p className="article-card-excerpt">{post.excerpt}</p>}
                    <div className="article-card-footer">
                      <span>By {authorName}</span>
                      <span>Read Story &rarr;</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="empty-state">
            <h2 className="empty-state-title">The Foundry Presses are Preparing</h2>
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
