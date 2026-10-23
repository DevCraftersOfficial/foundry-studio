import { describe, it, expect, beforeAll, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'fs'
import path from 'path'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import {
  StudioDashboardView,
  StudioDashboardData,
} from '@/components/admin/StudioDashboardView'
import { StudioDashboard } from '@/components/admin/StudioDashboard'
import {
  formatRelativeTime,
  formatScheduledCountdown,
  formatDateShort,
  getDeskGreeting,
} from '@/lib/editorial-date'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

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
            text: 'Foundry Studio Newsroom Dashboard test article content.',
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
let testAdmin: User
let testEditor: User
let authorOne: User
let authorTwo: User

describe('FS-UI-007: Foundry Studio Editorial Newsroom Dashboard', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // 1. Provision Admin
    testAdmin = await payload.create({
      collection: 'users',
      data: {
        name: 'Chief Admin',
        email: `fs007-admin-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'admin',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })

    // 2. Provision Editor
    testEditor = await payload.create({
      collection: 'users',
      data: {
        name: 'Editorial Lead',
        email: `fs007-editor-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'editor',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })

    // 3. Provision Author One
    authorOne = await payload.create({
      collection: 'users',
      data: {
        name: 'Reporter Alpha',
        email: `fs007-alpha-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'author',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })

    // 4. Provision Author Two
    authorTwo = await payload.create({
      collection: 'users',
      data: {
        name: 'Reporter Beta',
        email: `fs007-beta-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'author',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })
  })

  describe('1. Configuration & ImportMap Verification', () => {
    it('registers views.dashboard.Component in payload.config.ts', async () => {
      const payloadConfig = await config
      expect(payloadConfig.admin?.components?.views?.dashboard).toBeDefined()
      expect(payloadConfig.admin?.components?.views?.dashboard?.Component).toBe(
        '@/components/admin/StudioDashboard#StudioDashboard',
      )
    })

    it('contains StudioDashboard entry in importMap.js', () => {
      const importMapPath = path.resolve(
        process.cwd(),
        'src/app/(payload)/admin/importMap.js',
      )
      expect(fs.existsSync(importMapPath)).toBe(true)
      const importMapContent = fs.readFileSync(importMapPath, 'utf8')
      expect(importMapContent).toContain('@/components/admin/StudioDashboard#StudioDashboard')
    })
  })

  describe('2. Editorial Date and Countdown Helpers', () => {
    it('formats relative times correctly', () => {
      const now = 1700000000000
      expect(formatRelativeTime(now - 30000, now)).toBe('just now')
      expect(formatRelativeTime(now - 5 * 60 * 1000, now)).toBe('5m ago')
      expect(formatRelativeTime(now - 3 * 3600 * 1000, now)).toBe('3h ago')
      expect(formatRelativeTime(now - 2 * 86400 * 1000, now)).toBe('2d ago')
    })

    it('formats scheduled countdowns correctly', () => {
      const now = 1700000000000
      expect(formatScheduledCountdown(now + 25 * 60 * 1000, now)).toBe('in 25m')
      expect(formatScheduledCountdown(now + 4 * 3600 * 1000, now)).toBe('in 4h')
      expect(formatScheduledCountdown(now + 3 * 86400 * 1000, now)).toBe('in 3d')
      expect(formatScheduledCountdown(now - 1000, now)).toBe('Release pending')
    })

    it('formats short dates safely', () => {
      const date = new Date(Date.UTC(2026, 9, 23))
      expect(formatDateShort(date)).toBe('Oct 23, 2026')
    })

    it('provides desk greeting and formatted date', () => {
      const res = getDeskGreeting(new Date(2026, 9, 23, 10, 0, 0))
      expect(res.greeting).toBe('Good morning')
      expect(res.deskDate).toContain('October 23, 2026')
    })
  })

  describe('3. StudioDashboardView Lifecycle & Standard States', () => {
    const mockAuthorData: StudioDashboardData = {
      user: {
        id: 'user-author-1',
        name: 'Jane Author',
        email: 'jane@devcrafters.io',
        role: 'author',
      },
      metrics: {
        drafts: 2,
        inReview: 1,
        scheduled: 1,
        published: 5,
      },
      reviewQueue: [
        {
          id: 'post-rev-1',
          title: 'Quantum Computing Frontiers in Editorial Systems',
          slug: 'quantum-computing-frontiers',
          authorName: 'Jane Author',
          categoryTitle: 'Technology',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      drafts: [
        {
          id: 'post-draft-1',
          title: 'Next Generation Lexical Publishing AST',
          slug: 'next-gen-lexical',
          updatedAt: new Date().toISOString(),
        },
      ],
      scheduled: [
        {
          id: 'post-sched-1',
          title: 'Autonomous Software Engineering in 2027',
          slug: 'autonomous-swe-2027',
          publishedAt: new Date(Date.now() + 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      published: [
        {
          id: 'post-pub-1',
          title: 'Foundry Studio Launches with DevCrafters Brand',
          slug: 'foundry-studio-launches',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
          categoryTitle: 'Dispatches',
        },
      ],
    }

    it('renders author workspace with role badge, author drafts, and submissions', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'ideal',
          data: mockAuthorData,
        }),
      )

      expect(html).toContain('AUTHOR WORKSPACE')
      expect(html).toContain('Jane Author')
      expect(html).toContain('Your Submissions in Review')
      expect(html).toContain('Your In-Progress Drafts')
      expect(html).toContain('Quantum Computing Frontiers in Editorial Systems')
      expect(html).toContain('Next Generation Lexical Publishing AST')
      expect(html).toContain('+ New Dispatch')
      expect(html).not.toContain('Staff Directory')
    })

    it('renders editor desk with team review queue and governance taxonomy links', () => {
      const mockEditorData: StudioDashboardData = {
        ...mockAuthorData,
        user: {
          id: 'user-editor-1',
          name: 'Sarah Editor',
          email: 'sarah@devcrafters.io',
          role: 'editor',
        },
      }

      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'ideal',
          data: mockEditorData,
        }),
      )

      expect(html).toContain('EDITORIAL DESK')
      expect(html).toContain('Editorial Review Queue')
      expect(html).toContain('Categories')
      expect(html).toContain('Topic Tags')
      expect(html).not.toContain('Staff Directory')
    })

    it('renders admin desk with Staff Directory link and full controls', () => {
      const mockAdminData: StudioDashboardData = {
        ...mockAuthorData,
        user: {
          id: 'user-admin-1',
          name: 'Alex Admin',
          email: 'alex@devcrafters.io',
          role: 'admin',
        },
      }

      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'ideal',
          data: mockAdminData,
        }),
      )

      expect(html).toContain('ADMINISTRATIVE DESK')
      expect(html).toContain('Staff Directory')
      expect(html).toContain('All Dispatches')
      expect(html).toContain('Upload Media')
    })

    it('renders loading state with skeleton shimmer elements', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'loading',
        }),
      )

      expect(html).toContain('studio-skeleton')
      expect(html).toContain('Loading Editorial Newsroom')
      expect(html).not.toContain('Jane Author')
    })

    it('renders permission-denied state without leaking publication data', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'permission-denied',
        }),
      )

      expect(html).toContain('Restricted Editorial Newsroom Desk')
      expect(html).toContain('Sign In to Studio Desk')
      expect(html).not.toContain('Quantum Computing')
      expect(html).not.toContain('Drafts')
    })

    it('renders error state with actionable refresh action', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'error',
          errorMessage: 'Database connection failed during query',
        }),
      )

      expect(html).toContain('Editorial Desk Data Temporarily Unavailable')
      expect(html).toContain('Database connection failed during query')
      expect(html).toContain('Refresh Newsroom Desk')
    })

    it('renders onboarding guidance banner when workspace is completely empty', () => {
      const emptyData: StudioDashboardData = {
        user: {
          id: 'user-new-1',
          name: 'New Publisher',
          email: 'new@devcrafters.io',
          role: 'editor',
        },
        metrics: {
          drafts: 0,
          inReview: 0,
          scheduled: 0,
          published: 0,
        },
        reviewQueue: [],
        drafts: [],
        scheduled: [],
        published: [],
      }

      const html = renderToStaticMarkup(
        React.createElement(StudioDashboardView, {
          state: 'ideal',
          data: emptyData,
        }),
      )

      expect(html).toContain('NEWSROOM ONBOARDING')
      expect(html).toContain('Welcome to Foundry Studio Editorial Desk')
      expect(html).toContain('Organize Beats')
      expect(html).toContain('Draft a Story')
      expect(html).toContain('Editorial desk is clear')
      expect(html).toContain('No drafts in progress')
    })
  })

  describe('4. Server-Side Data & Role Boundary Verification', () => {
    it('strictly isolates author drafts and submissions from other authors', async () => {
      const timestamp = Date.now()

      // Create draft for authorOne
      const alphaDraft = await payload.create({
        collection: 'posts',
        data: {
          title: `Alpha Draft Unique Title ${timestamp}`,
          slug: `alpha-draft-${timestamp}`,
          status: 'draft',
          content: sampleLexicalContent,
        },
        user: authorOne,
        overrideAccess: false,
      })

      // Create in_review post for authorOne
      const alphaReview = await payload.create({
        collection: 'posts',
        data: {
          title: `Alpha In-Review Unique Title ${timestamp}`,
          slug: `alpha-review-${timestamp}`,
          status: 'in_review',
          content: sampleLexicalContent,
        },
        user: authorOne,
        overrideAccess: false,
      })

      // Create draft for authorTwo
      const betaDraft = await payload.create({
        collection: 'posts',
        data: {
          title: `Beta Secret Draft ${timestamp}`,
          slug: `beta-draft-${timestamp}`,
          status: 'draft',
          content: sampleLexicalContent,
        },
        user: authorTwo,
        overrideAccess: false,
      })

      // Create in_review post for authorTwo
      const betaReview = await payload.create({
        collection: 'posts',
        data: {
          title: `Beta Secret Review ${timestamp}`,
          slug: `beta-review-${timestamp}`,
          status: 'in_review',
          content: sampleLexicalContent,
        },
        user: authorTwo,
        overrideAccess: false,
      })

      expect(alphaDraft.id).toBeDefined()
      expect(alphaReview.id).toBeDefined()
      expect(betaDraft.id).toBeDefined()
      expect(betaReview.id).toBeDefined()

      function createMockProps(u: User | null): Parameters<typeof StudioDashboard>[0] {
        return {
          user: u as unknown as Parameters<typeof StudioDashboard>[0]['user'],
          payload,
          initPageResult: {
            req: { user: u } as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['req'],
            permissions: {} as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['permissions'],
            visibleEntities: { collections: ['posts'], globals: [] },
            locale: undefined,
            cookies: new Map(),
            languageOptions: [] as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['languageOptions'],
            translations: {} as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['translations'],
          },
          i18n: {} as unknown as Parameters<typeof StudioDashboard>[0]['i18n'],
          locale: undefined,
          permissions: {} as unknown as Parameters<typeof StudioDashboard>[0]['permissions'],
          visibleEntities: { collections: ['posts'], globals: [] },
          clientConfig: {} as unknown as Parameters<typeof StudioDashboard>[0]['clientConfig'],
          importMap: {} as unknown as Parameters<typeof StudioDashboard>[0]['importMap'],
          params: {},
          viewType: 'dashboard',
        }
      }

      // Execute StudioDashboard server component for authorOne
      const authorViewResult = await StudioDashboard(createMockProps(authorOne))
      const authorHtml = renderToStaticMarkup(authorViewResult as React.ReactElement)

      // Author 1 MUST see their own dispatches
      expect(authorHtml).toContain(`Alpha Draft Unique Title ${timestamp}`)
      expect(authorHtml).toContain(`Alpha In-Review Unique Title ${timestamp}`)

      // Author 1 MUST NOT see Author 2's draft or review submission!
      expect(authorHtml).not.toContain(`Beta Secret Draft ${timestamp}`)
      expect(authorHtml).not.toContain(`Beta Secret Review ${timestamp}`)

      // Execute StudioDashboard server component for editor
      const editorViewResult = await StudioDashboard(createMockProps(testEditor))
      const editorHtml = renderToStaticMarkup(editorViewResult as React.ReactElement)

      // Editor CAN see both submissions in the review queue
      expect(editorHtml).toContain(`Alpha In-Review Unique Title ${timestamp}`)
      expect(editorHtml).toContain(`Beta Secret Review ${timestamp}`)

      // Execute StudioDashboard server component for admin
      const adminViewResult = await StudioDashboard(createMockProps(testAdmin))
      const adminHtml = renderToStaticMarkup(adminViewResult as React.ReactElement)
      expect(adminHtml).toContain('ADMINISTRATIVE DESK')
      expect(adminHtml).toContain('Staff Directory')
    })

    it('renders permission-denied state when user is not authenticated', async () => {
      function createEmptyProps(): Parameters<typeof StudioDashboard>[0] {
        return {
          user: null as unknown as Parameters<typeof StudioDashboard>[0]['user'],
          payload,
          initPageResult: {
            req: {} as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['req'],
            permissions: {} as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['permissions'],
            visibleEntities: { collections: [], globals: [] },
            locale: undefined,
            cookies: new Map(),
            languageOptions: [] as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['languageOptions'],
            translations: {} as unknown as Parameters<typeof StudioDashboard>[0]['initPageResult']['translations'],
          },
          i18n: {} as unknown as Parameters<typeof StudioDashboard>[0]['i18n'],
          locale: undefined,
          permissions: {} as unknown as Parameters<typeof StudioDashboard>[0]['permissions'],
          visibleEntities: { collections: [], globals: [] },
          clientConfig: {} as unknown as Parameters<typeof StudioDashboard>[0]['clientConfig'],
          importMap: {} as unknown as Parameters<typeof StudioDashboard>[0]['importMap'],
          params: {},
          viewType: 'dashboard',
        }
      }

      const unauthResult = await StudioDashboard(createEmptyProps())
      const html = renderToStaticMarkup(unauthResult as React.ReactElement)
      expect(html).toContain('Restricted Editorial Newsroom Desk')
    })
  })
})
