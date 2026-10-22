import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import sharp from 'sharp'
import type { User, Category, Tag, Post } from '@/payload-types'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
let testEditor: User
let testCategory: Category
let testTag: Tag

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
            text: 'Foundry Studio publishing domain verification article.',
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

describe('FS-003 Publishing Domain & Access Control', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Clean up any residual test data
    await payload.delete({
      collection: 'posts',
      where: {
        slug: {
          like: 'test-%',
        },
      },
    })

    // Seed test editor user
    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: 'fs003-editor@devcrafters.io' } },
    })

    if (existingUsers.docs.length > 0) {
      testEditor = existingUsers.docs[0]
    } else {
      testEditor = await payload.create({
        collection: 'users',
        data: {
          name: 'Chief Editorial Lead',
          email: 'fs003-editor@devcrafters.io',
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
    }

    // Seed test category
    testCategory = await payload.create({
      collection: 'categories',
      data: {
        name: 'Architecture & Design',
        slug: 'test-arch-design',
        description: 'Systems architecture and design standards.',
      },
      overrideAccess: false,
      user: testEditor,
    })

    // Seed test tag
    testTag = await payload.create({
      collection: 'tags',
      data: {
        name: 'Payload CMS',
        slug: 'test-payload-cms',
      },
      overrideAccess: false,
      user: testEditor,
    })
  })

  afterAll(async () => {
    // Clean up created entities
    try {
      await payload.delete({
        collection: 'posts',
        where: { slug: { like: 'test-%' } },
      })
      if (testCategory?.id) {
        await payload.delete({ collection: 'categories', id: testCategory.id })
      }
      if (testTag?.id) {
        await payload.delete({ collection: 'tags', id: testTag.id })
      }
      if (testEditor?.id) {
        await payload.delete({ collection: 'users', id: testEditor.id })
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('Categories & Tags', () => {
    it('creates categories with unique slugs and permits public reading', async () => {
      expect(testCategory).toBeDefined()
      expect(testCategory.name).toBe('Architecture & Design')
      expect(testCategory.slug).toBe('test-arch-design')

      // Anonymous public read should succeed
      const publicCategories = await payload.find({
        collection: 'categories',
        where: { slug: { equals: 'test-arch-design' } },
        overrideAccess: false,
        user: null,
      })
      expect(publicCategories.docs.length).toBe(1)

      // Duplicate slug must be rejected
      await expect(
        payload.create({
          collection: 'categories',
          data: {
            name: 'Duplicate Category',
            slug: 'test-arch-design',
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow()
    })

    it('creates tags with unique slugs and permits public reading', async () => {
      expect(testTag).toBeDefined()
      expect(testTag.name).toBe('Payload CMS')
      expect(testTag.slug).toBe('test-payload-cms')

      // Anonymous public read should succeed
      const publicTags = await payload.find({
        collection: 'tags',
        where: { slug: { equals: 'test-payload-cms' } },
        overrideAccess: false,
        user: null,
      })
      expect(publicTags.docs.length).toBe(1)
    })

    it('blocks anonymous creation of categories and tags', async () => {
      await expect(
        payload.create({
          collection: 'categories',
          data: {
            name: 'Unauthorized Category',
            slug: 'test-unauthorized-cat',
          },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      await expect(
        payload.create({
          collection: 'tags',
          data: {
            name: 'Unauthorized Tag',
            slug: 'test-unauthorized-tag',
          },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Posts Creation & Validation', () => {
    it('creates a draft post with relationships and auto-generates slug', async () => {
      const draftPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Article on Architectural Decisions',
          // slug omitted to verify auto-generation
          status: 'draft',
          content: sampleLexicalContent,
          categories: [testCategory.id],
          tags: [testTag.id],
        } as unknown as Omit<Post, 'id' | 'createdAt' | 'updatedAt'>,
        overrideAccess: false,
        user: testEditor,
      })

      expect(draftPost).toBeDefined()
      expect(draftPost.title).toBe('Test Article on Architectural Decisions')
      expect(draftPost.slug).toBe('test-article-on-architectural-decisions')
      expect(draftPost.status).toBe('draft')

      const authorId = typeof draftPost.author === 'object' && draftPost.author !== null ? draftPost.author.id : draftPost.author
      expect(authorId).toBe(testEditor.id)
    })

    it('enforces unique slugs on posts', async () => {
      // First post with fixed slug
      await payload.create({
        collection: 'posts',
        data: {
          title: 'Unique Slug Post Alpha',
          slug: 'test-unique-slug-conflict',
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // Second post attempting same slug must throw
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Unique Slug Post Beta',
            slug: 'test-unique-slug-conflict',
            status: 'draft',
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow()
    })

    it('rejects invalid non-URL-safe slugs', async () => {
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Invalid Slug Post',
            slug: 'invalid slug with spaces and uppercase',
            status: 'draft',
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/URL Slug/)
    })

    it('requires a future publication date when status is scheduled', async () => {
      // Missing publication date
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Test Missing Date Scheduled Post',
            slug: 'test-missing-date-scheduled',
            status: 'scheduled',
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/publishedAt/)

      // Past date when scheduling
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Test Past Date Scheduled Post',
            slug: 'test-past-date-scheduled',
            status: 'scheduled',
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/future/)
    })

    it('rejects post creation with status published when publication date is in the future', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await expect(
        payload.create({
          collection: 'posts',
          data: {
            title: 'Test Future Published Post',
            slug: 'test-future-published-post',
            status: 'published',
            publishedAt: futureDate,
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/scheduled/)
    })

    it('rejects updating post to status scheduled with a past publication date', async () => {
      const draft = await payload.create({
        collection: 'posts',
        data: {
          title: 'Draft to Scheduled Post',
          slug: 'test-draft-to-scheduled',
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      await expect(
        payload.update({
          collection: 'posts',
          id: draft.id,
          data: {
            status: 'scheduled',
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/future/)
    })
  })

  describe('Publishing Lifecycle & Access Control', () => {
    let draftPost: Post
    let futureScheduledPost: Post
    let pastScheduledPost: Post
    let publishedPost: Post

    beforeAll(async () => {
      // 1. Draft Post
      draftPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Strictly Private Draft Post',
          slug: 'test-private-draft-post',
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // 2. Scheduled Post in the future (+24 hours)
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      futureScheduledPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Future Scheduled Post',
          slug: 'test-future-scheduled-post',
          status: 'scheduled',
          publishedAt: futureDate,
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // 3. Published Post
      publishedPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Live Published Post',
          slug: 'test-live-published-post',
          status: 'published',
          publishedAt: new Date(Date.now() - 60000).toISOString(),
          content: sampleLexicalContent,
          author: testEditor.id,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // 4. Scheduled Post whose publication time has now passed (-1 hour)
      pastScheduledPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Matured Scheduled Post',
          slug: 'test-matured-scheduled-post',
          status: 'scheduled',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          content: sampleLexicalContent,
        },
        context: {
          allowPastScheduled: true,
        },
      })
    })

    it('allows authenticated editorial users to view drafts and scheduled posts', async () => {
      const editorDrafts = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-private-draft-post' } },
        overrideAccess: false,
        user: testEditor,
      })
      expect(editorDrafts.docs.length).toBe(1)
      expect(editorDrafts.docs[0].id).toBe(draftPost.id)

      const editorScheduled = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-future-scheduled-post' } },
        overrideAccess: false,
        user: testEditor,
      })
      expect(editorScheduled.docs.length).toBe(1)
      expect(editorScheduled.docs[0].id).toBe(futureScheduledPost.id)
    })

    it('allows any authenticated editorial user to read drafts and scheduled posts across authors', async () => {
      const colleagueUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Colleague Editor',
          email: `fs003-colleague-${Date.now()}@devcrafters.io`,
          password: 'CorrectHorseBatteryStapleColleague1!',
        },
      })

      try {
        // Colleague can read testEditor's draft via collection query
        const colleagueDrafts = await payload.find({
          collection: 'posts',
          where: { slug: { equals: 'test-private-draft-post' } },
          overrideAccess: false,
          user: colleagueUser,
        })
        expect(colleagueDrafts.docs.length).toBe(1)
        expect(colleagueDrafts.docs[0].id).toBe(draftPost.id)

        // Colleague can read testEditor's draft via direct-ID lookup
        const directColleagueDraft = await payload.findByID({
          collection: 'posts',
          id: draftPost.id,
          overrideAccess: false,
          user: colleagueUser,
        })
        expect(directColleagueDraft.id).toBe(draftPost.id)

        // Colleague can read testEditor's future-scheduled post via direct-ID lookup
        const directColleagueScheduled = await payload.findByID({
          collection: 'posts',
          id: futureScheduledPost.id,
          overrideAccess: false,
          user: colleagueUser,
        })
        expect(directColleagueScheduled.id).toBe(futureScheduledPost.id)
      } finally {
        await payload.delete({
          collection: 'users',
          id: colleagueUser.id,
        })
      }
    })

    it('strictly denies anonymous readers access to draft posts', async () => {
      const anonResult = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-private-draft-post' } },
        overrideAccess: false,
        user: null,
      })
      // Database query filter MUST return 0 results
      expect(anonResult.docs.length).toBe(0)

      // Direct findByID for draft must throw NotFound for anonymous user
      await expect(
        payload.findByID({
          collection: 'posts',
          id: draftPost.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })

    it('strictly denies anonymous readers access to future scheduled posts', async () => {
      const anonScheduled = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-future-scheduled-post' } },
        overrideAccess: false,
        user: null,
      })
      expect(anonScheduled.docs.length).toBe(0)

      await expect(
        payload.findByID({
          collection: 'posts',
          id: futureScheduledPost.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })

    it('allows anonymous readers access to live published posts', async () => {
      const anonPublished = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-live-published-post' } },
        overrideAccess: false,
        user: null,
      })
      expect(anonPublished.docs.length).toBe(1)
      expect(anonPublished.docs[0].id).toBe(publishedPost.id)
      expect(anonPublished.docs[0].title).toBe('Test Live Published Post')
    })

    it('makes scheduled posts eligible for public reading once publication date has passed', async () => {
      const anonMatured = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-matured-scheduled-post' } },
        overrideAccess: false,
        user: null,
      })
      expect(anonMatured.docs.length).toBe(1)
      expect(anonMatured.docs[0].id).toBe(pastScheduledPost.id)
    })

    it('protects author email privacy from anonymous readers on populated relationships', async () => {
      const anonQuery = await payload.find({
        collection: 'posts',
        where: { slug: { equals: 'test-live-published-post' } },
        depth: 1, // Populate author
        overrideAccess: false,
        user: null,
      })

      expect(anonQuery.docs.length).toBe(1)
      const post = anonQuery.docs[0]
      expect(post.author).toBeDefined()
      // Author name is public
      expect((post.author as User).name).toBe('Chief Editorial Lead')
      // Author email MUST NOT be exposed to anonymous users
      expect((post.author as User).email).toBeUndefined()
    })

    it('allows anonymous findByID access to live published and matured scheduled posts', async () => {
      const directPublished = await payload.findByID({
        collection: 'posts',
        id: publishedPost.id,
        overrideAccess: false,
        user: null,
      })
      expect(directPublished).toBeDefined()
      expect(directPublished.id).toBe(publishedPost.id)

      const directMatured = await payload.findByID({
        collection: 'posts',
        id: pastScheduledPost.id,
        overrideAccess: false,
        user: null,
      })
      expect(directMatured).toBeDefined()
      expect(directMatured.id).toBe(pastScheduledPost.id)
    })
  })

  describe('Publication Authorization & Lifecycle Mutation Invariants', () => {
    it('allows an authenticated author to publish directly and verifies immediate public visibility', async () => {
      const pubPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Direct Published Article by Author',
          slug: `test-direct-pub-${Date.now()}`,
          status: 'published',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // Verification 1: publishedAt automatically defaulted to current timestamp
      expect(pubPost.publishedAt).toBeDefined()
      const pubTime = new Date(pubPost.publishedAt as string).getTime()
      expect(pubTime).toBeLessThanOrEqual(Date.now())

      // Verification 2: Publicly readable immediately by anonymous readers
      const anonRead = await payload.findByID({
        collection: 'posts',
        id: pubPost.id,
        overrideAccess: false,
        user: null,
      })
      expect(anonRead.id).toBe(pubPost.id)

      // Clean up
      await payload.delete({ collection: 'posts', id: pubPost.id })
    })

    it('allows an author to unpublish an already-published post, making it private immediately', async () => {
      // 1. Create published post
      const livePost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Post to Unpublish',
          slug: `test-unpublish-${Date.now()}`,
          status: 'published',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // Confirm public before unpublishing
      const publicBefore = await payload.findByID({
        collection: 'posts',
        id: livePost.id,
        overrideAccess: false,
        user: null,
      })
      expect(publicBefore.id).toBe(livePost.id)

      // 2. Author changes status to draft (unpublishes)
      const unpublished = await payload.update({
        collection: 'posts',
        id: livePost.id,
        data: {
          status: 'draft',
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(unpublished.status).toBe('draft')

      // 3. Anonymous user is immediately denied access
      await expect(
        payload.findByID({
          collection: 'posts',
          id: livePost.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      const anonQuery = await payload.find({
        collection: 'posts',
        where: { id: { equals: livePost.id } },
        overrideAccess: false,
        user: null,
      })
      expect(anonQuery.docs.length).toBe(0)

      // Clean up
      await payload.delete({ collection: 'posts', id: livePost.id })
    })

    it('allows an author to reschedule an already-published post to a future date, retracting public access', async () => {
      // 1. Create published post
      const livePost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Post to Reschedule',
          slug: `test-reschedule-${Date.now()}`,
          status: 'published',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // 2. Author reschedules to +48 hours in future
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      const rescheduled = await payload.update({
        collection: 'posts',
        id: livePost.id,
        data: {
          status: 'scheduled',
          publishedAt: futureDate,
        },
        overrideAccess: false,
        user: testEditor,
      })
      expect(rescheduled.status).toBe('scheduled')

      // 3. Post is immediately retracted from public view
      await expect(
        payload.findByID({
          collection: 'posts',
          id: livePost.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Clean up
      await payload.delete({ collection: 'posts', id: livePost.id })
    })

    it('strictly prevents a scheduled post from becoming publicly readable earlier than its intended publication time', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const scheduledPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Strictly Future Post',
          slug: `test-strict-future-${Date.now()}`,
          status: 'scheduled',
          publishedAt: futureDate,
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: testEditor,
      })

      // Anonymous cannot read it
      await expect(
        payload.findByID({
          collection: 'posts',
          id: scheduledPost.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Attempting to mutate publishedAt to past while status is scheduled is rejected
      await expect(
        payload.update({
          collection: 'posts',
          id: scheduledPost.id,
          data: {
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/future/)

      // Clean up
      await payload.delete({ collection: 'posts', id: scheduledPost.id })
    })
  })

  describe('User Security & Privilege Boundaries', () => {
    it('allows users to update their own profile but rejects updating other users', async () => {
      const secondUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Junior Contributor',
          email: 'fs003-junior@devcrafters.io',
          password: 'CorrectHorseBatteryStaple456!',
        },
      })

      // Second user updating own name: permitted
      const selfUpdate = await payload.update({
        collection: 'users',
        id: secondUser.id,
        data: {
          name: 'Senior Contributor',
        },
        overrideAccess: false,
        user: secondUser,
      })
      expect(selfUpdate.name).toBe('Senior Contributor')

      // Second user trying to update testEditor's name: rejected
      await expect(
        payload.update({
          collection: 'users',
          id: testEditor.id,
          data: {
            name: 'Hacked Admin Name',
          },
          overrideAccess: false,
          user: secondUser,
        }),
      ).rejects.toThrow()

      // Clean up second user
      await payload.delete({
        collection: 'users',
        id: secondUser.id,
      })
    })

    it('prevents self-role privilege escalation and strips unauthorized privileged fields', async () => {
      // User attempts to inject elevated roles or flags
      const updated = await payload.update({
        collection: 'users',
        id: testEditor.id,
        data: {
          name: 'Chief Editorial Lead Verified',
          ...({
            role: 'superadmin',
            roles: ['admin', 'superuser'],
            isAdmin: true,
            salt: 'forged_salt',
            hash: 'forged_hash',
          } as Record<string, unknown>),
        },
        overrideAccess: false,
        user: testEditor,
      })

      expect(updated.name).toBe('Chief Editorial Lead Verified')
      expect((updated as unknown as Record<string, unknown>).role).toBeUndefined()
      expect((updated as unknown as Record<string, unknown>).roles).toBeUndefined()
      expect((updated as unknown as Record<string, unknown>).isAdmin).toBeUndefined()

      // Refetch from database to confirm persistent state
      const refreshed = await payload.findByID({
        collection: 'users',
        id: testEditor.id,
        overrideAccess: true,
      })
      expect((refreshed as unknown as Record<string, unknown>).role).toBeUndefined()
      expect((refreshed as unknown as Record<string, unknown>).isAdmin).toBeUndefined()
    })

    it('supports legitimate login and password change operations while blocking direct credential tampering', async () => {
      // 1. Legitimate login works
      const loginRes = await payload.login({
        collection: 'users',
        data: {
          email: testEditor.email,
          password: 'CorrectHorseBatteryStaple123!',
        },
      })
      expect(loginRes.token).toBeDefined()
      expect(loginRes.user?.email).toBe(testEditor.email)

      // 2. Login with incorrect password fails
      await expect(
        payload.login({
          collection: 'users',
          data: {
            email: testEditor.email,
            password: 'WrongPassword!',
          },
        }),
      ).rejects.toThrow()

      // 3. User updates their password legitimately
      await payload.update({
        collection: 'users',
        id: testEditor.id,
        data: {
          password: 'UpdatedPasswordStaple456!',
        },
        overrideAccess: false,
        user: testEditor,
      })

      // 4. Login with new password succeeds
      const newLogin = await payload.login({
        collection: 'users',
        data: {
          email: testEditor.email,
          password: 'UpdatedPasswordStaple456!',
        },
      })
      expect(newLogin.token).toBeDefined()

      // 5. Login with old password fails
      await expect(
        payload.login({
          collection: 'users',
          data: {
            email: testEditor.email,
            password: 'CorrectHorseBatteryStaple123!',
          },
        }),
      ).rejects.toThrow()

      // 6. Direct attempt to tamper with salt/hash without setting password is stripped/rejected
      await payload.update({
        collection: 'users',
        id: testEditor.id,
        data: {
          ...({
            salt: 'tampered_salt',
            hash: 'tampered_hash',
          } as Record<string, unknown>),
        },
        overrideAccess: false,
        user: testEditor,
      })

      // Legitimate login still succeeds with the valid password (not broken by tampered salt/hash)
      const afterTamperLogin = await payload.login({
        collection: 'users',
        data: {
          email: testEditor.email,
          password: 'UpdatedPasswordStaple456!',
        },
      })
      expect(afterTamperLogin.token).toBeDefined()

      // 7. Restore original password for test consistency
      await payload.update({
        collection: 'users',
        id: testEditor.id,
        data: {
          password: 'CorrectHorseBatteryStaple123!',
        },
        overrideAccess: false,
        user: testEditor,
      })
    })

    it('prevents author spoofing upon post creation', async () => {
      const email = `fs003-junior-${Date.now()}@devcrafters.io`
      const juniorUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Junior Writer',
          email,
          password: 'CorrectHorseBatteryStaple789!',
        },
      })

      try {
        // Junior attempts to forge author as testEditor
        const post = await payload.create({
          collection: 'posts',
          data: {
            title: 'Spoofed Post Attempt',
            slug: `test-spoofed-post-${Date.now()}`,
            status: 'draft',
            author: testEditor.id, // Forged author attempt
            content: sampleLexicalContent,
          },
          overrideAccess: false,
          user: juniorUser,
        })

        // Server hook MUST force author to juniorUser.id
        const resolvedAuthorId = typeof post.author === 'object' && post.author ? post.author.id : post.author
        expect(resolvedAuthorId).toBe(juniorUser.id)

        // Junior attempts to reassign author to testEditor on update
        await expect(
          payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              author: testEditor.id,
            },
            overrideAccess: false,
            user: juniorUser,
          }),
        ).rejects.toThrow(/reassign/)

        // Clean up post
        await payload.delete({
          collection: 'posts',
          id: post.id,
        })
      } finally {
        await payload.delete({
          collection: 'users',
          id: juniorUser.id,
        })
      }
    })

    it('enforces author-level editorial mutation boundaries: non-authors cannot edit or delete another user post', async () => {
      const authorA = await payload.create({
        collection: 'users',
        data: {
          name: 'Author Alpha',
          email: 'fs003-author-alpha@devcrafters.io',
          password: 'CorrectHorseBatteryStapleAlpha1!',
        },
      })

      const authorB = await payload.create({
        collection: 'users',
        data: {
          name: 'Author Beta',
          email: 'fs003-author-beta@devcrafters.io',
          password: 'CorrectHorseBatteryStapleBeta1!',
        },
      })

      // Author Alpha creates a post
      const postA = await payload.create({
        collection: 'posts',
        data: {
          title: 'Author Alpha Exclusive Post',
          slug: 'test-author-alpha-exclusive',
          status: 'draft',
          content: sampleLexicalContent,
        },
        overrideAccess: false,
        user: authorA,
      })

      // Author Beta attempts to update Author Alpha's post: MUST be denied (throws or returns 0 matches)
      await expect(
        payload.update({
          collection: 'posts',
          id: postA.id,
          data: {
            title: 'Hacked by Author Beta',
          },
          overrideAccess: false,
          user: authorB,
        }),
      ).rejects.toThrow()

      // Author Beta attempts to delete Author Alpha's post: MUST be denied
      await expect(
        payload.delete({
          collection: 'posts',
          id: postA.id,
          overrideAccess: false,
          user: authorB,
        }),
      ).rejects.toThrow()

      // Author Alpha can update own post
      const updatedPostA = await payload.update({
        collection: 'posts',
        id: postA.id,
        data: {
          title: 'Author Alpha Legitimate Edit',
        },
        overrideAccess: false,
        user: authorA,
      })
      expect(updatedPostA.title).toBe('Author Alpha Legitimate Edit')

      // Author Alpha can delete own post
      await expect(
        payload.delete({
          collection: 'posts',
          id: postA.id,
          overrideAccess: false,
          user: authorA,
        }),
      ).resolves.toBeDefined()

      // Clean up users
      await payload.delete({ collection: 'users', id: authorA.id })
      await payload.delete({ collection: 'users', id: authorB.id })
    })

    it('strictly denies anonymous users mutation access across all collections', async () => {
      // Anonymous cannot update posts
      await expect(
        payload.update({
          collection: 'posts',
          id: 1,
          data: { title: 'Anon Defacement' },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Anonymous cannot delete posts
      await expect(
        payload.delete({
          collection: 'posts',
          id: 1,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Anonymous cannot update categories
      await expect(
        payload.update({
          collection: 'categories',
          id: testCategory.id,
          data: { name: 'Anon Category' },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Anonymous cannot delete categories
      await expect(
        payload.delete({
          collection: 'categories',
          id: testCategory.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Anonymous cannot update tags
      await expect(
        payload.update({
          collection: 'tags',
          id: testTag.id,
          data: { name: 'Anon Tag' },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()

      // Anonymous cannot delete tags
      await expect(
        payload.delete({
          collection: 'tags',
          id: testTag.id,
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Media Validation & Security', () => {
    it('creates a valid image media record with dimensions and variants', async () => {
      const buffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: 'A valid accessible test image',
        },
        file: {
          data: buffer,
          mimetype: 'image/png',
          name: 'test-valid-image.png',
          size: buffer.length,
        },
        overrideAccess: false,
        user: testEditor,
      })

      expect(mediaDoc).toBeDefined()
      expect(mediaDoc.alt).toBe('A valid accessible test image')
      expect(mediaDoc.mimeType).toBe('image/png')
      expect(mediaDoc.width).toBe(800)
      expect(mediaDoc.height).toBe(600)
      expect(mediaDoc.sizes?.thumbnail).toBeDefined()
      expect(mediaDoc.sizes?.card).toBeDefined()
      expect(mediaDoc.sizes?.feature).toBeDefined()

      // Clean up test media
      await payload.delete({
        collection: 'media',
        id: mediaDoc.id,
      })
    })

    it('rejects uploads exceeding the 10MB limit', async () => {
      const fakeLargeSize = 11 * 1024 * 1024 // 11MB
      const smallBuffer = Buffer.from('fake data')

      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Oversized file test',
          },
          file: {
            data: smallBuffer,
            mimetype: 'image/png',
            name: 'test-oversized.png',
            size: fakeLargeSize,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow()
    })

    it('rejects unauthorized MIME types', async () => {
      const buffer = Buffer.from('echo "malicious script"')

      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Shell script upload',
          },
          file: {
            data: buffer,
            mimetype: 'application/x-sh',
            name: 'test-script.sh',
            size: buffer.length,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow()
    })

    it('strictly rejects SVG uploads due to embedded script and XML entity security risks', async () => {
      const svgPayload = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')

      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'SVG upload attempt',
          },
          file: {
            data: svgPayload,
            mimetype: 'image/svg+xml',
            name: 'attack.svg',
            size: svgPayload.length,
          },
          overrideAccess: false,
          user: testEditor,
        }),
      ).rejects.toThrow(/file|SVG|Unsupported/i)
    })

    it('blocks anonymous users from uploading media', async () => {
      const buffer = Buffer.from('test data')

      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Anonymous upload test',
          },
          file: {
            data: buffer,
            mimetype: 'image/png',
            name: 'test-anon.png',
            size: buffer.length,
          },
          overrideAccess: false,
          user: null,
        }),
      ).rejects.toThrow()
    })
  })
})
