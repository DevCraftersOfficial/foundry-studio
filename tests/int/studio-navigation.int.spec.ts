import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'fs'
import path from 'path'
import { StudioNavClient } from '@/components/admin/StudioNavClient'
import { StudioHeader } from '@/components/admin/StudioHeader'
import config from '@/payload.config'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock @payloadcms/ui
vi.mock('@payloadcms/ui', () => ({
  useAuth: () => ({
    user: { email: 'admin@devcrafters.io', role: 'admin' },
    logOut: vi.fn(),
  }),
}))

import type { ServerProps, TypedUser } from 'payload'

interface TestUser {
  email: string
  role: string
}

describe('FS-UI-006: Foundry Studio Navigation Shell & Desk Header', () => {
  describe('StudioNavClient Component', () => {
    it('renders brand masthead with DevCrafters mark and title', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'editor@devcrafters.io', name: 'Editorial Lead', role: 'editor' },
        })
      )

      expect(html).toContain('FOUNDRY STUDIO')
      expect(html).toContain('EDITORIAL WORKSPACE')
      expect(html).toContain('#EA580C')
      expect(html).toContain('polygon')
    })

    it('renders full navigation suite for admin role including Governance and Fallback tables', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'admin@devcrafters.io', name: 'Chief Admin', role: 'admin' },
        })
      )

      // Editorial Desk
      expect(html).toContain('Overview Desk')
      expect(html).toContain('Dispatches')
      expect(html).toContain('Media Room')
      // Taxonomy
      expect(html).toContain('Categories')
      expect(html).toContain('Topic Tags')
      // Governance
      expect(html).toContain('Staff &amp; Authors')
      expect(html).toContain('/admin/collections/users')
      // Fallback
      expect(html).toContain('Native Tables')
      expect(html).toContain('Fallback')
      // Role badge
      expect(html).toContain('ADMIN')
    })

    it('filters governance and fallback tables for editor role as a usability measure', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'editor@devcrafters.io', name: 'Senior Editor', role: 'editor' },
        })
      )

      // Permitted for editor
      expect(html).toContain('Overview Desk')
      expect(html).toContain('Dispatches')
      expect(html).toContain('Media Room')
      expect(html).toContain('Categories')
      expect(html).toContain('Topic Tags')

      // Hidden from editor navigation
      expect(html).not.toContain('Staff &amp; Authors')
      expect(html).not.toContain('/admin/collections/users')
      expect(html).not.toContain('Native Tables')
      expect(html).toContain('EDITOR')
    })

    it('restricts taxonomy, governance, and fallback tables for author role', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'writer@devcrafters.io', name: 'Staff Writer', role: 'author' },
        })
      )

      // Authors only see Core Editorial Desk
      expect(html).toContain('Overview Desk')
      expect(html).toContain('Dispatches')
      expect(html).toContain('Media Room')

      // Hidden from author
      expect(html).not.toContain('ORGANIZATION &amp; BEATS')
      expect(html).not.toContain('Categories')
      expect(html).not.toContain('Topic Tags')
      expect(html).not.toContain('Staff &amp; Authors')
      expect(html).not.toContain('Native Tables')
      expect(html).toContain('AUTHOR')
    })

    it('renders active link state and aria-current="page" on current pathname', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'admin@devcrafters.io', role: 'admin' },
        })
      )

      // Since mock usePathname returns '/admin'
      expect(html).toContain('aria-current="page"')
      expect(html).toContain('studio-nav-link active')
    })

    it('renders skeleton loading state when user is undefined', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: undefined,
        })
      )

      expect(html).toContain('aria-busy="true"')
      expect(html).toContain('studio-nav-skeleton')
      expect(html).toContain('studio-skeleton-brand')
    })

    it('renders restricted permission-denied state when visible collections are empty', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'restricted@devcrafters.io', role: 'guest' },
          visibleEntities: { collections: [], globals: [] },
        })
      )

      expect(html).toContain('Workspace Restricted')
      expect(html).toContain('No editorial desks are assigned to your account')
      expect(html).toContain('role="alert"')
    })

    it('renders user footer with accessible sign-out button', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudioNavClient, {
          user: { email: 'admin@devcrafters.io', name: 'Admin Lokesh', role: 'admin' },
        })
      )

      expect(html).toContain('Admin Lokesh')
      expect(html).toContain('aria-label="Sign out of Foundry Studio"')
      expect(html).toContain('Sign Out')
    })
  })

  describe('StudioHeader Component', () => {
    it('renders accessible banner landmark with desk claim', async () => {
      const testAdmin: TestUser = { email: 'admin@devcrafters.io', role: 'admin' }
      const element = await StudioHeader({
        user: testAdmin as unknown as TypedUser,
      } as unknown as ServerProps)
      const html = renderToStaticMarkup(element as React.ReactElement)

      expect(html).toContain('role="banner"')
      expect(html).toContain('aria-label="Foundry Studio Desk Header"')
      expect(html).toContain('EDITORIAL WORKSPACE')
      expect(html).toContain('Foundry Studio by DevCrafters')
    })

    it('renders live publishing indicator and role pill', async () => {
      const testEditor: TestUser = { email: 'editor@devcrafters.io', role: 'editor' }
      const element = await StudioHeader({
        user: testEditor as unknown as TypedUser,
      } as unknown as ServerProps)
      const html = renderToStaticMarkup(element as React.ReactElement)

      expect(html).toContain('LIVE PUBLISHING')
      expect(html).toContain('EDITOR')
      expect(html).toContain('Public Reader')
    })
  })

  describe('Payload Admin Component Registration', () => {
    it('registers StudioNav at admin.components.Nav', async () => {
      const resolvedConfig = await config
      const customNav = resolvedConfig.admin?.components?.Nav

      expect(customNav).toBe('@/components/admin/StudioNav#StudioNav')
    })

    it('registers StudioHeader at admin.components.header as an array', async () => {
      const resolvedConfig = await config
      const customHeader = resolvedConfig.admin?.components?.header

      expect(Array.isArray(customHeader)).toBe(true)
      expect(customHeader).toContain('@/components/admin/StudioHeader#StudioHeader')
    })

    it('resolves StudioNav and StudioHeader in generated importMap.js', () => {
      const importMapPath = path.resolve(process.cwd(), 'src/app/(payload)/admin/importMap.js')
      const importMapContent = fs.readFileSync(importMapPath, 'utf8')

      expect(importMapContent).toContain('"@/components/admin/StudioNav#StudioNav"')
      expect(importMapContent).toContain('"@/components/admin/StudioHeader#StudioHeader"')
      expect(importMapContent).toContain('import { StudioNav as')
      expect(importMapContent).toContain('import { StudioHeader as')
    })
  })
})
