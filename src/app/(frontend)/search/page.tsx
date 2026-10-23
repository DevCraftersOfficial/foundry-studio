import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import type { Post, Category, Media, User } from '@/payload-types'
import { getPublicPostWhere } from '@/lib/publishing'
import { calculateReadingTime } from '@/lib/reading-time'
import { CategoryNav } from '@/components/editorial/CategoryNav'
import { Avatar } from '@/components/ui/Avatar'

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export const metadata: Metadata = {
  title: 'Search Publication Archives — Foundry Studio',
  description: 'Search published editorial dispatches, investigative journalism, and analysis across Foundry Studio.',
  robots: {
    index: false,
    follow: true,
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const rawQuery = (q || '').trim()
  const query = rawQuery.slice(0, 100) // Bound query length for safety

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  let results: Post[] = []
  let hasSearched = false

  if (query.length > 0) {
    hasSearched = true

    // Server-side Postgres query: strictly enforce public publication eligibility
    const searchWhere: Where = {
      and: [
        getPublicPostWhere(now),
        {
          or: [
            { title: { like: query } },
            { excerpt: { like: query } },
          ],
        },
      ],
    }

    try {
      const searchData = await payload.find({
        collection: 'posts',
        where: searchWhere,
        sort: '-publishedAt',
        depth: 2,
        limit: 30,
      })
      results = searchData.docs as Post[]
    } catch {
      results = []
    }
  }

  // Fetch categories for navigation and quick links
  const categoriesData = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 10,
  })
  const categories = categoriesData.docs as Category[]

  return (
    <div>
      <CategoryNav categories={categories} />

      <div className="container">
        {/* Search Header & Input Form */}
        <header className="search-header" aria-label="Archive Search">
          <div className="search-header-inner">
            <span className="search-header-badge">Archive Search</span>
            <h1 className="search-header-title">Search Foundry Studio</h1>
            <p className="search-header-sub">
              Query our complete public archive of investigations, reporting, and commentary.
            </p>

            <form action="/search" method="GET" className="search-form" role="search">
              <div className="search-input-wrap">
                <svg
                  className="search-input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by headline or topic..."
                  className="search-input"
                  aria-label="Search dispatches"
                  required
                  autoFocus={!hasSearched}
                />
              </div>
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>
          </div>
        </header>

        {/* Results Section */}
        <section className="articles-section" aria-label="Search Results">
          {hasSearched ? (
            <>
              <div className="section-header">
                <h2 className="section-title">
                  {results.length > 0
                    ? `Found ${results.length} ${results.length === 1 ? 'Dispatch' : 'Dispatches'} for “${query}”`
                    : `No results found for “${query}”`}
                </h2>
              </div>

              {results.length > 0 ? (
                <div className="article-grid">
                  {results.map((post) => {
                    const category =
                      post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
                        ? (post.categories[0] as Category).name
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
                  <h3 className="empty-state-title">No Dispatches Match Your Search</h3>
                  <p className="empty-state-text">
                    We couldn’t find any published dispatches matching “{query}”. Try searching with broader keywords, or browse our editorial sections below.
                  </p>
                  <div className="search-category-suggestions">
                    <span className="search-suggest-label">Explore Sections:</span>
                    <div className="search-suggest-chips">
                      {categories.map((cat) => (
                        <Link key={cat.id} href={`/category/${cat.slug}`} className="search-suggest-chip">
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="search-starter-guide">
              <h3 className="search-guide-title">Browse by Editorial Section</h3>
              <p className="search-guide-sub">
                Select a section to view all dispatches or enter keywords above.
              </p>
              <div className="search-category-grid">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`} className="search-beat-card">
                    <span className="search-beat-name">{cat.name}</span>
                    {cat.description && <span className="search-beat-desc">{cat.description}</span>}
                    <span className="search-beat-arrow">Browse Section &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
