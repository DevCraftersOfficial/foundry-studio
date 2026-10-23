import React from 'react'
import Link from 'next/link'

export interface BrandLockupProps {
  /**
   * Layout presentation variant:
   * - 'masthead': Grand editorial newspaper masthead (large title with endorsement sub-lockup)
   * - 'footer': Balanced footer brand signature with endorsement description
   * - 'compact': Single-line inline lockup for navigation bars or dense headers
   * - 'badge': Pill badge indicating the endorsed product relationship
   */
  variant?: 'masthead' | 'footer' | 'compact' | 'badge'
  /** Whether the lockup should wrap in an accessible navigation link */
  asLink?: boolean
  /** Target link URL when asLink is true (defaults to '/') */
  href?: string
  /** Custom additional CSS classes */
  className?: string
  /** Whether to show the DevCrafters hexagon brand mark (defaults to true) */
  showMark?: boolean
}

/**
 * DevCrafters Hexagonal Engineering Glyphs:
 * Clean, pure SVG representation of the DevCrafters geometric hexagon bracket/gear mark.
 * Fully scalable, zero external assets, aria-hidden for screen-reader cleanliness.
 */
export function DevCraftersMark({
  size = 18,
  className = '',
  color = 'var(--brand-accent, #EA580C)',
}: {
  size?: number
  className?: string
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Outer hexagon bracket */}
      <polygon
        points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central precision node / core */}
      <circle cx="12" cy="12" r="2.5" fill={color} />
      {/* Internal structural spokes */}
      <path
        d="M12 4.5V9.5M12 14.5V19.5M5.5 8.2L9.8 10.7M14.2 13.3L18.5 15.8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * BrandLockup:
 * The authoritative brand signature establishing the "Foundry Studio by DevCrafters"
 * endorsed product relationship across public reader routes, mastheads, footers, and workspaces.
 */
export function BrandLockup({
  variant = 'masthead',
  asLink = true,
  href = '/',
  className = '',
  showMark = true,
}: BrandLockupProps) {
  const content = (() => {
    switch (variant) {
      case 'compact':
        return (
          <div className={`brand-lockup brand-lockup--compact ${className}`.trim()}>
            {showMark && <DevCraftersMark size={16} />}
            <span className="brand-lockup__title">FOUNDRY STUDIO</span>
            <span className="brand-lockup__separator" aria-hidden="true">
              /
            </span>
            <span className="brand-lockup__endorsement">
              by <span className="brand-lockup__parent">DevCrafters</span>
            </span>
          </div>
        )

      case 'badge':
        return (
          <span className={`brand-lockup brand-lockup--badge ${className}`.trim()}>
            {showMark && <DevCraftersMark size={12} />}
            <span className="brand-lockup__badge-title">Foundry Studio</span>
            <span className="brand-lockup__badge-by">by DevCrafters</span>
          </span>
        )

      case 'footer':
        return (
          <div className={`brand-lockup brand-lockup--footer ${className}`.trim()}>
            <div className="brand-lockup__footer-header">
              {showMark && <DevCraftersMark size={20} />}
              {asLink ? (
                <Link
                  href={href}
                  className="brand-lockup__link"
                  aria-label="Foundry Studio by DevCrafters — Front Page"
                >
                  <span className="brand-lockup__title">FOUNDRY STUDIO</span>
                </Link>
              ) : (
                <span className="brand-lockup__title">FOUNDRY STUDIO</span>
              )}
            </div>
            <div className="brand-lockup__footer-endorsement">
              <span>Editorial Publishing Platform</span>
              <span className="brand-lockup__parent-credit">
                by <strong>DevCrafters</strong>
              </span>
            </div>
          </div>
        )

      case 'masthead':
      default:
        return (
          <div className={`brand-lockup brand-lockup--masthead ${className}`.trim()}>
            <div className="brand-lockup__masthead-main">
              {asLink ? (
                <Link
                  href={href}
                  className="brand-lockup__link"
                  aria-label="Foundry Studio by DevCrafters — Front Page"
                >
                  <span className="brand-lockup__title">FOUNDRY STUDIO</span>
                </Link>
              ) : (
                <span className="brand-lockup__title">FOUNDRY STUDIO</span>
              )}
            </div>
            <div className="brand-lockup__masthead-sub" aria-label="by DevCrafters">
              {showMark && <DevCraftersMark size={13} />}
              <span className="brand-lockup__by">BY</span>
              <span className="brand-lockup__parent">DEVCRAFTERS</span>
            </div>
          </div>
        )
    }
  })()

  if (variant !== 'footer' && variant !== 'masthead' && asLink) {
    return (
      <Link
        href={href}
        className="brand-lockup__link"
        aria-label="Foundry Studio by DevCrafters — Front Page"
      >
        {content}
      </Link>
    )
  }

  return content
}

