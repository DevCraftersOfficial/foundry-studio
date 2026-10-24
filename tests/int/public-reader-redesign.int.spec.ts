import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User, Post, Category, Tag } from '@/payload-types'
import { getUserAvatar, DEFAULT_AVATARS } from '@/lib/avatar'
import { Avatar } from '@/components/ui/Avatar'
import { BrandLockup } from '@/components/ui/BrandLockup'
import { getPublicPostWhere, isPostPubliclyEligible } from '@/lib/publishing'
import { calculateReadingTime, extractTextFromLexical } from '@/lib/reading-time'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'

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
            text: 'Foundry Studio Public Reader Redesign editorial test content. Examining long-form typography and modular journalism.',
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

let payload: Payload
let testAuthorEven: User
let testAuthorOdd: User
let testCategory: Category
let testTag: Tag
let publishedPost1: Post
let publishedPost2: Post
let draftPost: Post
let scheduledPastPost: Post

describe('FS-UI-009 / FS-UI-010: Public Reader Redesign, Doodle Avatars & Security Gate', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // 1. Provision Authors
    testAuthorEven = await payload.create({
      collection: 'users',
      data: {
        name: 'Julian Vance',
        email: `fs009-author-even-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'author',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })

    testAuthorOdd = await payload.create({
      collection: 'users',
      data: {
        name: 'Elena Rostova',
        email: `fs009-author-odd-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'editor',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })

    // 2. Provision Category & Tag
    testCategory = await payload.create({
      collection: 'categories',
      data: {
        name: `Investigative Desk ${timestamp}`,
        slug: `investigative-${timestamp}`,
        description: 'Hard-hitting investigative reporting and forensic analysis.',
      },
      overrideAccess: true,
    })

    testTag = await payload.create({
      collection: 'tags',
      data: {
        name: `PublicPolicy${timestamp}`,
        slug: `public-policy-${timestamp}`,
      },
      overrideAccess: true,
    })

    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString()

    // 3. Create Eligible Published Posts
    publishedPost1 = await payload.create({
      collection: 'posts',
      data: {
        title: `The Architecture of Independent Journalism ${timestamp}`,
        slug: `architecture-of-journalism-${timestamp}`,
        excerpt: 'An investigation into modern digital publishing tools and editorial independence.',
        content: sampleLexicalContent,
        status: 'published',
        publishedAt: pastDate,
        author: testAuthorEven.id,
        categories: [testCategory.id],
        tags: [testTag.id],
      },
      overrideAccess: true,
    })

    publishedPost2 = await payload.create({
      collection: 'posts',
      data: {
        title: `Typographic Systems for Long-Form Reading ${timestamp}`,
        slug: `typographic-systems-${timestamp}`,
        excerpt: 'Crafting legible, typography-first readers for critical public audiences.',
        content: sampleLexicalContent,
        status: 'published',
        publishedAt: pastDate,
        author: testAuthorOdd.id,
        categories: [testCategory.id],
        tags: [testTag.id],
      },
      overrideAccess: true,
    })

    // 4. Create Private Draft Post (must NEVER leak to public reader)
    draftPost = await payload.create({
      collection: 'posts',
      data: {
        title: `Confidential Unreleased Story ${timestamp}`,
        slug: `confidential-draft-${timestamp}`,
        excerpt: 'Secret draft investigative notes that must not leak to search or public reader.',
        content: sampleLexicalContent,
        status: 'draft',
        author: testAuthorEven.id,
        categories: [testCategory.id],
      },
      overrideAccess: true,
    })

    // 5. Create Scheduled Post whose publication timestamp has passed (must NEVER leak while status remains 'scheduled')
    scheduledPastPost = await payload.create({
      collection: 'posts',
      data: {
        title: `Scheduled In Past Dispatch ${timestamp}`,
        slug: `scheduled-past-${timestamp}`,
        excerpt: 'Scheduled post whose timestamp has passed but status remains scheduled.',
        content: sampleLexicalContent,
        status: 'scheduled',
        publishedAt: pastDate,
        author: testAuthorEven.id,
        categories: [testCategory.id],
        tags: [testTag.id],
      },
      overrideAccess: true,
      context: { allowPastScheduled: true },
    })
  })

  describe('1. Default Doodle Profile Avatars Architecture & Neutral Selection', () => {
    it('verifies local physical existence of default and variant doodle avatar assets in public/avatars', () => {
      const defaultPath = path.resolve(process.cwd(), 'public/avatars/avatar-default.jpg')
      const neutralPath = path.resolve(process.cwd(), 'public/avatars/avatar-neutral.jpg')
      const malePath = path.resolve(process.cwd(), 'public/avatars/avatar-male.jpg')
      const femalePath = path.resolve(process.cwd(), 'public/avatars/avatar-female.jpg')

      expect(fs.existsSync(defaultPath)).toBe(true)
      expect(fs.existsSync(neutralPath)).toBe(true)
      expect(fs.existsSync(malePath)).toBe(true)
      expect(fs.existsSync(femalePath)).toBe(true)

      expect(fs.statSync(defaultPath).size).toBeGreaterThan(1000)
      expect(fs.statSync(neutralPath).size).toBeGreaterThan(1000)
      expect(fs.statSync(malePath).size).toBeGreaterThan(1000)
      expect(fs.statSync(femalePath).size).toBeGreaterThan(1000)
    })

    it('returns neutral default avatar without gender inference from user ID or parity', () => {
      // Regardless of even, odd, numeric, string or negative ID, default is neutral
      const userEven = { id: 42, name: 'Alex' }
      const userOdd = { id: 43, name: 'Taylor' }
      const userString = { id: 'usr-abc-123', name: 'Jordan' }

      expect(getUserAvatar(userEven).url).toBe('/avatars/avatar-default.jpg')
      expect(getUserAvatar(userEven).variant).toBe('default')

      expect(getUserAvatar(userOdd).url).toBe('/avatars/avatar-default.jpg')
      expect(getUserAvatar(userOdd).variant).toBe('default')

      expect(getUserAvatar(userString).url).toBe('/avatars/avatar-default.jpg')
      expect(getUserAvatar(userString).variant).toBe('default')
    })

    it('never infers or mutates avatar selection based on user name', () => {
      const userA = { id: 100, name: 'Arthur Conan' }
      const userB = { id: 100, name: 'Agatha Christie' }

      expect(getUserAvatar(userA).url).toBe(getUserAvatar(userB).url)
      expect(getUserAvatar(userA).url).toBe('/avatars/avatar-default.jpg')
    })

    it('preserves existing custom profile image if present on user model as highest priority', () => {
      const customUser = {
        id: 42,
        name: 'Custom User',
        avatar: 'https://cdn.example.com/uploaded-photo.jpg',
      }
      const customAvatar = getUserAvatar(customUser)
      expect(customAvatar.url).toBe('https://cdn.example.com/uploaded-photo.jpg')
      expect(customAvatar.variant).toBe('custom')
    })

    it('supports custom profile media objects with url and alt text', () => {
      const mediaUser = {
        id: 45,
        name: 'Media User',
        avatar: { url: '/media/my-portrait.webp', alt: 'Hand-drawn portrait' },
      }
      const avatar = getUserAvatar(mediaUser)
      expect(avatar.url).toBe('/media/my-portrait.webp')
      expect(avatar.alt).toBe('Hand-drawn portrait')
      expect(avatar.variant).toBe('custom')
    })

    it('gracefully falls back to neutral default when custom avatar is empty or malformed', () => {
      expect(getUserAvatar({ id: 1, avatar: '' }).url).toBe('/avatars/avatar-default.jpg')
      expect(getUserAvatar({ id: 1, avatar: '   ' }).url).toBe('/avatars/avatar-default.jpg')
      expect(getUserAvatar({ id: 1, avatar: {} }).url).toBe('/avatars/avatar-default.jpg')
      expect(getUserAvatar({ id: 1, avatar: { url: '' } }).url).toBe('/avatars/avatar-default.jpg')
    })

    it('respects explicit avatar preferences when provided in model', () => {
      expect(getUserAvatar({ id: 10, avatarPreference: 'male' }).variant).toBe('male')
      expect(getUserAvatar({ id: 10, avatarPreference: 'female' }).variant).toBe('female')
      expect(getUserAvatar({ id: 10, avatarPreference: 'neutral' }).variant).toBe('neutral')
    })

    it('safely handles null, undefined, or missing user entities', () => {
      expect(getUserAvatar(null).url).toBe(DEFAULT_AVATARS.default.url)
      expect(getUserAvatar(undefined).url).toBe(DEFAULT_AVATARS.default.url)
    })

    it('renders accessible screen-reader attributes in Avatar component', () => {
      // Decorative avatar has aria-hidden="true" and alt=""
      const decorativeHtml = renderToStaticMarkup(
        React.createElement(Avatar, { user: { id: 2, name: 'Julian' }, size: 'sm', decorative: true })
      )
      expect(decorativeHtml).toContain('aria-hidden="true"')
      expect(decorativeHtml).toContain('avatar--sm')

      // Non-decorative avatar has descriptive alt text and no aria-hidden
      const nonDecorativeHtml = renderToStaticMarkup(
        React.createElement(Avatar, { user: { id: 3, name: 'Elena' }, size: 'lg', decorative: false })
      )
      expect(nonDecorativeHtml).not.toContain('aria-hidden')
      expect(nonDecorativeHtml).toContain('Elena’s avatar')
      expect(nonDecorativeHtml).toContain('avatar--lg')
    })
  })

  describe('2. Public Reader Editorial Hierarchy & Publication Eligibility Invariant', () => {
    it('strictly excludes unpublished drafts from public sitemap', async () => {
      const sitemapEntries = await sitemap()
      const urls = sitemapEntries.map((e) => e.url)

      expect(urls.some((u) => u.includes(publishedPost1.slug))).toBe(true)
      expect(urls.some((u) => u.includes(publishedPost2.slug))).toBe(true)
      expect(urls.some((u) => u.includes(draftPost.slug))).toBe(false)
    })

    it('strictly excludes past-scheduled posts from public sitemap while status remains "scheduled"', async () => {
      const sitemapEntries = await sitemap()
      const urls = sitemapEntries.map((e) => e.url)

      // Even though publishedAt is in the past, status is scheduled -> MUST NOT be in sitemap
      expect(urls.some((u) => u.includes(scheduledPastPost.slug))).toBe(false)
    })

    it('isPostPubliclyEligible deterministically rejects scheduled posts even with elapsed timestamps', () => {
      const now = Date.now()
      expect(isPostPubliclyEligible(scheduledPastPost, now)).toBe(false)
      expect(isPostPubliclyEligible(draftPost, now)).toBe(false)
      expect(isPostPubliclyEligible(publishedPost1, now)).toBe(true)
    })

    it('getPublicPostWhere strictly rejects scheduled posts with elapsed timestamps', async () => {
      const now = new Date().toISOString()
      const queryResults = await payload.find({
        collection: 'posts',
        where: {
          and: [
            getPublicPostWhere(now),
            { slug: { equals: scheduledPastPost.slug } },
          ],
        },
        overrideAccess: true,
      })

      expect(queryResults.docs.length).toBe(0)
    })

    it('indexes eligible author archives and topic tag archives in sitemap.xml', async () => {
      const sitemapEntries = await sitemap()
      const urls = sitemapEntries.map((e) => e.url)

      expect(urls.some((u) => u.includes(`/author/${testAuthorEven.id}`))).toBe(true)
      expect(urls.some((u) => u.includes(`/tag/${testTag.slug}`))).toBe(true)
      expect(urls.some((u) => u.includes(`/category/${testCategory.slug}`))).toBe(true)
    })

    it('robots.txt disallows search, administrative, and preview routes while allowing root', () => {
      const config = robots()
      const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules

      expect(rules?.allow).toContain('/')
      expect(rules?.disallow).toContain('/search')
      expect(rules?.disallow).toContain('/admin')
      expect(rules?.disallow).toContain('/api/preview')
    })
  })

  describe('3. Public Server-Side Search Invariants & Robustness', () => {
    it('returns published posts matching search query and strictly blocks drafts', async () => {
      const now = new Date().toISOString()

      const searchResults = await payload.find({
        collection: 'posts',
        where: {
          and: [
            getPublicPostWhere(now),
            {
              or: [
                { title: { like: 'investigation' } },
                { excerpt: { like: 'investigation' } },
              ],
            },
          ],
        },
        overrideAccess: true,
      })

      const returnedSlugs = (searchResults.docs as Post[]).map((d) => d.slug)

      // Published post matches and is returned
      expect(returnedSlugs).toContain(publishedPost1.slug)

      // Draft post contains keyword in excerpt but MUST NEVER be returned
      expect(returnedSlugs).not.toContain(draftPost.slug)
    })

    it('strictly excludes past-scheduled posts from search results', async () => {
      const now = new Date().toISOString()

      const searchResults = await payload.find({
        collection: 'posts',
        where: {
          and: [
            getPublicPostWhere(now),
            {
              or: [
                { title: { like: 'Scheduled' } },
                { excerpt: { like: 'Scheduled' } },
              ],
            },
          ],
        },
        overrideAccess: true,
      })

      const returnedSlugs = (searchResults.docs as Post[]).map((d) => d.slug)
      expect(returnedSlugs).not.toContain(scheduledPastPost.slug)
    })

    it('safely handles special characters, punctuation, and Unicode input in search query', async () => {
      const now = new Date().toISOString()
      const specialQueries = ['#journalism', 'typography & design', '100%', "editor's pick", '日本語', '★']

      for (const q of specialQueries) {
        const results = await payload.find({
          collection: 'posts',
          where: {
            and: [
              getPublicPostWhere(now),
              {
                or: [
                  { title: { like: q } },
                  { excerpt: { like: q } },
                ],
              },
            ],
          },
          overrideAccess: true,
        })
        expect(Array.isArray(results.docs)).toBe(true)
      }
    })
  })

  describe('4. Author Archive Route Security & Boundaries', () => {
    it('author archive strictly scopes dispatches to requested author and public eligibility', async () => {
      const now = new Date().toISOString()

      // Query Author Even's published dispatches
      const authorResults = await payload.find({
        collection: 'posts',
        where: {
          and: [
            getPublicPostWhere(now),
            { author: { equals: testAuthorEven.id } },
          ],
        },
        overrideAccess: true,
      })

      const returnedSlugs = (authorResults.docs as Post[]).map((d) => d.slug)

      // Contains Author Even's published post
      expect(returnedSlugs).toContain(publishedPost1.slug)

      // Strictly does NOT contain Author Odd's published post
      expect(returnedSlugs).not.toContain(publishedPost2.slug)

      // Strictly does NOT contain Author Even's unpublished draft
      expect(returnedSlugs).not.toContain(draftPost.slug)

      // Strictly does NOT contain Author Even's scheduled post
      expect(returnedSlugs).not.toContain(scheduledPastPost.slug)
    })
  })

  describe('5. Exit Preview Security & Open Redirect Protection', () => {
    it('rejects external URLs and protocol-relative destinations in GET /api/exit-preview', async () => {
      const { GET } = await import('@/app/api/exit-preview/route')

      const testCases = [
        'https://evil.com',
        'http://attacker.org/steal',
        '//malicious.com',
        'javascript:alert(1)',
        '\\evil.com',
      ]

      for (const maliciousTarget of testCases) {
        const req = new Request(`http://localhost:3000/api/exit-preview?redirect=${encodeURIComponent(maliciousTarget)}`)
        let redirectTarget = ''
        try {
          await GET(req)
        } catch (err: unknown) {
          if (
            (err as Error)?.message === 'NEXT_REDIRECT' ||
            (err as { digest?: string })?.digest?.includes('NEXT_REDIRECT')
          ) {
            // Next.js redirect thrown successfully
            redirectTarget = (err as { digest?: string })?.digest || ''
          }
        }
        // Must redirect to root '/' and never to external URL
        expect(redirectTarget).not.toContain('evil.com')
        expect(redirectTarget).not.toContain('attacker.org')
        expect(redirectTarget).not.toContain('malicious.com')
      }
    })
  })

  describe('6. Reading-Time Calculation Engine Coverage', () => {
    it('returns 0 min read for empty lexical content without reporting misleading positive times', () => {
      expect(calculateReadingTime(null).text).toBe('0 min read')
      expect(calculateReadingTime(undefined).text).toBe('0 min read')
      expect(calculateReadingTime('').text).toBe('0 min read')
      expect(calculateReadingTime('   ').text).toBe('0 min read')
      expect(calculateReadingTime({ root: { children: [] } }).text).toBe('0 min read')
    })

    it('recursively extracts plain text across headings, lists, quotes, and links in Lexical AST', () => {
      const richLexical = {
        root: {
          children: [
            { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Section Title' }] },
            { type: 'paragraph', children: [{ type: 'text', text: 'Intro paragraph.' }] },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                { type: 'listitem', children: [{ type: 'text', text: 'Item one' }] },
                { type: 'listitem', children: [{ type: 'text', text: 'Item two' }] },
              ],
            },
            {
              type: 'paragraph',
              children: [
                { type: 'link', url: 'https://example.com', children: [{ type: 'text', text: 'Linked text' }] },
              ],
            },
          ],
        },
      }

      const extracted = extractTextFromLexical(richLexical)
      expect(extracted).toContain('Section Title')
      expect(extracted).toContain('Intro paragraph.')
      expect(extracted).toContain('Item one')
      expect(extracted).toContain('Item two')
      expect(extracted).toContain('Linked text')

      const time = calculateReadingTime(richLexical)
      expect(time.words).toBeGreaterThan(5)
      expect(time.minutes).toBe(1)
      expect(time.text).toBe('1 min read')
    })
  })

  describe('7. Obsolete Copy Removal & Brand System Verification', () => {
    it('verifies obsolete open-source platform endorsement has been removed from BrandLockup', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'footer', href: '/' })
      )

      expect(html).not.toContain('An Open-Source Editorial Publishing Platform')
      expect(html).toContain('Editorial Publishing Platform')
    })
  })

  afterAll(async () => {
    if (!payload) return
    try {
      if (publishedPost1?.id) await payload.delete({ collection: 'posts', id: publishedPost1.id, overrideAccess: true })
      if (publishedPost2?.id) await payload.delete({ collection: 'posts', id: publishedPost2.id, overrideAccess: true })
      if (draftPost?.id) await payload.delete({ collection: 'posts', id: draftPost.id, overrideAccess: true })
      if (scheduledPastPost?.id) await payload.delete({ collection: 'posts', id: scheduledPastPost.id, overrideAccess: true })
      if (testCategory?.id) await payload.delete({ collection: 'categories', id: testCategory.id, overrideAccess: true })
      if (testTag?.id) await payload.delete({ collection: 'tags', id: testTag.id, overrideAccess: true })
      if (testAuthorEven?.id) await payload.delete({ collection: 'users', id: testAuthorEven.id, overrideAccess: true })
      if (testAuthorOdd?.id) await payload.delete({ collection: 'users', id: testAuthorOdd.id, overrideAccess: true })
    } catch {
      // Best-effort test fixture cleanup
    }
  })
})

