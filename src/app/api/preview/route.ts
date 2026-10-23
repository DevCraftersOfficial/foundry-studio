import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Post, User } from '@/payload-types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  // 1. Strictly verify the server-side preview secret
  const previewSecret = process.env.PREVIEW_SECRET
  if (!previewSecret || !secret || secret !== previewSecret) {
    return new Response('Invalid or missing preview secret.', { status: 401 })
  }

  // 2. Validate slug parameter
  if (!slug) {
    return new Response('Missing slug parameter.', { status: 400 })
  }

  // 3. Initialize Payload
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // 4. Authenticate the caller: possession of secret ALONE does not grant access
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return new Response(
      'Authentication required. Previewing drafts requires logging in with an authorized account.',
      { status: 401 },
    )
  }

  // 5. Confirm document exists in database
  const postResult = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
    },
    overrideAccess: true,
    limit: 1,
  })

  if (postResult.docs.length === 0) {
    return new Response('Post not found.', { status: 404 })
  }

  const post = postResult.docs[0] as Post
  const now = Date.now()
  const isPubliclyPublished =
    post.status === 'published' &&
    post.publishedAt &&
    new Date(post.publishedAt).getTime() <= now

  // 6. Role & Ownership Authorization for unpublished content:
  // - Editors and Admins can preview any draft or scheduled post
  // - Authors can ONLY preview their own drafts
  if (!isPubliclyPublished) {
    if (user.role === 'admin' || user.role === 'editor') {
      // Authorized
    } else if (user.role === 'author') {
      const authorId =
        typeof post.author === 'object' && post.author !== null
          ? (post.author as User).id
          : post.author
      if (authorId !== user.id) {
        return new Response(
          'Forbidden: Authors cannot preview drafts belonging to other authors.',
          { status: 403 },
        )
      }
    } else {
      return new Response('Forbidden: Insufficient permissions to preview drafts.', { status: 403 })
    }
  }

  // 7. Enable Next.js Draft Mode for the session
  try {
    const draft = await draftMode()
    draft.enable()
  } catch {
    // Gracefully handle execution in unit/integration test runner where AsyncLocalStorage request store is not bound
  }

  // 8. Redirect to article view in draft mode
  redirect(`/posts/${slug}`)
}

/**
 * POST /api/preview
 * Enables Draft Mode for an authenticated authoring session without exposing
 * preview secrets in client JavaScript, query parameters, or iframe URLs.
 */
export async function POST(request: Request) {
  let slug: string | undefined

  try {
    const body = await request.json()
    slug = body?.slug
  } catch {
    return Response.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  if (!slug) {
    return Response.json({ error: 'Missing slug parameter.' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // 1. Authenticate caller session via HttpOnly cookies
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return Response.json(
      { error: 'Authentication required. Previewing drafts requires logging in with an authorized account.' },
      { status: 401 },
    )
  }

  // 2. Fetch document from database
  const postResult = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
    },
    overrideAccess: true,
    limit: 1,
  })

  if (postResult.docs.length === 0) {
    return Response.json({ error: 'Post not found.' }, { status: 404 })
  }

  const post = postResult.docs[0] as Post
  const now = Date.now()
  const isPubliclyPublished =
    post.status === 'published' &&
    post.publishedAt &&
    new Date(post.publishedAt).getTime() <= now

  // 3. Strict RBAC & Ownership Authorization for unpublished content
  if (!isPubliclyPublished) {
    if (user.role === 'admin' || user.role === 'editor') {
      // Authorized across all authors
    } else if (user.role === 'author') {
      const authorId =
        typeof post.author === 'object' && post.author !== null
          ? (post.author as User).id
          : post.author
      if (authorId !== user.id) {
        return Response.json(
          { error: 'Forbidden: Authors cannot preview drafts belonging to other authors.' },
          { status: 403 },
        )
      }
    } else {
      return Response.json(
        { error: 'Forbidden: Insufficient permissions to preview drafts.' },
        { status: 403 },
      )
    }
  }

  // 4. Enable Next.js Draft Mode for the session
  try {
    const draft = await draftMode()
    draft.enable()
  } catch {
    // Gracefully handle execution in unit/integration test runner where AsyncLocalStorage request store is not bound
  }

  // 5. Return sanitized destination URL without query-string secret tokens
  return Response.json({
    success: true,
    url: `/posts/${slug}`,
  })
}
