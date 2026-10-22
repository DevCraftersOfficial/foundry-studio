import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AdminLogo } from '@/components/admin/Logo'
import { AdminIcon } from '@/components/admin/Icon'
import { AdminNavBrand } from '@/components/admin/NavBrand'
import config from '@/payload.config'

describe('FS-UI-004: Payload Admin Branding & Customization', () => {
  describe('AdminLogo Component', () => {
    it('renders with accessible role, title, and aria-label', () => {
      const html = renderToStaticMarkup(React.createElement(AdminLogo))

      expect(html).toContain('role="img"')
      expect(html).toContain('aria-label="Foundry Studio by DevCrafters"')
      expect(html).toContain('<title>Foundry Studio by DevCrafters</title>')
      expect(html).toContain('graphic-logo')
      expect(html).toContain('foundry-admin-logo')
    })

    it('contains DevCrafters mark and brand typography', () => {
      const html = renderToStaticMarkup(React.createElement(AdminLogo))

      // Flame Orange Hexagon Mark
      expect(html).toContain('#EA580C')
      expect(html).toContain('polygon')
      // Typography
      expect(html).toContain('FOUNDRY STUDIO')
      expect(html).toContain('BY DEVCRAFTERS')
    })

    it('applies custom className cleanly', () => {
      const html = renderToStaticMarkup(React.createElement(AdminLogo, { className: 'custom-logo-class' }))
      expect(html).toContain('custom-logo-class')
    })
  })

  describe('AdminIcon Component', () => {
    it('renders standard 25x25 viewBox with accessible attributes', () => {
      const html = renderToStaticMarkup(React.createElement(AdminIcon))

      expect(html).toContain('viewBox="0 0 25 25"')
      expect(html).toContain('role="img"')
      expect(html).toContain('aria-label="Foundry Studio"')
      expect(html).toContain('<title>Foundry Studio</title>')
      expect(html).toContain('graphic-icon')
      expect(html).toContain('foundry-admin-icon')
    })

    it('renders the DevCrafters hexagonal geometry with flame orange accent', () => {
      const html = renderToStaticMarkup(React.createElement(AdminIcon))

      expect(html).toContain('#EA580C')
      expect(html).toContain('polygon')
      expect(html).toContain('circle')
    })

    it('supports custom size and className props', () => {
      const html = renderToStaticMarkup(React.createElement(AdminIcon, { size: 32, className: 'sidebar-icon' }))

      expect(html).toContain('width="32"')
      expect(html).toContain('height="32"')
      expect(html).toContain('sidebar-icon')
    })
  })

  describe('AdminNavBrand Component', () => {
    it('renders accessible navigation link to dashboard with brand endorsement', () => {
      const html = renderToStaticMarkup(React.createElement(AdminNavBrand))

      expect(html).toContain('href="/admin"')
      expect(html).toContain('aria-label="Foundry Studio Editorial Workspace — Return to Dashboard"')
      expect(html).toContain('FOUNDRY STUDIO')
      expect(html).toContain('BY DEVCRAFTERS')
      expect(html).toContain('#EA580C')
    })
  })

  describe('Payload Config Branding Registration', () => {
    it('configures meta titleSuffix and favicon', async () => {
      const resolvedConfig = await config
      expect(resolvedConfig.admin?.meta?.titleSuffix).toContain('Foundry Studio by DevCrafters')
      const icons = resolvedConfig.admin?.meta?.icons as Array<{ url: string }> | undefined
      expect(icons?.[0]?.url).toBe('/favicon.svg')
    })

    it('registers supported graphics extension points (Logo, Icon)', async () => {
      const resolvedConfig = await config
      const graphics = resolvedConfig.admin?.components?.graphics

      expect(graphics).toBeDefined()
      expect(graphics?.Logo).toBe('@/components/admin/Logo#AdminLogo')
      expect(graphics?.Icon).toBe('@/components/admin/Icon#AdminIcon')
    })

    it('registers beforeNavLinks with AdminNavBrand', async () => {
      const resolvedConfig = await config
      const beforeNavLinks = resolvedConfig.admin?.components?.beforeNavLinks

      expect(beforeNavLinks).toBeDefined()
      expect(beforeNavLinks).toContain('@/components/admin/NavBrand#AdminNavBrand')
    })

    it('provides workflow guidance descriptions on sensitive editorial fields', async () => {
      const resolvedConfig = await config
      const postsCollection = resolvedConfig.collections?.find((c) => c.slug === 'posts')
      expect(postsCollection).toBeDefined()

      const statusField = postsCollection?.fields.find((f) => 'name' in f && f.name === 'status')
      const statusAdmin = statusField?.admin as { description?: string } | undefined
      expect(statusAdmin?.description).toContain('Editorial lifecycle:')

      const publishedAtField = postsCollection?.fields.find((f) => 'name' in f && f.name === 'publishedAt')
      const publishedAtAdmin = publishedAtField?.admin as { description?: string } | undefined
      expect(publishedAtAdmin?.description).toContain('Required future timestamp for Scheduled posts')

      const authorField = postsCollection?.fields.find((f) => 'name' in f && f.name === 'author')
      const authorAdmin = authorField?.admin as { description?: string } | undefined
      expect(authorAdmin?.description).toContain('Author attribution.')
    })

    it('provides accessibility guidance description on Media alt field', async () => {
      const resolvedConfig = await config
      const mediaCollection = resolvedConfig.collections?.find((c) => c.slug === 'media')
      expect(mediaCollection).toBeDefined()

      const altField = mediaCollection?.fields.find((f) => 'name' in f && f.name === 'alt')
      const altAdmin = altField?.admin as { description?: string } | undefined
      expect(altAdmin?.description).toContain('WCAG 2.2 AA accessibility standards')
    })
  })
})
