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
    id: string
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
  const { id } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const author = (await payload.findByID({
      collection: 'users',
      id,
    })) as User

    if (!author) {
      return {
        title: 'Author Not Found',
        robots: { index: false, follow: false },
      }
    }

    const title = `${author.name} — Author Archive | Foundry Studio`
    const description = `Read dispatches and editorial journalism authored by ${author.name} on Foundry Studio.`

    return {
      title,
      description,
      alternates: {
        canonical: `/author/${id}`,
      },
      openGraph: {
        title,
        description,
        type: 'profile',
        url: `/author/${id}`,
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    }
  } catch {
    return {
      title: 'Author Not Found',
      robots: { index: false, follow: false },
    }
  }
}

export default async function AuthorArchivePage({ params }: PageProps) {
  const { id } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  let author: User | null = null
  try {
    author = (await payload.findByID({
      collection: 'users',
      id,
    })) as User
  } catch {
    notFound()
  }

  if (!author) {
    notFound()
  }

  let posts: Post[] = []
  let categories: Category[] = []

  try {
    // Strictly query ONLY eligible published content authored by this user
    const postsData = await payload.find({
      collection: 'posts',
      where: {
        and: [
          getPublicPostWhere(now),
          {
            author: { equals: author.id },
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

    posts = (postsData.docs || []) as Post[]
    categories = (categoriesData.docs || []) as Category[]
  } catch (err) {
    console.error('[AuthorArchivePage] Failed to fetch author posts/categories:', err)
  }

  return (
    <div>
      <CategoryNav categories={categories} />

      <div className="container">
        {/* Author Profile Header */}
        <header className="author-profile-hero" aria-label="Author Profile">
          <div className="author-profile-card">
            <Avatar user={author} size="lg" decorative={false} alt={`${author.name}’s profile avatar`} />
            <div className="author-profile-details">
              <div className="author-profile-meta-top">
                <span className="author-profile-badge">
                  {author.role === 'admin'
                    ? 'Senior Editorial Lead'
                    : author.role === 'editor'
                    ? 'Staff Editor'
                    : 'Staff Author'}
                </span>
                <span className="author-profile-stat">
                  {posts.length} {posts.length === 1 ? 'Dispatch' : 'Dispatches'} Published
                </span>
              </div>
              <h1 className="author-profile-name">{author.name}</h1>
              <p className="author-profile-bio">
                Author archive and published dispatches for Foundry Studio by DevCrafters.
              </p>
            </div>
          </div>
        </header>

        {/* Author Dispatches Section */}
        <section className="articles-section" aria-label={`Dispatches by ${author.name}`}>
          <div className="section-header">
            <h2 className="section-title">Published Dispatches ({posts.length})</h2>
          </div>

          {posts.length > 0 ? (
            <div className="article-grid">
              {posts.map((post) => {
                const category =
                  post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
                    ? cleanEditorialCategory((post.categories[0] as Category).name)
                    : null

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
                      <Link href={`/posts/${post.slug}`}>
                        {cleanEditorialTitle(post.title)}
                      </Link>
                    </h3>
                    {post.excerpt && <p className="article-card-excerpt">{post.excerpt}</p>}
                    <div className="article-card-footer">
                      <span className="article-card-byline">
                        <Avatar user={author} size="xs" decorative={true} />
                        <span>By {author?.name}</span>
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
              <h3 className="empty-state-title">No Published Dispatches Yet</h3>
              <p className="empty-state-text">
                {author.name} has not released any public dispatches at this time. Check back soon for forthcoming editorial releases.
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
