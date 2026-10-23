import { describe, it, expect, beforeAll, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User, Post } from '@/payload-types'
import { Posts } from '@/collections/Posts'
import { calculateReadingTime } from '@/lib/reading-time'

// Mock next/headers draftMode
const mockEnable = vi.fn()
vi.mock('next/headers', () => ({
  draftMode: async () => ({
    enable: mockEnable,
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
            text: 'Foundry Studio Authoring Desk test content. This paragraph demonstrates rich text parsing within the custom writing canvas.',
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
let authorOnePost: Post
let authorTwoPost: Post

describe('FS-UI-008: Foundry Studio Authoring Desk & HUD', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // 1. Provision Admin
    testAdmin = await payload.create({
      collection: 'users',
      data: {
        name: 'Desk Admin',
        email: `fs008-admin-${timestamp}@devcrafters.io`,
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
        name: 'Desk Editor',
        email: `fs008-editor-${timestamp}@devcrafters.io`,
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
        name: 'Author Alpha',
        email: `fs008-author1-${timestamp}@devcrafters.io`,
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
        name: 'Author Beta',
        email: `fs008-author2-${timestamp}@devcrafters.io`,
        password: 'Password123!',
        role: 'author',
      },
      overrideAccess: true,
      context: { allowExplicitRole: true },
    })

    // 5. Create Draft Post for Author One
    authorOnePost = await payload.create({
      collection: 'posts',
      data: {
        title: 'Author Alpha First Dispatch',
        slug: `alpha-dispatch-${timestamp}`,
        excerpt: 'An insightful dispatch on authoring ergonomics.',
        content: sampleLexicalContent,
        status: 'draft',
        author: authorOne.id,
      },
      overrideAccess: true,
    })

    // 6. Create Draft Post for Author Two
    authorTwoPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'Author Beta Private Dispatch',
        slug: `beta-dispatch-${timestamp}`,
        excerpt: 'Confidential draft belonging exclusively to Author Beta.',
        content: sampleLexicalContent,
        status: 'draft',
        author: authorTwo.id,
      },
      overrideAccess: true,
    })
  })

  describe('1. Posts Collection Configuration & Extension Points', () => {
    it('registers StudioAuthoringHUD in admin.components.edit.beforeDocumentControls', () => {
      const editComponents = Posts.admin?.components?.edit
      expect(editComponents).toBeDefined()
      expect(editComponents?.beforeDocumentControls).toBeDefined()

      const beforeDocControls = editComponents?.beforeDocumentControls as string[]
      expect(Array.isArray(beforeDocControls)).toBe(true)
      expect(
        beforeDocControls.some((comp) => comp.includes('StudioAuthoringHUD'))
      ).toBe(true)
    })

    it('configures livePreview with dynamic slug URL and responsive breakpoints', () => {
      const livePreview = Posts.admin?.livePreview
      expect(livePreview).toBeDefined()
      expect(typeof livePreview?.url).toBe('function')

      // Validate URL generation
      if (typeof livePreview?.url === 'function') {
        const urlFn = livePreview.url as (args: { data: Record<string, unknown> }) => string
        const url = urlFn({
          data: { slug: 'test-slug-123' },
        })
        expect(url).toBe('/posts/test-slug-123')
      }

      // Validate responsive breakpoints
      expect(livePreview?.breakpoints).toBeDefined()
      expect(Array.isArray(livePreview?.breakpoints)).toBe(true)

      const names = livePreview?.breakpoints?.map((b) => b.name)
      expect(names).toContain('mobile')
      expect(names).toContain('tablet')
      expect(names).toContain('desktop')
    })

    it('enforces two-column layout: main canvas for content, sidebar for metadata', () => {
      const fields = Posts.fields

      const mainFields = ['title', 'slug', 'excerpt', 'content']
      const sidebarFields = ['status', 'publishedAt', 'author', 'featuredImage', 'categories', 'tags']

      mainFields.forEach((fieldName) => {
        const field = fields.find((f) => 'name' in f && f.name === fieldName)
        expect(field, `Expected field ${fieldName} to exist`).toBeDefined()
        // Main canvas fields do not have position: 'sidebar'
        const adminField = field && 'admin' in field ? (field.admin as Record<string, unknown>) : undefined
        expect(adminField?.position).not.toBe('sidebar')
      })

      sidebarFields.forEach((fieldName) => {
        const field = fields.find((f) => 'name' in f && f.name === fieldName)
        expect(field, `Expected sidebar field ${fieldName} to exist`).toBeDefined()
        const adminField = field && 'admin' in field ? (field.admin as Record<string, unknown>) : undefined
        expect(adminField?.position).toBe('sidebar')
      })
    })
  })

  describe('2. Dual-Mode Preview Authorization & Flow (POST /api/preview)', () => {
    const executePostPreview = async (body: Record<string, unknown>, token?: string) => {
      const { POST } = await import('@/app/api/preview/route')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `JWT ${token}`
        headers['Cookie'] = `payload-token=${token}`
      }

      const request = new Request('http://localhost:3000/api/preview', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      return POST(request)
    }

    it('strictly denies unauthenticated preview requests with 401 Unauthorized', async () => {
      const res = await executePostPreview({ slug: authorOnePost.slug })
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toContain('Authentication required')
    })

    it('rejects preview requests with missing slug with 400 Bad Request', async () => {
      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: authorOne.email,
          password: 'Password123!',
        },
      })

      const res = await executePostPreview({}, token)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Missing slug parameter')
    })

    it('returns 404 for non-existent slug requests by authenticated users', async () => {
      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: authorOne.email,
          password: 'Password123!',
        },
      })

      const res = await executePostPreview({ slug: `non-existent-${Date.now()}` }, token)
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toContain('Post not found')
    })

    it('authorizes Author Alpha to preview their OWN draft post without exposing secrets', async () => {
      mockEnable.mockClear()

      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: authorOne.email,
          password: 'Password123!',
        },
      })

      const res = await executePostPreview({ slug: authorOnePost.slug }, token)
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.url).toBe(`/posts/${authorOnePost.slug}`)
      // draftMode.enable() should have been called server-side
      expect(mockEnable).toHaveBeenCalled()
      // Ensure no secrets are leaked in response
      expect(data.secret).toBeUndefined()
    })

    it('strictly forbids Author Alpha from previewing Author Beta’s private draft with 403 Forbidden', async () => {
      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: authorOne.email,
          password: 'Password123!',
        },
      })

      const res = await executePostPreview({ slug: authorTwoPost.slug }, token)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toContain('Authors cannot preview drafts belonging to other authors')
    })

    it('allows Editor to preview Author Beta’s draft across author boundaries', async () => {
      mockEnable.mockClear()

      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: testEditor.email,
          password: 'Password123!',
        },
      })

      const res = await executePostPreview({ slug: authorTwoPost.slug }, token)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.url).toBe(`/posts/${authorTwoPost.slug}`)
      expect(mockEnable).toHaveBeenCalled()
    })

    it('allows Admin to preview any author’s draft across author boundaries', async () => {
      mockEnable.mockClear()

      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: testAdmin.email,
          password: 'Password123!',
        },
      })

      const res = await executePostPreview({ slug: authorTwoPost.slug }, token)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.url).toBe(`/posts/${authorTwoPost.slug}`)
      expect(mockEnable).toHaveBeenCalled()
    })

    it('preserves backward compatibility of GET /api/preview with valid secret for external callers', async () => {
      const { GET } = await import('@/app/api/preview/route')
      const validSecret = process.env.PREVIEW_SECRET || 'test-preview-secret'
      process.env.PREVIEW_SECRET = validSecret

      // Admin user with cookie
      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: testAdmin.email,
          password: 'Password123!',
        },
      })

      const req = new Request(
        `http://localhost:3000/api/preview?slug=${authorOnePost.slug}&secret=${validSecret}`,
        {
          headers: {
            Cookie: `payload-token=${token}`,
          },
        }
      )

      let resStatus = 0
      try {
        const res = await GET(req)
        resStatus = res.status
      } catch (err: unknown) {
        if (
          (err as Error)?.message === 'NEXT_REDIRECT' ||
          (err as { digest?: string })?.digest?.includes('NEXT_REDIRECT')
        ) {
          resStatus = 307
        } else {
          throw err
        }
      }

      expect(resStatus).toBe(307)
    })
  })

  describe('3. Word-Count & Reading-Time Derivation from Lexical AST', () => {
    it('returns 0 words and "0 min read" for empty or undefined content', () => {
      expect(calculateReadingTime(null)).toEqual({
        words: 0,
        minutes: 0,
        text: '0 min read',
      })
      expect(calculateReadingTime(undefined)).toEqual({
        words: 0,
        minutes: 0,
        text: '0 min read',
      })
      expect(calculateReadingTime({})).toEqual({
        words: 0,
        minutes: 0,
        text: '0 min read',
      })
    })

    it('accurately counts words and calculates reading time across nested Lexical nodes', () => {
      const sampleText = Array(450).fill('editorial').join(' ')
      const complexLexical = {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              tag: 'h1',
              children: [{ type: 'text', text: 'Important Headline' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', text: sampleText }],
            },
            {
              type: 'quote',
              children: [{ type: 'text', text: 'Notable quote from the editor.' }],
            },
          ],
        },
      }

      const metrics = calculateReadingTime(complexLexical)
      // 2 (headline) + 450 (body) + 5 (quote) = 457 words
      expect(metrics.words).toBe(457)
      // 457 words / 200 wpm = 2.285 -> rounded up to 3 mins
      expect(metrics.minutes).toBe(3)
      expect(metrics.text).toBe('3 min read')
    })
  })

  describe('4. Brand Stylesheet Integration for Authoring Desk', () => {
    it('verifies custom.scss contains Authoring Desk and HUD design tokens and classes', () => {
      const scssPath = path.resolve(process.cwd(), 'src/app/(payload)/custom.scss')
      expect(fs.existsSync(scssPath)).toBe(true)

      const scssContent = fs.readFileSync(scssPath, 'utf-8')

      // HUD classes
      expect(scssContent).toContain('.studio-authoring-hud')
      expect(scssContent).toContain('.studio-hud-status-saved')
      expect(scssContent).toContain('.studio-hud-status-modified')
      expect(scssContent).toContain('.studio-hud-status-saving')
      expect(scssContent).toContain('.studio-hud-status-readonly')
      expect(scssContent).toContain('.studio-hud-metrics')
      expect(scssContent).toContain('.studio-hud-btn-split')
      expect(scssContent).toContain('.studio-hud-btn-reader')

      // Two-column Authoring Desk classes
      expect(scssContent).toContain('.collection-edit--posts')
      expect(scssContent).toContain('.document-fields__main')
      expect(scssContent).toContain('.document-fields__sidebar')
      expect(scssContent).toContain('[data-field-name="title"]')
      expect(scssContent).toContain('[data-field-name="excerpt"]')
      expect(scssContent).toContain('[data-field-name="content"]')

      // Accessibility & reduced motion
      expect(scssContent).toContain('@media (prefers-reduced-motion: reduce)')
      expect(scssContent).toContain(':focus-visible')
    })
  })
})
