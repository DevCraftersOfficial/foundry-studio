import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { draftMode, headers } from 'next/headers'
import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import type { Post, Category, Tag, Media, User } from '@/payload-types'
import { RichText } from '@/components/editorial/RichText'
import { getSiteUrl } from '@/lib/site-url'
import { getPublicPostWhere, isPostPubliclyEligible } from '@/lib/publishing'
import { calculateReadingTime } from '@/lib/reading-time'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return ''
  }
}

export async function getPost(
  slug: string,
  isDraftMode = false,
  overrideHeaders?: Headers,
): Promise<Post | null> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  // If in draft mode, verify the authenticated session and role authorization:
  // Draft Mode cookies alone CANNOT grant access to unauthorized drafts.
  if (isDraftMode) {
    let requestHeaders: Headers
    if (overrideHeaders) {
      requestHeaders = overrideHeaders
    } else {
      try {
        requestHeaders = await headers()
      } catch {
        return null
      }
    }
    const { user } = await payload.auth({ headers: requestHeaders })

    // Unauthenticated visitors cannot access drafts even with Draft Mode cookie active
    if (!user) {
      return null
    }

    const draftResult = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: slug,
        },
      },
      overrideAccess: true,
      depth: 2,
      limit: 1,
    })

    const post = (draftResult.docs[0] as Post) || null
    if (!post) {
      return null
    }

    const isPublic = isPostPubliclyEligible(post)

    if (isPublic) {
      return post
    }

    // Role-based preview authorization for unpublished content:
    if (user.role === 'admin' || user.role === 'editor') {
      return post
    }

    if (user.role === 'author') {
      const authorId =
        typeof post.author === 'object' && post.author !== null
          ? (post.author as User).id
          : post.author
      if (authorId === user.id) {
        return post
      }
      // Author is forbidden from previewing other authors' drafts
      return null
    }

    return null
  }

  // Standard public reader query: ONLY published content where publishedAt <= now
  const result = await payload.find({
    collection: 'posts',
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        getPublicPostWhere(now),
      ],
    },
    depth: 2,
    limit: 1,
  })

  return (result.docs[0] as Post) || null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  let isDraft = false
  try {
    const draft = await draftMode()
    isDraft = draft.isEnabled
  } catch {
    isDraft = false
  }
  const post = await getPost(slug, isDraft)

  if (!post) {
    return {
      title: 'Story Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = post.title
  const description = post.excerpt || 'Read the full dispatch on Foundry Studio.'

  const ogImages = []
  if (post.featuredImage && typeof post.featuredImage === 'object') {
    const media = post.featuredImage as Media
    if (media.url) {
      ogImages.push({
        url: media.url,
        alt: media.alt || title,
      })
    }
  }

  return {
    title,
    description,
    robots: isDraft ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/posts/${slug}`,
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params
  let isDraftMode = false
  try {
    const draft = await draftMode()
    isDraftMode = draft.isEnabled
  } catch {
    isDraftMode = false
  }
  const post = await getPost(slug, isDraftMode)

  if (!post) {
    notFound()
  }

  const readingTime = calculateReadingTime(post.content)

  // Fetch up to 3 related published stories in the same categories
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const now = new Date().toISOString()

  const categoryIds = (post.categories || [])
    .map((cat) => (typeof cat === 'object' && cat !== null ? cat.id : cat))
    .filter((id): id is number => typeof id === 'number')

  let relatedPosts: Post[] = []
  if (categoryIds.length > 0) {
    const categoryWhere: Where =
      categoryIds.length === 1
        ? { categories: { contains: categoryIds[0] } }
        : { or: categoryIds.map((id) => ({ categories: { contains: id } })) }

    const relatedData = await payload.find({
      collection: 'posts',
      where: {
        and: [
          getPublicPostWhere(now),
          {
            id: {
              not_equals: post.id,
            },
          },
          categoryWhere,
        ],
      },
      sort: '-publishedAt',
      depth: 2,
      limit: 3,
    })
    relatedPosts = relatedData.docs as Post[]
  }

  const category =
    post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
      ? (post.categories[0] as Category).name
      : null

  const authorName =
    typeof post.author === 'object' && post.author
      ? (post.author as User).name
      : 'Foundry Editorial'

  const featuredMedia =
    post.featuredImage && typeof post.featuredImage === 'object'
      ? (post.featuredImage as Media)
      : null

  const tags = (post.tags || []).filter(
    (tag): tag is Tag => typeof tag === 'object' && tag !== null && 'name' in tag,
  )

  const siteUrl = getSiteUrl()
  const articleUrl = `${siteUrl}/posts/${post.slug}`
  const imageUrl = featuredMedia?.url
    ? (featuredMedia.url.startsWith('http') ? featuredMedia.url : `${siteUrl}${featuredMedia.url}`)
    : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Foundry Studio',
      url: siteUrl,
    },
    ...(imageUrl ? { image: [imageUrl] } : {}),
  }

  return (
    <>
      {!isDraftMode && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      {isDraftMode && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--status-review-bg)',
            color: 'var(--status-review-text)',
            padding: '0.625rem 1.5rem',
            textAlign: 'center',
            fontSize: '0.8125rem',
            fontWeight: 700,
            borderBottom: '1px solid var(--border-strong)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Editorial Draft Preview Mode Active • Status: {post.status} •{' '}
          <Link href="/api/exit-preview" prefetch={false} style={{ textDecoration: 'underline', marginLeft: '0.5rem' }}>
            Exit Preview
          </Link>
        </div>
      )}

      <article className="article-detail">
        <div className="container">
          {/* Header Section */}
          <header className="article-header">
            <Link href="/" className="article-back-link">
              &larr; Front Page
            </Link>

            {category && (
              <div>
                <span className="category-badge">{category}</span>
              </div>
            )}

            <h1 className="article-title">{post.title}</h1>

            {post.excerpt && <p className="article-standfirst">{post.excerpt}</p>}

            <div className="article-meta-row">
              <span>By <strong>{authorName}</strong></span>
              <span aria-hidden="true">&bull;</span>
              <time dateTime={post.publishedAt || ''}>{formatDate(post.publishedAt)}</time>
              <span aria-hidden="true">&bull;</span>
              <span
                className="reading-time-badge"
                aria-label={`Estimated reading time: ${readingTime.text}`}
              >
                {readingTime.text}
              </span>
            </div>
          </header>

          {/* Featured Media */}
          {featuredMedia && featuredMedia.url && (
            <figure className="article-featured-media">
              <div className="article-media-frame" style={{ position: 'relative' }}>
                <Image
                  src={featuredMedia.url}
                  alt={featuredMedia.alt || post.title}
                  fill
                  priority
                  sizes="(max-width: 960px) 100vw, 960px"
                />
              </div>
              {featuredMedia.caption && (
                <figcaption className="article-caption">{featuredMedia.caption}</figcaption>
              )}
            </figure>
          )}

          {/* Article Body */}
          <div className="article-body-container">
            <RichText content={post.content} />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <footer className="article-tags-wrap">
              <span className="tags-label">Filed Under:</span>
              {tags.map((tag) => (
                <span key={tag.id} className="tag-pill">
                  #{tag.name}
                </span>
              ))}
            </footer>
          )}

          {/* Related Stories Section */}
          {relatedPosts.length > 0 && (
            <section className="related-stories-section" aria-label="Related Stories">
              <div className="section-header">
                <div>
                  <div className="section-eyebrow">More in this section</div>
                  <h2 className="section-title">Related Dispatches</h2>
                </div>
              </div>
              <div className="article-grid">
                {relatedPosts.map((relPost) => {
                  const relCategory =
                    relPost.categories && relPost.categories.length > 0 && typeof relPost.categories[0] === 'object'
                      ? (relPost.categories[0] as Category).name
                      : null
                  const relAuthorName =
                    typeof relPost.author === 'object' && relPost.author
                      ? (relPost.author as User).name
                      : 'Foundry Editorial'
                  const relReadingTime = calculateReadingTime(relPost.content)

                  return (
                    <article key={relPost.id} className="article-card">
                      {relPost.featuredImage && typeof relPost.featuredImage === 'object' && (
                        <div className="article-card-image" style={{ position: 'relative' }}>
                          <Image
                            src={(relPost.featuredImage as Media).url || ''}
                            alt={(relPost.featuredImage as Media).alt || relPost.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="article-card-meta">
                        {relCategory && <span className="category-badge">{relCategory}</span>}
                        <time className="meta-time" dateTime={relPost.publishedAt || ''}>
                          {formatDate(relPost.publishedAt)}
                        </time>
                        <span
                          className="reading-time-pill"
                          aria-label={`Estimated reading time: ${relReadingTime.text}`}
                        >
                          {relReadingTime.text}
                        </span>
                      </div>
                      <h3 className="article-card-title">
                        <Link href={`/posts/${relPost.slug}`}>{relPost.title}</Link>
                      </h3>
                      {relPost.excerpt && <p className="article-card-excerpt">{relPost.excerpt}</p>}
                      <div className="article-card-footer">
                        <span>By {relAuthorName}</span>
                        <span>Read Story &rarr;</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  )
}
