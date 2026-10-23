import { describe, it, expect, beforeAll } from 'vitest'
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

describe('FS-UI-009: Foundry Studio Public Reader Redesign & Doodle Avatars', () => {
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

    // 3. Create Published Posts
    const pastDate = new Date(Date.now() - 3600000).toISOString()

    publishedPost1 = await payload.create({
      collection: 'posts',
      data: {
        title: `The Architecture of Independent Journalism ${timestamp}`,
        slug: `independent-journalism-${timestamp}`,
        excerpt: 'An investigation into editorial freedom and modern publishing infrastructure.',
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
        title: `Design Systems for Contemporary Newsrooms ${timestamp}`,
        slug: `newsroom-design-systems-${timestamp}`,
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
  })

  describe('1. Default Doodle Profile Avatars Architecture', () => {
    it('verifies local physical existence of both doodle avatar assets in public/avatars', () => {
      const malePath = path.resolve(process.cwd(), 'public/avatars/avatar-male.jpg')
      const femalePath = path.resolve(process.cwd(), 'public/avatars/avatar-female.jpg')

      expect(fs.existsSync(malePath)).toBe(true)
      expect(fs.existsSync(femalePath)).toBe(true)

      const maleStats = fs.statSync(malePath)
      const femaleStats = fs.statSync(femalePath)

      expect(maleStats.size).toBeGreaterThan(1000)
      expect(femaleStats.size).toBeGreaterThan(1000)
    })

    it('deterministically selects avatars based strictly on user ID parity', () => {
      // Even ID -> Male avatar
      const evenUser = { id: 42, name: 'Alex' }
      const evenAvatar = getUserAvatar(evenUser)
      expect(evenAvatar.url).toBe('/avatars/avatar-male.jpg')
      expect(evenAvatar.variant).toBe('male')

      // Odd ID -> Female avatar
      const oddUser = { id: 43, name: 'Taylor' }
      const oddAvatar = getUserAvatar(oddUser)
      expect(oddAvatar.url).toBe('/avatars/avatar-female.jpg')
      expect(oddAvatar.variant).toBe('female')
    })

    it('never infers or mutates avatar selection based on user name', () => {
      // Different names with the same ID yield the EXACT same avatar
      const userA = { id: 100, name: 'Arthur Conan' }
      const userB = { id: 100, name: 'Agatha Christie' }

      expect(getUserAvatar(userA).url).toBe(getUserAvatar(userB).url)
      expect(getUserAvatar(userA).variant).toBe('male')
    })

    it('preserves existing custom profile image if present on user model', () => {
      const customUser = {
        id: 42,
        name: 'Custom User',
        avatar: 'https://cdn.example.com/uploaded-photo.jpg',
      }
      const customAvatar = getUserAvatar(customUser)
      expect(customAvatar.url).toBe('https://cdn.example.com/uploaded-photo.jpg')
      expect(customAvatar.variant).toBe('custom')
    })

    it('safely handles null, undefined, or missing user entities', () => {
      const nullAvatar = getUserAvatar(null)
      expect(nullAvatar.url).toBe(DEFAULT_AVATARS.male.url)

      const undefinedAvatar = getUserAvatar(undefined)
      expect(undefinedAvatar.url).toBe(DEFAULT_AVATARS.male.url)
    })

    it('renders accessible screen-reader attributes in Avatar component', () => {
      // Decorative avatar has aria-hidden="true"
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

  describe('2. Public Reader Editorial Hierarchy & Publication Eligibility', () => {
    it('strictly excludes unpublished drafts from public sitemap', async () => {
      const sitemapEntries = await sitemap()
      const urls = sitemapEntries.map((e) => e.url)

      // Published posts must be present
      expect(urls.some((u) => u.includes(publishedPost1.slug))).toBe(true)
      expect(urls.some((u) => u.includes(publishedPost2.slug))).toBe(true)

      // Unpublished draft must NEVER be present
      expect(urls.some((u) => u.includes(draftPost.slug))).toBe(false)
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

  describe('3. Public Server-Side Search Invariants', () => {
    it('returns published posts matching search query and strictly blocks drafts', async () => {
      const now = new Date().toISOString()
      const { getPublicPostWhere } = await import('@/lib/publishing')

      // Search for keyword present in both publishedPost1 and draftPost ("investigation" / "investigative")
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
  })

  describe('4. Author Archive Route Security & Boundaries', () => {
    it('author archive strictly scopes dispatches to requested author and public eligibility', async () => {
      const now = new Date().toISOString()
      const { getPublicPostWhere } = await import('@/lib/publishing')

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
    })
  })

  describe('5. Obsolete Copy Removal & Brand System Verification', () => {
    it('verifies obsolete open-source platform endorsement has been removed from BrandLockup', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'footer', href: '/' })
      )

      expect(html).not.toContain('An Open-Source Editorial Publishing Platform')
      expect(html).toContain('Editorial Publishing Platform')
      expect(html).toContain('DevCrafters')
    })
  })
})
