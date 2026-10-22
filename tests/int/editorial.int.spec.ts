import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let testAdmin: User
let testEditor: User
let testAuthor: User
let secondAuthor: User

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
            text: 'Foundry Studio editorial workflow and RBAC test content.',
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

describe('FS-004 Editorial Workflow & Role-Based Access Control', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Seed test admin
    const adminQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs004-admin@devcrafters.io' } },
    })
    if (adminQuery.docs.length > 0) {
      testAdmin = await payload.update({
        collection: 'users',
        id: adminQuery.docs[0].id,
        data: { role: 'admin' },
        overrideAccess: true,
      })
    } else {
      testAdmin = await payload.create({
        collection: 'users',
        data: {
          name: 'Platform Administrator',
          email: 'fs004-admin@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
          role: 'admin',
        },
        overrideAccess: true,
      })
    }

    // Seed test editor
    const editorQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs004-editor@devcrafters.io' } },
    })
    if (editorQuery.docs.length > 0) {
      testEditor = await payload.update({
        collection: 'users',
        id: editorQuery.docs[0].id,
        data: { role: 'editor' },
        overrideAccess: true,
      })
    } else {
      testEditor = await payload.create({
        collection: 'users',
        data: {
          name: 'Senior Managing Editor',
          email: 'fs004-editor@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
          role: 'editor',
        },
        overrideAccess: true,
      })
    }

    // Seed test author
    const authorQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs004-author@devcrafters.io' } },
    })
    if (authorQuery.docs.length > 0) {
      testAuthor = await payload.update({
        collection: 'users',
        id: authorQuery.docs[0].id,
        data: { role: 'author' },
        overrideAccess: true,
      })
    } else {
      testAuthor = await payload.create({
        collection: 'users',
        data: {
          name: 'Staff Columnist',
          email: 'fs004-author@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
          role: 'author',
        },
        overrideAccess: true,
      })
    }

    // Seed second author
    const secondQuery = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs004-author2@devcrafters.io' } },
    })
    if (secondQuery.docs.length > 0) {
      secondAuthor = await payload.update({
        collection: 'users',
        id: secondQuery.docs[0].id,
        data: { role: 'author' },
        overrideAccess: true,
      })
    } else {
      secondAuthor = await payload.create({
        collection: 'users',
        data: {
          name: 'Freelance Contributor',
          email: 'fs004-author2@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
          role: 'author',
        },
        overrideAccess: true,
      })
    }
  })

  afterAll(async () => {
    // Clean up test posts
    await payload.delete({
      collection: 'posts',
      where: {
        slug: {
          like: 'fs004-%',
        },
      },
    })
  })

  describe('Author Publishing Gates & Review Workflow', () => {
    it('blocks an author from creating a post directly with published status', async () => {
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Unauthorized Author Direct Publish',
            slug: `fs004-author-direct-pub-${Date.now()}`,
            status: 'published',
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow(/Authors are not permitted to directly publish/i)
    })

    it('blocks an author from creating a post with scheduled or archived status', async () => {
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Unauthorized Author Schedule',
            slug: `fs004-author-sched-${Date.now()}`,
            status: 'scheduled',
            publishedAt: new Date(Date.now() + 86400000).toISOString(),
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow(/Authors are not permitted to directly publish/i)

      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Unauthorized Author Archive',
            slug: `fs004-author-archive-${Date.now()}`,
            status: 'archived',
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow(/Authors are not permitted to directly publish/i)
    })

    it('allows an author to create a draft and submit it to in_review', async () => {
      const draft = await payload.create({
        collection: 'posts',
        data: {
          title: 'Author Draft for Review',
          slug: `fs004-draft-review-${Date.now()}`,
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testAuthor,
      })
      expect(draft.status).toBe('draft')
      const authorId = typeof draft.author === 'object' ? (draft.author as User).id : draft.author
      expect(authorId).toBe(testAuthor.id)

      // Author submits to in_review
      const submitted = await payload.update({
        collection: 'posts',
        id: draft.id,
        data: {
          status: 'in_review',
        },
        overrideAccess: false,
        user: testAuthor,
      })
      expect(submitted.status).toBe('in_review')
    })

    it('allows an author to recall an in_review post back to draft', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Post to Recall',
          slug: `fs004-recall-${Date.now()}`,
          status: 'in_review',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testAuthor,
      })
      expect(post.status).toBe('in_review')

      // Recall to draft
      const recalled = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          status: 'draft',
        },
        overrideAccess: false,
        user: testAuthor,
      })
      expect(recalled.status).toBe('draft')
    })

    it('strictly denies public reading of in_review and archived posts', async () => {
      const reviewPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Under Review Secret',
          slug: `fs004-secret-review-${Date.now()}`,
          status: 'in_review',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testAuthor,
      })

      // Anonymous findByID must reject
      await expect(
        payload.findByID({
          collection: 'posts',
          id: reviewPost.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Anonymous query must return 0 docs
      const queryResult = await payload.find({
        collection: 'posts',
        where: { id: { equals: reviewPost.id } },
        overrideAccess: false,
        user: null,
      })
      expect(queryResult.docs.length).toBe(0)
    })
  })

  describe('Editor & Administrator Publishing Authority', () => {
    it('allows an editor to approve and publish an in_review post', async () => {
      // 1. Author submits
      const submitted = await payload.create({
        collection: 'posts',
        data: {
          title: 'Editorial Approval Candidate',
          slug: `fs004-editor-approval-${Date.now()}`,
          status: 'in_review',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testAuthor,
      })

      // 2. Editor approves and publishes
      const published = await payload.update({
        collection: 'posts',
        id: submitted.id,
        data: {
          status: 'published',
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(published.status).toBe('published')
      expect(published.publishedAt).toBeDefined()

      // 3. Now visible publicly
      const publicDoc = await payload.findByID({
        collection: 'posts',
        id: published.id,
        overrideAccess: false,
        user: null,
      })
      expect(publicDoc.id).toBe(published.id)
    })

    it('allows an editor to schedule, unpublish, and archive a post', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Editor Lifecycle Management',
          slug: `fs004-lifecycle-${Date.now()}`,
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // Schedule for future
      const scheduledDate = new Date(Date.now() + 7 * 86400000).toISOString()
      const scheduled = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          status: 'scheduled',
          publishedAt: scheduledDate,
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(scheduled.status).toBe('scheduled')

      // Publish
      const published = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          status: 'published',
          publishedAt: new Date().toISOString(),
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(published.status).toBe('published')

      // Archive
      const archived = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          status: 'archived',
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(archived.status).toBe('archived')

      // Public cannot view archived
      await expect(
        payload.findByID({
          collection: 'posts',
          id: post.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })

    it('allows editor to reassign author while blocking author from reassigning', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Author Reassignment Invariant',
          slug: `fs004-reassign-${Date.now()}`,
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testAuthor,
      })
      const authorId = typeof post.author === 'object' ? (post.author as User).id : post.author
      expect(authorId).toBe(testAuthor.id)

      // Author attempts to reassign to secondAuthor -> BLOCKED
      await expect(
        payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            author: secondAuthor.id,
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow(/Cannot reassign post author/i)

      // Editor reassigns to secondAuthor -> ALLOWED
      const reassigned = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          author: secondAuthor.id,
        },
        overrideAccess: false,
        user: testEditor,
      })
      const reassignedId = typeof reassigned.author === 'object' ? (reassigned.author as User).id : reassigned.author
      expect(reassignedId).toBe(secondAuthor.id)
    })
  })

  describe('Taxonomy Governance & User RBAC Boundaries', () => {
    it('blocks authors from creating categories and tags, allows editors and admins', async () => {
      // Author attempts category creation -> Forbidden
      await expect(
        payload.create({
          collection: 'categories',
          data: {
            name: 'Unauthorized Author Category',
            slug: `fs004-author-cat-${Date.now()}`,
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow()

      // Author attempts tag creation -> Forbidden
      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: 'Unauthorized Author Tag',
            slug: `fs004-author-tag-${Date.now()}`,
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow()

      // Editor creates category -> Allowed
      const editorCategory = await payload.create({
        collection: 'categories',
        data: {
          name: 'Editor Approved Category',
          slug: `fs004-editor-cat-${Date.now()}`,
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(editorCategory.id).toBeDefined()

      // Admin creates tag -> Allowed
      const adminTag = await payload.create({
        collection: 'tags',
        data: {
          name: 'Admin Approved Tag',
          slug: `fs004-admin-tag-${Date.now()}`,
        },
        overrideAccess: false,
        user: testAdmin,
      })
      expect(adminTag.id).toBeDefined()
    })

    it('prevents non-admin from modifying user roles and allows admin to manage roles', async () => {
      // Author attempts to promote themselves to admin
      const authorAttempt = await payload.update({
        collection: 'users',
        id: testAuthor.id,
        data: {
          role: 'admin',
        },
        overrideAccess: false,
        user: testAuthor,
      })
      // Role remains author
      expect(authorAttempt.role).toBe('author')

      // Admin updates author role to editor
      const promoted = await payload.update({
        collection: 'users',
        id: testAuthor.id,
        data: {
          role: 'editor',
        },
        overrideAccess: false,
        user: testAdmin,
      })
      expect(promoted.role).toBe('editor')

      // Reset back to author
      await payload.update({
        collection: 'users',
        id: testAuthor.id,
        data: {
          role: 'author',
        },
        overrideAccess: false,
        user: testAdmin,
      })
    })

    it('blocks anonymous registration and role-injection once an administrator exists', async () => {
      // 1. Unauthenticated registration must be strictly forbidden
      await expect(
        payload.create({
          collection: 'users',
          data: {
            name: 'Malicious Attacker',
            email: `attacker-${Date.now()}@devcrafters.io`,
            password: 'CorrectHorseBatteryStaple123!',
            role: 'admin',
          },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // 2. Authenticated non-admin attempting to inject role: admin on user creation
      await expect(
        payload.create({
          collection: 'users',
          data: {
            name: 'Injected Staff Account',
            email: `injected-${Date.now()}@devcrafters.io`,
            password: 'CorrectHorseBatteryStaple123!',
            role: 'admin',
          },
          overrideAccess: false,
          user: testAuthor,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Draft Preview Route Security', () => {
    it('strictly denies preview access without valid secret', async () => {
      const { GET } = await import('@/app/api/preview/route')

      // Missing secret
      const resNoSecret = await GET(
        new Request('http://localhost:3000/api/preview?slug=fs004-test-post'),
      )
      expect(resNoSecret.status).toBe(401)

      // Invalid secret
      const resWrongSecret = await GET(
        new Request('http://localhost:3000/api/preview?slug=fs004-test-post&secret=invalid-secret-key'),
      )
      expect(resWrongSecret.status).toBe(401)

      // Missing slug with valid secret
      const validSecret = process.env.PREVIEW_SECRET || 'test-preview-secret'
      process.env.PREVIEW_SECRET = validSecret

      const resNoSlug = await GET(
        new Request(`http://localhost:3000/api/preview?secret=${validSecret}`),
      )
      expect(resNoSlug.status).toBe(400)
    })

    it('strictly denies preview access to unauthenticated callers even if they possess the valid secret', async () => {
      const { GET } = await import('@/app/api/preview/route')
      const validSecret = process.env.PREVIEW_SECRET || 'test-preview-secret'

      // Unauthenticated caller possesses PREVIEW_SECRET but no auth cookie/token
      const res = await GET(
        new Request(`http://localhost:3000/api/preview?slug=fs004-test-post&secret=${validSecret}`),
      )
      // Must reject with 401: secret alone does NOT grant access
      expect(res.status).toBe(401)
      const text = await res.text()
      expect(text).toContain('Authentication required')
    })

    it('enforces author-level preview boundaries and allows editor/admin preview across authors', async () => {
      const { GET } = await import('@/app/api/preview/route')
      const validSecret = process.env.PREVIEW_SECRET || 'test-preview-secret'

      // Helper to handle Next.js redirect execution
      const executePreview = async (request: Request) => {
        try {
          return await GET(request)
        } catch (err: unknown) {
          if (
            (err as Error)?.message === 'NEXT_REDIRECT' ||
            (err as { digest?: string })?.digest?.includes('NEXT_REDIRECT')
          ) {
            return new Response(null, { status: 307 })
          }
          throw err
        }
      }

      // Create draft post owned by testAuthor
      const authorPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Author Alpha Private Draft',
          slug: `fs004-author-alpha-${Date.now()}`,
          status: 'draft',
          author: testAuthor.id,
          content: sampleLexicalContent,
        },
        overrideAccess: true,
      })

      // Create draft post owned by secondAuthor
      const secondAuthorPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Author Beta Private Draft',
          slug: `fs004-author-beta-${Date.now()}`,
          status: 'draft',
          author: secondAuthor.id,
          content: sampleLexicalContent,
        },
        overrideAccess: true,
      })

      // Generate login tokens for all roles
      const authorLogin = await payload.login({
        collection: 'users',
        data: {
          email: testAuthor.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      const authorToken = authorLogin.token

      const editorLogin = await payload.login({
        collection: 'users',
        data: {
          email: testEditor.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      const editorToken = editorLogin.token

      const adminLogin = await payload.login({
        collection: 'users',
        data: {
          email: testAdmin.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      const adminToken = adminLogin.token

      // 1. Author Alpha previews Author Alpha's OWN draft: ALLOWED (redirect to /posts/[slug])
      const resAuthorOwn = await executePreview(
        new Request(
          `http://localhost:3000/api/preview?slug=${authorPost.slug}&secret=${validSecret}`,
          {
            headers: {
              cookie: `payload-token=${authorToken}`,
            },
          },
        ),
      )
      expect(resAuthorOwn.status).toBe(307)

      // 2. Author Alpha attempts to preview Author Beta's private draft: FORBIDDEN (403)
      const resAuthorOther = await executePreview(
        new Request(
          `http://localhost:3000/api/preview?slug=${secondAuthorPost.slug}&secret=${validSecret}`,
          {
            headers: {
              cookie: `payload-token=${authorToken}`,
            },
          },
        ),
      )
      expect(resAuthorOther.status).toBe(403)
      const errorText = await resAuthorOther.text()
      expect(errorText).toContain('Authors cannot preview drafts belonging to other authors')

      // 3. Editor previews Author Beta's private draft: ALLOWED (redirect)
      const resEditor = await executePreview(
        new Request(
          `http://localhost:3000/api/preview?slug=${secondAuthorPost.slug}&secret=${validSecret}`,
          {
            headers: {
              cookie: `payload-token=${editorToken}`,
            },
          },
        ),
      )
      expect(resEditor.status).toBe(307)

      // 4. Admin previews Author Beta's private draft: ALLOWED (redirect)
      const resAdmin = await executePreview(
        new Request(
          `http://localhost:3000/api/preview?slug=${secondAuthorPost.slug}&secret=${validSecret}`,
          {
            headers: {
              cookie: `payload-token=${adminToken}`,
            },
          },
        ),
      )
      expect(resAdmin.status).toBe(307)

      // 5. Authenticated Admin previews non-existent slug: 404
      const resNotFound = await executePreview(
        new Request(
          `http://localhost:3000/api/preview?slug=non-existent-slug-${Date.now()}&secret=${validSecret}`,
          {
            headers: {
              cookie: `payload-token=${adminToken}`,
            },
          },
        ),
      )
      expect(resNotFound.status).toBe(404)
    })

    it('strictly prevents draft mode cookies from accessing unauthorized drafts on the reader route', async () => {
      const { getPost } = await import('@/app/(frontend)/posts/[slug]/page')

      // Create draft post owned by secondAuthor
      const draftPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Author Beta Confidential Story',
          slug: `fs004-confidential-${Date.now()}`,
          status: 'draft',
          author: secondAuthor.id,
          content: sampleLexicalContent,
        },
        overrideAccess: true,
      })

      // Tokens
      const authorLogin = await payload.login({
        collection: 'users',
        data: {
          email: testAuthor.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      const authorToken = authorLogin.token

      const secondAuthorLogin = await payload.login({
        collection: 'users',
        data: {
          email: secondAuthor.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      const secondAuthorToken = secondAuthorLogin.token

      const editorLogin = await payload.login({
        collection: 'users',
        data: {
          email: testEditor.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      const editorToken = editorLogin.token

      // 1. Regular public reader without draft mode: cannot retrieve draft
      const publicResult = await getPost(draftPost.slug, false)
      expect(publicResult).toBeNull()

      // 2. Visitor has Draft Mode enabled, but is unauthenticated: cannot retrieve draft
      const anonHeaders = new Headers()
      const anonDraftResult = await getPost(draftPost.slug, true, anonHeaders)
      expect(anonDraftResult).toBeNull()

      // 3. Visitor has Draft Mode enabled, but is logged in as Author Alpha (different author):
      // CANNOT access Author Beta's draft
      const authorAlphaHeaders = new Headers({
        cookie: `payload-token=${authorToken}`,
      })
      const authorAlphaResult = await getPost(draftPost.slug, true, authorAlphaHeaders)
      expect(authorAlphaResult).toBeNull()

      // 4. Author Beta (owner) with Draft Mode enabled: ALLOWED
      const authorBetaHeaders = new Headers({
        cookie: `payload-token=${secondAuthorToken}`,
      })
      const authorBetaResult = await getPost(draftPost.slug, true, authorBetaHeaders)
      expect(authorBetaResult).not.toBeNull()
      expect(authorBetaResult?.slug).toBe(draftPost.slug)

      // 5. Editor with Draft Mode enabled: ALLOWED
      const editorHeaders = new Headers({
        cookie: `payload-token=${editorToken}`,
      })
      const editorResult = await getPost(draftPost.slug, true, editorHeaders)
      expect(editorResult).not.toBeNull()
      expect(editorResult?.slug).toBe(draftPost.slug)
    })
  })
})

