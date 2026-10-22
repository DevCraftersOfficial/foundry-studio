import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

async function seedContent() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Find or create admin
  const adminQuery = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    overrideAccess: true,
  })

  const authorUser = adminQuery.docs[0] || null

  // Ensure category
  let categoryId: number
  const catQuery = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'architecture-design' } },
    overrideAccess: true,
  })

  if (catQuery.docs.length > 0) {
    categoryId = catQuery.docs[0].id
  } else {
    const cat = await payload.create({
      collection: 'categories',
      data: {
        name: 'Architecture & Design',
        slug: 'architecture-design',
        description: 'Reflections on publishing infrastructure, typography, and software architecture.',
      },
      overrideAccess: true,
    })
    categoryId = cat.id
  }

  // Ensure tag
  let tagId: number
  const tagQuery = await payload.find({
    collection: 'tags',
    where: { slug: { equals: 'systems' } },
    overrideAccess: true,
  })

  if (tagQuery.docs.length > 0) {
    tagId = tagQuery.docs[0].id
  } else {
    const tag = await payload.create({
      collection: 'tags',
      data: {
        name: 'Systems',
        slug: 'systems',
      },
      overrideAccess: true,
    })
    tagId = tag.id
  }

  // Check if lead article exists
  const postQuery = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'craft-of-editorial-systems' } },
    overrideAccess: true,
  })

  if (postQuery.docs.length === 0) {
    const lexicalBody = {
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
                text: 'Publishing software has for years surrendered to template conformity. In the rush toward automated generation and generic card grids, the tactile authority of the printed page was largely forgotten. Foundry Studio re-examines the principles that made mid-century editorial publications enduring: typographic rhythm, intentional white space, and rigorous editorial stewardship.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
          },
          {
            type: 'heading',
            tag: 'h2',
            format: '' as const,
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal' as const,
                text: 'The Architecture of Editorial Governance',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
          },
          {
            type: 'paragraph',
            format: '' as const,
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal' as const,
                text: 'A publication is only as credible as its review process. Content authoring must be protected from accidental leakage, while editors need absolute confidence in release timing. By establishing formal states—Draft, In Review, Scheduled, and Published—Foundry Studio guarantees that every dispatch meets editorial standards before reaching a single reader.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
          },
          {
            type: 'quote',
            format: '' as const,
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal' as const,
                text: '“Quiet craftsmanship triumphs over digital slop. When typography and content take center stage, the software recedes into the background.”',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
          },
          {
            type: 'paragraph',
            format: '' as const,
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal' as const,
                text: 'Every screen rendered by Foundry Studio respects deterministic accessibility (WCAG 2.2 AA) and responsive layout without sacrificing literary elegance.',
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

    await payload.create({
      collection: 'posts',
      data: {
        title: 'The Craft of Editorial Systems: Lessons from Print to Digital',
        slug: 'craft-of-editorial-systems',
        status: 'published',
        publishedAt: new Date().toISOString(),
        excerpt: 'How Foundry Studio bridges mid-century editorial typography with modern web performance and uncompromising publishing governance.',
        author: authorUser ? authorUser.id : undefined,
        categories: [categoryId],
        tags: [tagId],
        content: lexicalBody,
      },
      overrideAccess: true,
    })

    payload.logger.info('Sample editorial dispatch successfully seeded.')
  }

  process.exit(0)
}

seedContent().catch((err) => {
  console.error('Failed to seed sample content:', err)
  process.exit(1)
})
