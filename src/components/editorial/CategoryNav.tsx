import React from 'react'
import Link from 'next/link'
import type { Category } from '@/payload-types'

export interface CategoryNavProps {
  /** List of public categories to display */
  categories: Category[]
  /** Currently active section slug (e.g. 'technology', 'journalism', or undefined for Front Page) */
  activeSlug?: string
  /** Additional custom container classes */
  className?: string
}

/**
 * CategoryNav:
 * Accessible, responsive editorial section navigation bar.
 * Provides explicit visual and semantic (aria-current="page") identification of active sections.
 */
export function CategoryNav({
  categories,
  activeSlug,
  className = '',
}: CategoryNavProps) {
  if (!categories || categories.length === 0) {
    return null
  }

  const isFrontPageActive = !activeSlug || activeSlug === 'frontpage'

  return (
    <nav
      className={`category-nav-wrapper ${className}`.trim()}
      aria-label="Editorial Sections"
    >
      <div className="container">
        <ul className="category-nav-list" role="list">
          <li className="category-nav-item">
            <Link
              href="/"
              className={`category-nav-link ${
                isFrontPageActive ? 'category-nav-link--active' : ''
              }`.trim()}
              aria-current={isFrontPageActive ? 'page' : undefined}
            >
              <span className="category-nav-label">Front Page</span>
            </Link>
          </li>

          {categories.map((cat) => {
            const isActive = activeSlug === cat.slug

            return (
              <li key={cat.id} className="category-nav-item">
                <Link
                  href={`/category/${cat.slug}`}
                  className={`category-nav-link ${
                    isActive ? 'category-nav-link--active' : ''
                  }`.trim()}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="category-nav-label">{cat.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
