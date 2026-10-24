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
import { Avatar } from '@/components/ui/Avatar'
import {
  cleanEditorialTitle,
  cleanEditorialCategory,
  cleanEditorialTag,
} from '@/lib/editorial-format'

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
  try {
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
  } catch (err) {
    console.error('[getPost] caught database fetch error:', err)
    return null
  }
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

  // Fallback related posts if fewer than 2 found in same category
  if (relatedPosts.length < 2) {
    const existingIds = [post.id, ...relatedPosts.map((p) => p.id)]
    const fallbackData = await payload.find({
      collection: 'posts',
      where: {
        and: [
          getPublicPostWhere(now),
          {
            id: {
              not_in: existingIds,
            },
          },
        ],
      },
      sort: '-publishedAt',
      depth: 2,
      limit: 3 - relatedPosts.length,
    })
    relatedPosts = [...relatedPosts, ...(fallbackData.docs as Post[])]
  }

  const category =
    post.categories && post.categories.length > 0 && typeof post.categories[0] === 'object'
      ? (post.categories[0] as Category)
      : null

  const author =
    typeof post.author === 'object' && post.author ? (post.author as User) : null
  const authorName = author?.name || 'Foundry Editorial'

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
      ...(author ? { url: `${siteUrl}/author/${author.id}` } : {}),
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
          className="draft-mode-banner"
        >
          Editorial Draft Preview Mode Active • Status: {post.status} •{' '}
          <Link href="/api/exit-preview" prefetch={false} className="draft-mode-exit-link">
            Exit Preview
          </Link>
        </div>
      )}

      <article className="article-detail">
        <div className="container">
          {/* Header Section */}
          <header className="article-header">
            <nav className="article-breadcrumbs" aria-label="Breadcrumb navigation">
              <Link href="/" className="article-back-link">
                &larr; Front Page
              </Link>
              {category && (
                <>
                  <span className="breadcrumb-sep">/</span>
                  <Link href={`/category/${category.slug}`} className="breadcrumb-category">
                    {cleanEditorialCategory(category.name)}
                  </Link>
                </>
              )}
            </nav>

            {category && (
              <div className="article-category-badge-wrap">
                <Link href={`/category/${category.slug}`} className="category-badge">
                  {cleanEditorialCategory(category.name)}
                </Link>
              </div>
            )}

            <h1 className="article-title">{cleanEditorialTitle(post.title)}</h1>

            {post.excerpt && <p className="article-standfirst">{post.excerpt}</p>}

            {/* Author Attribution Card */}
            <div className="article-author-card" aria-label="Author Information">
              <div className="article-author-card-left">
                <Avatar user={author} size="md" decorative={false} alt={`${authorName}’s portrait`} />
                <div className="article-author-card-text">
                  <div className="article-author-card-name-row">
                    {author ? (
                      <Link href={`/author/${author.id}`} className="article-author-card-name">
                        {authorName}
                      </Link>
                    ) : (
                      <span className="article-author-card-name">{authorName}</span>
                    )}
                    {author?.role && (
                      <span className="article-author-role-pill">
                        {author.role === 'admin'
                          ? 'Lead Editor'
                          : author.role === 'editor'
                          ? 'Editor'
                          : 'Staff Author'}
                      </span>
                    )}
                  </div>
                  <div className="article-author-card-meta">
                    <time dateTime={post.publishedAt || ''}>{formatDate(post.publishedAt)}</time>
                    <span aria-hidden="true">&bull;</span>
                    <span
                      className="reading-time-badge"
                      aria-label={`Estimated reading time: ${readingTime.text}`}
                    >
                      {readingTime.text}
                    </span>
                  </div>
                </div>
              </div>
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

          {/* Article Long-Form Body with 68ch Max Reading Geometry */}
          <div className="article-body-container">
            <RichText content={post.content} />
          </div>

          {/* Filed Under Topic Tags */}
          {tags.length > 0 && (
            <footer className="article-tags-wrap" aria-label="Topic Tags">
              <span className="tags-label">Filed Under:</span>
              <div className="tags-list">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-pill">
                    #{cleanEditorialTag(tag.name)}
                  </Link>
                ))}
              </div>
            </footer>
          )}

          {/* Related Stories Section */}
          {(() => {
            const currentClean = cleanEditorialTitle(post.title).toLowerCase()
            const seenRel = new Set<string>([currentClean])
            const uniqueRelated = relatedPosts.filter((rp) => {
              const clean = cleanEditorialTitle(rp.title).toLowerCase()
              if (seenRel.has(clean)) return false
              seenRel.add(clean)
              return true
            })

            if (uniqueRelated.length === 0) return null

            return (
              <section className="article-related-section" aria-label="Related Dispatches">
                <div className="section-header">
                  <div className="section-header-left">
                    <span className="section-kicker">Continue Reading</span>
                    <h2 className="section-title">Related Dispatches</h2>
                  </div>
                </div>

                <div className="article-grid">
                  {uniqueRelated.map((relPost) => {
                    const relCategory =
                      relPost.categories && relPost.categories.length > 0 && typeof relPost.categories[0] === 'object'
                        ? (relPost.categories[0] as Category)
                        : null

                    const relAuthor =
                      typeof relPost.author === 'object' && relPost.author
                        ? (relPost.author as User)
                        : null
                    const relAuthorName = relAuthor?.name || 'Foundry Editorial'
                    const relReadingTime = calculateReadingTime(relPost.content)

                    return (
                      <article key={relPost.id} className="article-card">
                        {relPost.featuredImage && typeof relPost.featuredImage === 'object' && (relPost.featuredImage as Media).url && (
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
                          {relCategory && (
                            <Link href={`/category/${relCategory.slug}`} className="category-badge">
                              {cleanEditorialCategory(relCategory.name)}
                            </Link>
                          )}
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
                          <Link href={`/posts/${relPost.slug}`}>
                            {cleanEditorialTitle(relPost.title)}
                          </Link>
                        </h3>
                        {relPost.excerpt && <p className="article-card-excerpt">{relPost.excerpt}</p>}
                        <div className="article-card-footer">
                          <span className="article-card-byline">
                            <Avatar user={relAuthor} size="xs" decorative={true} />
                            {relAuthor ? (
                              <Link href={`/author/${relAuthor.id}`}>By {relAuthorName}</Link>
                            ) : (
                              <span>By {relAuthorName}</span>
                            )}
                          </span>
                          <Link href={`/posts/${relPost.slug}`} className="article-card-cta">
                            Read Story &rarr;
                          </Link>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })()}
        </div>
      </article>
    </>
  )
}
