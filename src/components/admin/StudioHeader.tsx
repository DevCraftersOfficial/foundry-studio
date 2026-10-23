import React from 'react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import type { ServerProps } from 'payload'

interface TypedUserWithRole {
  role?: string
}

export const StudioHeader: React.FC<ServerProps> = async (props) => {
  let isDraftMode = false
  try {
    const draft = await draftMode()
    isDraftMode = draft.isEnabled
  } catch {
    // Gracefully handle contexts where draftMode is unavailable
    isDraftMode = false
  }

  const user = props.user
  const typedUser = user as unknown as TypedUserWithRole | undefined
  const role = typedUser?.role || 'author'
  const isProd = process.env.NODE_ENV === 'production'

  return (
    <header className="foundry-studio-desk-header" role="banner" aria-label="Foundry Studio Desk Header">
      <div className="studio-header-inner">
        {/* Left: Desk Identifier */}
        <div className="studio-header-left">
          <div className="studio-header-desk-tag">
            <span className="studio-header-pulse" aria-hidden="true" />
            <span className="studio-header-desk-title">EDITORIAL WORKSPACE</span>
          </div>
          <span className="studio-header-divider" aria-hidden="true">|</span>
          <span className="studio-header-brand-claim">Foundry Studio by DevCrafters</span>
        </div>

        {/* Center: Draft Mode and Publication Status */}
        <div className="studio-header-center">
          {isDraftMode ? (
            <div className="studio-header-draft-banner" role="status" aria-live="polite">
              <span className="studio-draft-badge">DRAFT MODE ACTIVE</span>
              <span className="studio-draft-desc">Previewing draft dispatches</span>
              <Link
                href="/api/exit-preview"
                prefetch={false}
                className="studio-exit-preview-link"
                title="Exit Draft Mode and clear preview session"
              >
                Exit Preview &times;
              </Link>
            </div>
          ) : (
            <div className="studio-header-live-badge" title="Public reader serves published records only">
              <span className="studio-live-dot" aria-hidden="true" />
              <span>LIVE PUBLISHING</span>
            </div>
          )}
        </div>

        {/* Right: Environment, Role & Quick Navigation */}
        <div className="studio-header-right">
          <span className={`studio-env-badge studio-env-${isProd ? 'prod' : 'dev'}`}>
            {isProd ? 'PROD' : 'LOCAL DEV'}
          </span>
          {user && (
            <span className={`studio-role-pill studio-role-${role}`}>
              {role.toUpperCase()}
            </span>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="studio-header-reader-link"
            aria-label="Open live reader publication in new tab"
            title="Open public reader publication in new tab"
          >
            <span>Public Reader</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
