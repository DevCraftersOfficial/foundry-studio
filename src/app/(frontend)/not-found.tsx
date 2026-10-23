import React from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="container">
        <div className="not-found-card">
          <span className="not-found-badge">Dispatch Notice • 404</span>
          <h1 className="not-found-title">The Dispatch Cannot Be Located</h1>
          <p className="not-found-text">
            The article, topic, or section you requested may have been archived, rescheduled, or relocated by the editorial team.
          </p>

          <form action="/search" method="GET" className="not-found-search-form" role="search">
            <input
              type="search"
              name="q"
              placeholder="Search publication archives..."
              className="not-found-search-input"
              aria-label="Search dispatches"
              required
            />
            <button type="submit" className="not-found-search-btn">
              Search
            </button>
          </form>

          <div className="not-found-actions">
            <Link href="/" className="empty-state-link">
              &larr; Return to Front Page
            </Link>
            <Link href="/search" className="not-found-secondary-link">
              Browse Search Archives
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
