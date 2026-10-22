import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { Post, User, Category } from '@/payload-types'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getPost, generateMetadata } from '@/app/(frontend)/posts/[slug]/page'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { getSiteUrl } from '@/lib/site-url'
import { isPostPubliclyEligible } from '@/lib/publishing'
import { RichText, type RichTextProps } from '@/components/editorial/RichText'

let payload: Payload
let _testAdmin: User
let _testEditor: User
let testAuthor: User
let _otherAuthor: User
let authorToken: string
let otherAuthorToken: string
let editorToken: string
let testCategory: Category
let publishedPost: Post
let futurePost: Post
let maturedScheduledPost: Post
let draftPost: Post
let reviewPost: Post
let archivedPost: Post

const sampleLexicalContent = {
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal' as const,
            text: 'Foundry Studio reader and SEO verification content.',
            type: 'text',
            style: '',
            detail: 0,
            format: 0,
            version: 1,
          },
        ],
        direction: 'ltr' as const,
      },
    ],
    direction: 'ltr' as const,
  },
}

describe('FS-005 Public Reader Polish, SEO Validation, and Content Safety', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Find or create admin user
    const adminQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs005-admin@devcrafters.io' } },
    })

    if (adminQuery.docs.length > 0) {
      _testAdmin = await payload.update({
        collection: 'users',
        id: adminQuery.docs[0].id,
        data: {
          password: 'SecureTestPasswordFS005!123',
          role: 'admin',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
    } else {
      _testAdmin = await payload.create({
        collection: 'users',
        data: {
          email: 'fs005-admin@devcrafters.io',
          password: 'SecureTestPasswordFS005!123',
          role: 'admin',
          name: 'FS005 Admin',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
    }

    // Find or create test editor
    const editorQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs005-editor@devcrafters.io' } },
    })
    if (editorQuery.docs.length > 0) {
      _testEditor = await payload.update({
        collection: 'users',
        id: editorQuery.docs[0].id,
        data: {
          password: 'SecureTestPasswordFS005!123',
          role: 'editor',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
    } else {
      _testEditor = await payload.create({
        collection: 'users',
        data: {
          email: 'fs005-editor@devcrafters.io',
          password: 'SecureTestPasswordFS005!123',
          role: 'editor',
          name: 'FS005 Editor',
        },
        context: {
          allowExplicitRole: true,
        },
        overrideAccess: true,
      })
    }

    // Find or create test author
    const authorQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs005-author@devcrafters.io' } },
    })
    if (authorQuery.docs.length > 0) {
      testAuthor = await payload.update({
        collection: 'users',
        id: authorQuery.docs[0].id,
        data: {
          password: 'SecureTestPasswordFS005!123',
          role: 'author',
        },
        overrideAccess: true,
      })
    } else {
      testAuthor = await payload.create({
        collection: 'users',
        data: {
          email: 'fs005-author@devcrafters.io',
          password: 'SecureTestPasswordFS005!123',
          role: 'author',
          name: 'FS005 Author',
        },
        overrideAccess: true,
      })
    }

    // Find or create other author
    const otherQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs005-otherauthor@devcrafters.io' } },
    })
    if (otherQuery.docs.length > 0) {
      _otherAuthor = await payload.update({
        collection: 'users',
        id: otherQuery.docs[0].id,
        data: {
          password: 'SecureTestPasswordFS005!123',
          role: 'author',
        },
        overrideAccess: true,
      })
    } else {
      _otherAuthor = await payload.create({
        collection: 'users',
        data: {
          email: 'fs005-otherauthor@devcrafters.io',
          password: 'SecureTestPasswordFS005!123',
          role: 'author',
          name: 'FS005 Other Author',
        },
        overrideAccess: true,
      })
    }

    // Login users to acquire session tokens
    const authorLogin = await payload.login({
      collection: 'users',
      data: { email: 'fs005-author@devcrafters.io', password: 'SecureTestPasswordFS005!123' },
    })
    authorToken = authorLogin.token || ''

    const otherLogin = await payload.login({
      collection: 'users',
      data: { email: 'fs005-otherauthor@devcrafters.io', password: 'SecureTestPasswordFS005!123' },
    })
    otherAuthorToken = otherLogin.token || ''

    const editorLogin = await payload.login({
      collection: 'users',
      data: { email: 'fs005-editor@devcrafters.io', password: 'SecureTestPasswordFS005!123' },
    })
    editorToken = editorLogin.token || ''

    // Find or create test category
    const catQuery = await payload.find({
      collection: 'categories',
      where: { slug: { equals: 'fs005-editorial' } },
    })

    if (catQuery.docs.length > 0) {
      testCategory = catQuery.docs[0] as Category
    } else {
      testCategory = await payload.create({
        collection: 'categories',
        data: {
          name: 'FS005 Editorial',
          slug: 'fs005-editorial',
          description: 'Category for FS-005 reader tests',
        },
        overrideAccess: true,
      })
    }

    const pastDate = new Date(Date.now() - 3600000).toISOString()
    const futureDate = new Date(Date.now() + 86400000).toISOString()

    // 1. Published Post (past date)
    publishedPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'FS-005 Published Story',
        slug: 'fs005-published-story',
        excerpt: 'Excerpt for published story.',
        content: sampleLexicalContent,
        author: testAuthor.id,
        categories: [testCategory.id],
        status: 'published',
        publishedAt: pastDate,
      },
      overrideAccess: true,
    })

    // 2. Future-Scheduled Post
    futurePost = await payload.create({
      collection: 'posts',
      data: {
        title: 'FS-005 Future Post',
        slug: 'fs005-future-post',
        excerpt: 'Excerpt for future post.',
        content: sampleLexicalContent,
        author: testAuthor.id,
        status: 'scheduled',
        publishedAt: futureDate,
      },
      overrideAccess: true,
    })

    // 3. Matured Scheduled Post (status is scheduled, but publishedAt is in the past)
    maturedScheduledPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'FS-005 Matured Scheduled Post',
        slug: 'fs005-matured-scheduled-post',
        excerpt: 'Excerpt for matured scheduled post.',
        content: sampleLexicalContent,
        author: testAuthor.id,
        status: 'scheduled',
        publishedAt: pastDate,
      },
      context: {
        allowPastScheduled: true,
      },
      overrideAccess: true,
    })

    // 4. Draft Post
    draftPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'FS-005 Draft Post',
        slug: 'fs005-draft-post',
        excerpt: 'Excerpt for draft post.',
        content: sampleLexicalContent,
        author: testAuthor.id,
        status: 'draft',
      },
      overrideAccess: true,
    })

    // 5. In-Review Post
    reviewPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'FS-005 In Review Post',
        slug: 'fs005-in-review-post',
        excerpt: 'Excerpt for review post.',
        content: sampleLexicalContent,
        author: testAuthor.id,
        status: 'in_review',
      },
      overrideAccess: true,
    })

    // 6. Archived Post
    archivedPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'FS-005 Archived Post',
        slug: 'fs005-archived-post',
        excerpt: 'Excerpt for archived post.',
        content: sampleLexicalContent,
        author: testAuthor.id,
        status: 'archived',
        publishedAt: pastDate,
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    const postIds = [
      publishedPost?.id,
      futurePost?.id,
      maturedScheduledPost?.id,
      draftPost?.id,
      reviewPost?.id,
      archivedPost?.id,
    ].filter(Boolean)

    for (const id of postIds) {
      try {
        await payload.delete({
          collection: 'posts',
          id,
          overrideAccess: true,
        })
      } catch {
        // ignore
      }
    }
  })

  describe('1. Public Access & Lifecycle State Isolation', () => {
    it('allows anonymous visitors to retrieve published posts with past publication dates', async () => {
      const post = await getPost('fs005-published-story', false)
      expect(post).not.toBeNull()
      expect(post?.title).toBe('FS-005 Published Story')
      expect(post?.status).toBe('published')
    })

    it('blocks anonymous access to future-scheduled posts', async () => {
      const post = await getPost('fs005-future-post', false)
      expect(post).toBeNull()
    })

    it('strictly blocks anonymous access to scheduled posts even if publication timestamp is in the past', async () => {
      const post = await getPost('fs005-matured-scheduled-post', false)
      expect(post).toBeNull()
    })

    it('blocks anonymous access to draft posts', async () => {
      const post = await getPost('fs005-draft-post', false)
      expect(post).toBeNull()
    })

    it('blocks anonymous access to in-review posts', async () => {
      const post = await getPost('fs005-in-review-post', false)
      expect(post).toBeNull()
    })

    it('blocks anonymous access to archived posts', async () => {
      const post = await getPost('fs005-archived-post', false)
      expect(post).toBeNull()
    })

    it('returns null for non-existent or malformed slugs', async () => {
      expect(await getPost('non-existent-slug-12345', false)).toBeNull()
      expect(await getPost('', false)).toBeNull()
    })

    it('isPostPubliclyEligible helper validates status published and date in past', () => {
      expect(isPostPubliclyEligible(publishedPost)).toBe(true)
      expect(isPostPubliclyEligible(futurePost)).toBe(false)
      expect(isPostPubliclyEligible(maturedScheduledPost)).toBe(false)
      expect(isPostPubliclyEligible(draftPost)).toBe(false)
      expect(isPostPubliclyEligible(reviewPost)).toBe(false)
      expect(isPostPubliclyEligible(archivedPost)).toBe(false)
      expect(isPostPubliclyEligible(null)).toBe(false)
      expect(isPostPubliclyEligible(undefined)).toBe(false)
    })
  })

  describe('2. SEO & Metadata Generation', () => {
    it('generates canonical URL, OpenGraph, and Twitter card metadata for published posts', async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: 'fs005-published-story' }),
      })

      expect(meta.title).toBe('FS-005 Published Story')
      expect(meta.description).toBe('Excerpt for published story.')
      expect(meta.alternates?.canonical).toBe('/posts/fs005-published-story')
      expect((meta.openGraph as Record<string, unknown>)?.type).toBe('article')
      expect(meta.openGraph?.title).toBe('FS-005 Published Story')
      expect((meta.twitter as Record<string, unknown>)?.card).toBe('summary_large_image')
      expect(meta.robots).toEqual({ index: true, follow: true })
    })

    it('sets robots noindex and nofollow when post is not found or unpublished', async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: 'fs005-draft-post' }),
      })

      expect(meta.title).toBe('Story Not Found')
      expect(meta.robots).toEqual({ index: false, follow: false })
    })
  })

  describe('3. Sitemap & Robots Discoverability', () => {
    it('sitemap includes published posts and categories while strictly excluding non-public posts', async () => {
      const entries = await sitemap()
      const urls = entries.map((e) => e.url)

      // Homepage must be present
      expect(urls.some((u) => u === getSiteUrl() || u === `${getSiteUrl()}/`)).toBe(true)

      // Published post must be in sitemap
      expect(urls.some((u) => u.includes('/posts/fs005-published-story'))).toBe(true)

      // Category must be in sitemap
      expect(urls.some((u) => u.includes('/category/fs005-editorial'))).toBe(true)

      // Future, Matured Scheduled, Draft, In-Review, and Archived posts must NEVER be in sitemap
      expect(urls.some((u) => u.includes('/posts/fs005-future-post'))).toBe(false)
      expect(urls.some((u) => u.includes('/posts/fs005-matured-scheduled-post'))).toBe(false)
      expect(urls.some((u) => u.includes('/posts/fs005-draft-post'))).toBe(false)
      expect(urls.some((u) => u.includes('/posts/fs005-in-review-post'))).toBe(false)
      expect(urls.some((u) => u.includes('/posts/fs005-archived-post'))).toBe(false)
    })

    it('robots.txt disallows administrative, preview, and API routes while allowing public root', () => {
      const config = robots()
      const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules

      expect(rules?.allow).toContain('/')
      expect(rules?.disallow).toContain('/admin')
      expect(rules?.disallow).toContain('/api/preview')
      expect(rules?.disallow).toContain('/api/exit-preview')
      expect(rules?.disallow).toContain('/api/')
      expect(config.sitemap).toContain('/sitemap.xml')
    })
  })

  describe('4. Site URL Utility & Environment Safety', () => {
    it('safely falls back to localhost:3000 in development when env vars are absent', () => {
      const origNodeEnv = process.env.NODE_ENV
      const origSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
      const origServerUrl = process.env.NEXT_PUBLIC_SERVER_URL
      const origGeneralUrl = process.env.SITE_URL

      try {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
        delete process.env.NEXT_PUBLIC_SITE_URL
        delete process.env.NEXT_PUBLIC_SERVER_URL
        delete process.env.SITE_URL

        expect(getSiteUrl()).toBe('http://localhost:3000')
      } finally {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv
        if (origSiteUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = origSiteUrl
        if (origServerUrl !== undefined) process.env.NEXT_PUBLIC_SERVER_URL = origServerUrl
        if (origGeneralUrl !== undefined) process.env.SITE_URL = origGeneralUrl
      }
    })

    it('normalizes base URL and removes trailing slashes in production and development', () => {
      const origSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
      try {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://foundrystudio.dev/'
        expect(getSiteUrl()).toBe('https://foundrystudio.dev')

        process.env.NEXT_PUBLIC_SITE_URL = 'https://foundrystudio.dev'
        expect(getSiteUrl()).toBe('https://foundrystudio.dev')
      } finally {
        if (origSiteUrl !== undefined) {
          process.env.NEXT_PUBLIC_SITE_URL = origSiteUrl
        } else {
          delete process.env.NEXT_PUBLIC_SITE_URL
        }
      }
    })

    it('fails visibly in production when site URL is missing', () => {
      const origNodeEnv = process.env.NODE_ENV
      const origSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
      const origServerUrl = process.env.NEXT_PUBLIC_SERVER_URL
      const origGeneralUrl = process.env.SITE_URL

      try {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
        delete process.env.NEXT_PUBLIC_SITE_URL
        delete process.env.NEXT_PUBLIC_SERVER_URL
        delete process.env.SITE_URL

        expect(() => getSiteUrl()).toThrow(/Missing production site URL/)
      } finally {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv
        if (origSiteUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = origSiteUrl
        if (origServerUrl !== undefined) process.env.NEXT_PUBLIC_SERVER_URL = origServerUrl
        if (origGeneralUrl !== undefined) process.env.SITE_URL = origGeneralUrl
      }
    })

    it('fails visibly in production when site URL points to localhost or loopback', () => {
      const origNodeEnv = process.env.NODE_ENV
      const origSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

      try {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
        process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
        expect(() => getSiteUrl()).toThrow(/cannot point to localhost/)

        process.env.NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3000'
        expect(() => getSiteUrl()).toThrow(/cannot point to localhost/)
      } finally {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv
        if (origSiteUrl !== undefined) {
          process.env.NEXT_PUBLIC_SITE_URL = origSiteUrl
        } else {
          delete process.env.NEXT_PUBLIC_SITE_URL
        }
      }
    })

    it('fails visibly in production when site URL has invalid protocol or is malformed', () => {
      const origNodeEnv = process.env.NODE_ENV
      const origSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

      try {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
        process.env.NEXT_PUBLIC_SITE_URL = 'ftp://ftp.foundrystudio.dev'
        expect(() => getSiteUrl()).toThrow(/Invalid protocol/)

        process.env.NEXT_PUBLIC_SITE_URL = 'not-a-valid-url'
        expect(() => getSiteUrl()).toThrow(/Malformed production site URL/)
      } finally {
        ;(process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv
        if (origSiteUrl !== undefined) {
          process.env.NEXT_PUBLIC_SITE_URL = origSiteUrl
        } else {
          delete process.env.NEXT_PUBLIC_SITE_URL
        }
      }
    })
  })

  describe('5. RichText Safety & Node Handling', () => {
    it('renders safe HTTP and HTTPS links with proper rel and target attributes', () => {
      const content = {
        root: {
          type: 'root',
          format: '' as const,
          indent: 0,
          version: 1,
          children: [
            {
              type: 'link',
              url: 'https://devcrafters.io',
              children: [
                {
                  type: 'text',
                  text: 'DevCrafters Link',
                  version: 1,
                },
              ],
            },
          ],
        },
      }

      const element = RichText({ content })
      expect(element).not.toBeNull()
      const linkChild = element?.props.children[0]
      expect(linkChild.props.href).toBe('https://devcrafters.io')
      expect(linkChild.props.target).toBe('_blank')
      expect(linkChild.props.rel).toBe('noopener noreferrer')
    })

    it('neutralizes malicious javascript: scheme in link URLs', () => {
      const maliciousContent = {
        root: {
          type: 'root',
          format: '' as const,
          indent: 0,
          version: 1,
          children: [
            {
              type: 'link',
              url: 'javascript:alert(1)',
              children: [
                {
                  type: 'text',
                  text: 'Exploit Link',
                  version: 1,
                },
              ],
            },
          ],
        },
      }

      const element = RichText({ content: maliciousContent })
      const linkChild = element?.props.children[0]
      expect(linkChild.props.href).toBe('#')
    })

    it('demotes rich-text h1 tags to h2 to preserve single-h1 heading hierarchy', () => {
      const headingContent = {
        root: {
          type: 'root',
          format: '' as const,
          indent: 0,
          version: 1,
          children: [
            {
              type: 'heading',
              tag: 'h1',
              children: [
                {
                  type: 'text',
                  text: 'Embedded Section Heading',
                  version: 1,
                },
              ],
            },
          ],
        },
      }

      const element = RichText({ content: headingContent })
      const headingChild = element?.props.children[0]
      expect(headingChild.type).toBe('h2')
      expect(headingChild.props.className).toBe('prose-h2')
    })

    it('gracefully handles empty, null, or malformed rich-text payloads without throwing', () => {
      expect(RichText({ content: null })).toBeNull()
      expect(RichText({ content: undefined })).toBeNull()
      expect(RichText({ content: { root: undefined } })).toBeNull()

      const unknownNodeContent = {
        root: {
          type: 'root',
          children: [
            {
              type: 'unknown_custom_plugin_node',
              children: [
                {
                  type: 'text',
                  text: 'Graceful Fallback Text',
                  version: 1,
                },
              ],
            },
          ],
        },
      }

      const element = RichText({
        content: unknownNodeContent as unknown as RichTextProps['content'],
      })
      expect(element).not.toBeNull()
    })
  })

  describe('6. Preview Authorization & Indexing Boundaries', () => {
    it('authorizes author to preview their own unpublished draft', async () => {
      const headers = new Headers({
        authorization: `JWT ${authorToken}`,
      })
      const post = await getPost('fs005-draft-post', true, headers)
      expect(post).not.toBeNull()
      expect(post?.title).toBe('FS-005 Draft Post')
    })

    it('strictly forbids author from previewing another author’s unpublished draft', async () => {
      const headers = new Headers({
        authorization: `JWT ${otherAuthorToken}`,
      })
      const post = await getPost('fs005-draft-post', true, headers)
      expect(post).toBeNull()
    })

    it('allows editors to preview drafts authored by any user', async () => {
      const headers = new Headers({
        authorization: `JWT ${editorToken}`,
      })
      const post = await getPost('fs005-draft-post', true, headers)
      expect(post).not.toBeNull()
      expect(post?.title).toBe('FS-005 Draft Post')
    })

    it('strictly rejects unauthenticated preview requests even if draft mode flag is true', async () => {
      // Empty headers simulate an unauthenticated request with no valid session cookie
      const emptyHeaders = new Headers()
      const post = await getPost('fs005-draft-post', true, emptyHeaders)
      expect(post).toBeNull()
    })
  })
})
