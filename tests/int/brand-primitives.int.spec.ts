import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BrandLockup, DevCraftersMark } from '@/components/ui/BrandLockup'
import { StatusBadge, type PostStatus } from '@/components/ui/StatusBadge'

describe('FS-UI-002: BrandLockup & StatusBadge Primitives', () => {
  describe('BrandLockup Component', () => {
    it('renders the masthead variant with endorsed-product hierarchy', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'masthead', href: '/' })
      )

      // Verified: contains the primary product wordmark
      expect(html).toContain('FOUNDRY STUDIO')
      // Verified: contains the parent brand endorsement
      expect(html).toContain('DEVCRAFTERS')
      expect(html).toContain('brand-lockup--masthead')
      // Verified: accessible link structure
      expect(html).toContain('href="/"')
      expect(html).toContain('aria-label="Foundry Studio by DevCrafters — Front Page"')
      // Verified: includes the SVG hexagon brand mark with aria-hidden
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('<svg')
    })

    it('renders the compact variant for dense headers or navigation', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'compact', href: '/' })
      )

      expect(html).toContain('brand-lockup--compact')
      expect(html).toContain('FOUNDRY STUDIO')
      expect(html).toContain('DevCrafters')
      expect(html).toContain('aria-hidden="true"')
    })

    it('renders the badge variant with subtle pill styling', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'badge', href: '/' })
      )

      expect(html).toContain('brand-lockup--badge')
      expect(html).toContain('Foundry Studio')
      expect(html).toContain('by DevCrafters')
    })

    it('renders the footer variant with full brand endorsement', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'footer', href: '/' })
      )

      expect(html).toContain('brand-lockup--footer')
      expect(html).toContain('FOUNDRY STUDIO')
      expect(html).toContain('Editorial Publishing Platform')
      expect(html).toContain('DevCrafters')
    })

    it('can render without wrapping in a link when asLink is false', () => {
      const html = renderToStaticMarkup(
        React.createElement(BrandLockup, { variant: 'masthead', asLink: false, showMark: false })
      )

      expect(html).toContain('FOUNDRY STUDIO')
      expect(html).not.toContain('<a')
      expect(html).not.toContain('<svg')
    })

    it('renders DevCraftersMark standalone with customizable size', () => {
      const html = renderToStaticMarkup(
        React.createElement(DevCraftersMark, { size: 24 })
      )

      expect(html).toContain('width="24"')
      expect(html).toContain('height="24"')
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('polygon')
    })
  })

  describe('StatusBadge Component', () => {
    const statuses: PostStatus[] = ['draft', 'in_review', 'scheduled', 'published', 'archived']

    it.each(statuses)('renders status "%s" with accessible role and label', (status) => {
      const html = renderToStaticMarkup(
        React.createElement(StatusBadge, { status })
      )

      // Verified: accessible status role
      expect(html).toContain('role="status"')
      // Verified: contains proper CSS class
      expect(html).toContain(`status-badge--${status}`)
      // Verified: contains accessible status description for screen readers
      expect(html).toContain('aria-label="Publication status:')
      // Verified: includes decorative dot with aria-hidden
      expect(html).toContain('status-badge__dot')
      expect(html).toContain('aria-hidden="true"')
    })

    it('renders different size variants cleanly', () => {
      const htmlSm = renderToStaticMarkup(
        React.createElement(StatusBadge, { status: 'published', size: 'sm' })
      )
      const htmlLg = renderToStaticMarkup(
        React.createElement(StatusBadge, { status: 'published', size: 'lg' })
      )

      expect(htmlSm).toContain('status-badge--sm')
      expect(htmlLg).toContain('status-badge--lg')
    })

    it('allows hiding the indicator dot', () => {
      const html = renderToStaticMarkup(
        React.createElement(StatusBadge, { status: 'draft', showDot: false })
      )

      expect(html).not.toContain('status-badge__dot')
      expect(html).toContain('Draft')
    })
  })
})
