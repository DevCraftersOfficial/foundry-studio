import React from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
      <span className="category-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        Notice 404
      </span>
      <h1 className="article-title" style={{ margin: '1rem 0' }}>
        The Dispatch Cannot Be Located
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '50ch', margin: '0 auto 2rem auto' }}>
        The article or section you requested may have been archived, rescheduled, or relocated by the editorial team.
      </p>
      <Link href="/" className="empty-state-link">
        Return to Front Page
      </Link>
    </div>
  )
}
