'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'
import type { SanitizedPermissions, VisibleEntities } from 'payload'
import { Avatar } from '@/components/ui/Avatar'

export interface StudioNavUser {
  id?: number | string
  email: string
  name?: string | null
  role: 'admin' | 'editor' | 'author' | string
}

export interface StudioNavClientProps {
  user?: StudioNavUser | null
  permissions?: SanitizedPermissions
  visibleEntities?: VisibleEntities
}

// Pure SVG Icons (strictly no emojis, WCAG compliant)
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

function IconDispatches() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconMedia() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function IconCategories() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4.993-5.5 8-8 8s-8-3.007-8-8 3.582-8 8-8 8 3.007 8 8Z" />
      <circle cx="12" cy="10" r="3" />
      <path d="m7 21 5-3 5 3" />
    </svg>
  )
}

function IconTags() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconFallbackTables() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  )
}

function IconExternal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export const StudioNavClient: React.FC<StudioNavClientProps> = ({
  user,
  permissions: _permissions,
  visibleEntities,
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const { logOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const role = user?.role || 'author'
  const isAdmin = role === 'admin'
  const isEditor = role === 'editor' || isAdmin

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      if (typeof logOut === 'function') {
        await logOut()
      }
      router.push('/admin/login')
    } catch {
      router.push('/admin/login')
    }
  }

  // Loading State
  if (user === undefined) {
    return (
      <div className="studio-nav-container" aria-busy="true" aria-label="Loading workspace navigation">
        <div className="studio-nav-brand">
          <div className="studio-nav-skeleton studio-skeleton-brand" />
        </div>
        <div className="studio-nav-skeleton-list">
          <div className="studio-nav-skeleton studio-skeleton-item" />
          <div className="studio-nav-skeleton studio-skeleton-item" />
          <div className="studio-nav-skeleton studio-skeleton-item" />
          <div className="studio-nav-skeleton studio-skeleton-item" />
        </div>
      </div>
    )
  }

  // Permission-Denied / Empty State: if user entity has no permissions or unknown role
  const collectionsAllowed = visibleEntities?.collections ?? ['posts', 'media', 'categories', 'tags', 'users']
  if (user && collectionsAllowed.length === 0) {
    return (
      <div className="studio-nav-container" role="region" aria-label="Foundry Studio Navigation Restricted">
        <div className="studio-nav-brand">
          <Link href="/admin" className="studio-nav-brand-link">
            <span className="studio-nav-brand-title">FOUNDRY STUDIO</span>
            <span className="studio-nav-brand-sub">BY DEVCRAFTERS</span>
          </Link>
        </div>
        <div className="studio-nav-restricted-box" role="alert">
          <IconWarning />
          <p className="studio-nav-restricted-heading">Workspace Restricted</p>
          <p className="studio-nav-restricted-body">
            No editorial desks are assigned to your account. Contact an administrator to provision access.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="studio-nav-logout-btn"
            disabled={isLoggingOut}
          >
            <IconLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    )
  }

  const isExactActive = (href: string) => pathname === href || pathname === `${href}/`
  const isPrefixActive = (href: string) => pathname.startsWith(href)

  return (
    <div className="studio-nav-container" role="region" aria-label="Foundry Studio Navigation">
      {/* Brand Masthead Header */}
      <div className="studio-nav-brand">
        <Link
          href="/admin"
          className="studio-nav-brand-link"
          aria-label="Foundry Studio Editorial Workspace — Return to Newsroom Desk"
        >
          <div className="studio-nav-logo-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon
                points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" fill="#EA580C" />
              <path
                d="M12 4.5V9.5M12 14.5V19.5M5.5 8.2L9.8 10.7M14.2 13.3L18.5 15.8"
                stroke="#EA580C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="studio-nav-brand-text">
            <span className="studio-nav-brand-title">FOUNDRY STUDIO</span>
            <span className="studio-nav-brand-sub">EDITORIAL WORKSPACE</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="studio-nav-sections" aria-label="Editorial Desks">
        {/* Section 1: Editorial Core */}
        <div className="studio-nav-group">
          <span className="studio-nav-group-title" id="editorial-desk-label">
            EDITORIAL DESK
          </span>
          <ul className="studio-nav-list" role="list" aria-labelledby="editorial-desk-label">
            <li>
              <Link
                href="/admin"
                className={`studio-nav-link ${isExactActive('/admin') ? 'active' : ''}`}
                aria-current={isExactActive('/admin') ? 'page' : undefined}
              >
                <span className="studio-nav-link-icon"><IconDashboard /></span>
                <span className="studio-nav-link-text">Overview Desk</span>
              </Link>
            </li>
            {collectionsAllowed.includes('posts') && (
              <li>
                <Link
                  href="/admin/collections/posts"
                  className={`studio-nav-link ${isPrefixActive('/admin/collections/posts') ? 'active' : ''}`}
                  aria-current={isPrefixActive('/admin/collections/posts') ? 'page' : undefined}
                >
                  <span className="studio-nav-link-icon"><IconDispatches /></span>
                  <span className="studio-nav-link-text">Dispatches</span>
                </Link>
              </li>
            )}
            {collectionsAllowed.includes('media') && (
              <li>
                <Link
                  href="/admin/collections/media"
                  className={`studio-nav-link ${isPrefixActive('/admin/collections/media') ? 'active' : ''}`}
                  aria-current={isPrefixActive('/admin/collections/media') ? 'page' : undefined}
                >
                  <span className="studio-nav-link-icon"><IconMedia /></span>
                  <span className="studio-nav-link-text">Media Room</span>
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Section 2: Taxonomy & Desks (Usability Filter: visible to Editor and Admin) */}
        {isEditor && (
          <div className="studio-nav-group">
            <span className="studio-nav-group-title" id="taxonomy-label">
              ORGANIZATION & BEATS
            </span>
            <ul className="studio-nav-list" role="list" aria-labelledby="taxonomy-label">
              {collectionsAllowed.includes('categories') && (
                <li>
                  <Link
                    href="/admin/collections/categories"
                    className={`studio-nav-link ${isPrefixActive('/admin/collections/categories') ? 'active' : ''}`}
                    aria-current={isPrefixActive('/admin/collections/categories') ? 'page' : undefined}
                  >
                    <span className="studio-nav-link-icon"><IconCategories /></span>
                    <span className="studio-nav-link-text">Categories</span>
                  </Link>
                </li>
              )}
              {collectionsAllowed.includes('tags') && (
                <li>
                  <Link
                    href="/admin/collections/tags"
                    className={`studio-nav-link ${isPrefixActive('/admin/collections/tags') ? 'active' : ''}`}
                    aria-current={isPrefixActive('/admin/collections/tags') ? 'page' : undefined}
                  >
                    <span className="studio-nav-link-icon"><IconTags /></span>
                    <span className="studio-nav-link-text">Topic Tags</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Section 3: Governance (Usability Filter: Admin only) */}
        {isAdmin && collectionsAllowed.includes('users') && (
          <div className="studio-nav-group">
            <span className="studio-nav-group-title" id="governance-label">
              GOVERNANCE
            </span>
            <ul className="studio-nav-list" role="list" aria-labelledby="governance-label">
              <li>
                <Link
                  href="/admin/collections/users"
                  className={`studio-nav-link ${isPrefixActive('/admin/collections/users') ? 'active' : ''}`}
                  aria-current={isPrefixActive('/admin/collections/users') ? 'page' : undefined}
                >
                  <span className="studio-nav-link-icon"><IconUsers /></span>
                  <span className="studio-nav-link-text">Staff & Authors</span>
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Section 4: System Fallback & Public Verification */}
        <div className="studio-nav-group">
          <span className="studio-nav-group-title" id="system-label">
            REVIEWS & FALLBACKS
          </span>
          <ul className="studio-nav-list" role="list" aria-labelledby="system-label">
            {isAdmin && (
              <li>
                <Link
                  href="/admin/collections/posts"
                  className="studio-nav-link studio-nav-fallback-link"
                  title="Direct access to Payload standard collection tables for administrative fallback"
                >
                  <span className="studio-nav-link-icon"><IconFallbackTables /></span>
                  <span className="studio-nav-link-text">Native Tables</span>
                  <span className="studio-nav-badge-pill">Fallback</span>
                </Link>
              </li>
            )}
            <li>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="studio-nav-link"
                title="View live public reader publication in new tab"
              >
                <span className="studio-nav-link-icon"><IconExternal /></span>
                <span className="studio-nav-link-text">Public Reader</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Session Footer */}
      <div className="studio-nav-footer">
        <div className="studio-nav-user-card">
          <Avatar user={user} size="sm" decorative={true} />
          <div className="studio-nav-user-info">
            <span className="studio-nav-user-name" title={user?.name || user?.email}>
              {user?.name || user?.email}
            </span>
            <div className="studio-nav-user-meta">
              <span className={`studio-role-tag studio-role-${role}`}>
                {role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="studio-nav-logout-btn"
          aria-label="Sign out of Foundry Studio"
        >
          <IconLogOut />
          <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  )
}
