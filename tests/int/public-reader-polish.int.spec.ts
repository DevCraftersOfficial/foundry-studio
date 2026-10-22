import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { Post, User, Category } from '@/payload-types'
import { calculateReadingTime, extractTextFromLexical } from '@/lib/reading-time'
import { CategoryNav } from '@/components/editorial/CategoryNav'
import { getPublicPostWhere } from '@/lib/publishing'

let payload: Payload
let testAuthor: User
let techCategory: Category
let designCategory: Category
let publishedStoryA: Post
let publishedStoryB: Post
let draftStoryInTech: Post
let futureScheduledStoryInTech: Post
let archivedStoryInTech: Post
let designStory: Post

describe('FS-UI-003: Public Reader Polish & Related Stories Isolation', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const uniqueId = Date.now()

    // 1. Create author
    testAuthor = (await payload.create({
      collection: 'users',
      data: {
        email: `fs003-author-${uniqueId}@devcrafters.io`,
        password: 'ValidPassword123!',
        name: 'FS003 Editorial Author',
        role: 'author',
      },
    })) as User

    // 2. Create categories
    techCategory = (await payload.create({
      collection: 'categories',
      data: {
        name: `Technology ${uniqueId}`,
        slug: `tech-${uniqueId}`,
        description: 'Technology section coverage.',
      },
    })) as Category

    designCategory = (await payload.create({
      collection: 'categories',
      data: {
        name: `Design ${uniqueId}`,
        slug: `design-${uniqueId}`,
        description: 'Design section coverage.',
      },
    })) as Category

    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString()
    const futureDate = new Date(Date.now() + 86400 * 1000).toISOString()

    const lexicalContent500Words = {
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
                text: Array(450).fill('editorial').join(' '),
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

    // 3. Create published stories in Technology
    publishedStoryA = (await payload.create({
      collection: 'posts',
      data: {
        title: `Tech Story Alpha ${uniqueId}`,
        slug: `tech-story-alpha-${uniqueId}`,
        author: testAuthor.id,
        categories: [techCategory.id],
        status: 'published',
        publishedAt: pastDate,
        content: lexicalContent500Words,
        excerpt: 'Alpha story excerpt in tech.',
      },
    })) as Post

    publishedStoryB = (await payload.create({
      collection: 'posts',
      data: {
        title: `Tech Story Beta ${uniqueId}`,
        slug: `tech-story-beta-${uniqueId}`,
        author: testAuthor.id,
        categories: [techCategory.id],
        status: 'published',
        publishedAt: pastDate,
        content: lexicalContent500Words,
        excerpt: 'Beta story excerpt in tech.',
      },
    })) as Post

    // 4. Create ineligible stories in Technology (draft, scheduled, archived)
    draftStoryInTech = (await payload.create({
      collection: 'posts',
      data: {
        title: `Tech Draft Hidden ${uniqueId}`,
        slug: `tech-draft-hidden-${uniqueId}`,
        author: testAuthor.id,
        categories: [techCategory.id],
        status: 'draft',
        content: lexicalContent500Words,
      },
    })) as Post

    futureScheduledStoryInTech = (await payload.create({
      collection: 'posts',
      data: {
        title: `Tech Future Scheduled ${uniqueId}`,
        slug: `tech-future-scheduled-${uniqueId}`,
        author: testAuthor.id,
        categories: [techCategory.id],
        status: 'scheduled',
        publishedAt: futureDate,
        content: lexicalContent500Words,
      },
    })) as Post

    archivedStoryInTech = (await payload.create({
      collection: 'posts',
      data: {
        title: `Tech Archived Retired ${uniqueId}`,
        slug: `tech-archived-retired-${uniqueId}`,
        author: testAuthor.id,
        categories: [techCategory.id],
        status: 'archived',
        publishedAt: pastDate,
        content: lexicalContent500Words,
      },
    })) as Post

    // 5. Create published story in Design (different category)
    designStory = (await payload.create({
      collection: 'posts',
      data: {
        title: `Design Story Distinct ${uniqueId}`,
        slug: `design-story-distinct-${uniqueId}`,
        author: testAuthor.id,
        categories: [designCategory.id],
        status: 'published',
        publishedAt: pastDate,
        content: lexicalContent500Words,
      },
    })) as Post
  })

  afterAll(async () => {
    // Clean up created resources
    const postIds = [
      publishedStoryA?.id,
      publishedStoryB?.id,
      draftStoryInTech?.id,
      futureScheduledStoryInTech?.id,
      archivedStoryInTech?.id,
      designStory?.id,
    ].filter(Boolean)

    for (const id of postIds) {
      await payload.delete({ collection: 'posts', id }).catch(() => null)
    }

    if (techCategory?.id) {
      await payload.delete({ collection: 'categories', id: techCategory.id }).catch(() => null)
    }
    if (designCategory?.id) {
      await payload.delete({ collection: 'categories', id: designCategory.id }).catch(() => null)
    }
    if (testAuthor?.id) {
      await payload.delete({ collection: 'users', id: testAuthor.id }).catch(() => null)
    }
  })

  describe('Reading Time Calculation Engine', () => {
    it('handles null, undefined, and empty objects safely without throwing', () => {
      expect(calculateReadingTime(null)).toEqual({ minutes: 0, words: 0, text: '0 min read' })
      expect(calculateReadingTime(undefined)).toEqual({ minutes: 0, words: 0, text: '0 min read' })
      expect(calculateReadingTime({})).toEqual({ minutes: 0, words: 0, text: '0 min read' })
      expect(calculateReadingTime('')).toEqual({ minutes: 0, words: 0, text: '0 min read' })
    })

    it('calculates deterministic reading time for plain text at 200 WPM', () => {
      // 50 words => 1 min
      const text50 = Array(50).fill('dispatch').join(' ')
      expect(calculateReadingTime(text50)).toEqual({ minutes: 1, words: 50, text: '1 min read' })

      // 200 words => 1 min
      const text200 = Array(200).fill('dispatch').join(' ')
      expect(calculateReadingTime(text200)).toEqual({ minutes: 1, words: 200, text: '1 min read' })

      // 201 words => 2 min
      const text201 = Array(201).fill('dispatch').join(' ')
      expect(calculateReadingTime(text201)).toEqual({ minutes: 2, words: 201, text: '2 min read' })

      // 650 words => 4 min
      const text650 = Array(650).fill('dispatch').join(' ')
      expect(calculateReadingTime(text650)).toEqual({ minutes: 4, words: 650, text: '4 min read' })
    })

    it('extracts nested text recursively from Lexical AST', () => {
      const lexicalAST = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Opening paragraph text.' },
                { type: 'text', text: 'Second sentence in opening.' },
              ],
            },
            {
              type: 'quote',
              children: [
                { type: 'text', text: 'A memorable editorial quote.' },
              ],
            },
          ],
        },
      }

      const extracted = extractTextFromLexical(lexicalAST)
      expect(extracted).toContain('Opening paragraph text.')
      expect(extracted).toContain('Second sentence in opening.')
      expect(extracted).toContain('A memorable editorial quote.')

      const result = calculateReadingTime(lexicalAST)
      expect(result.words).toBe(11)
      expect(result.minutes).toBe(1)
      expect(result.text).toBe('1 min read')
    })
  })

  describe('CategoryNav Component', () => {
    it('renders navigation links and identifies active section with aria-current="page"', () => {
      const categories: Category[] = [techCategory, designCategory]

      const htmlFrontPage = renderToStaticMarkup(
        React.createElement(CategoryNav, { categories, activeSlug: 'frontpage' })
      )

      // Verified: Front Page has aria-current="page" and active class
      expect(htmlFrontPage).toContain('aria-current="page"')
      expect(htmlFrontPage).toContain('category-nav-link--active')
      expect(htmlFrontPage).toContain('Front Page')
      expect(htmlFrontPage).toContain(techCategory.name)
      expect(htmlFrontPage).toContain(designCategory.name)

      // Active category section
      const htmlTech = renderToStaticMarkup(
        React.createElement(CategoryNav, { categories, activeSlug: techCategory.slug })
      )

      expect(htmlTech).toContain(`href="/category/${techCategory.slug}"`)
      expect(htmlTech).toContain('aria-current="page"')
    })

    it('renders null safely when categories list is empty', () => {
      const html = renderToStaticMarkup(
        React.createElement(CategoryNav, { categories: [] })
      )
      expect(html).toBe('')
    })
  })

  describe('Related Stories Query & Invariant Isolation', () => {
    it('strictly returns only published stories in the same category excluding the current story', async () => {
      const now = new Date().toISOString()

      const relatedData = await payload.find({
        collection: 'posts',
        where: {
          and: [
            getPublicPostWhere(now),
            {
              id: {
                not_equals: publishedStoryA.id,
              },
            },
            {
              categories: { contains: techCategory.id },
            },
          ],
        },
        depth: 1,
      })

      const relatedIds = relatedData.docs.map((d) => d.id)

      // 1. Must include publishedStoryB (shares tech category)
      expect(relatedIds).toContain(publishedStoryB.id)

      // 2. Must strictly NOT include itself (publishedStoryA)
      expect(relatedIds).not.toContain(publishedStoryA.id)

      // 3. Must strictly NOT include designStory (different category)
      expect(relatedIds).not.toContain(designStory.id)

      // 4. Must strictly NOT leak draft, scheduled, or archived stories
      expect(relatedIds).not.toContain(draftStoryInTech.id)
      expect(relatedIds).not.toContain(futureScheduledStoryInTech.id)
      expect(relatedIds).not.toContain(archivedStoryInTech.id)
    })
  })
})
