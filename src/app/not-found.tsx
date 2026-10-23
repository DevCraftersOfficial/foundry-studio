import React from 'react'
import Link from 'next/link'
import { Newsreader, Manrope, JetBrains_Mono } from 'next/font/google'
import { BrandLockup } from '@/components/ui/BrandLockup'
import './(frontend)/styles.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
})

export default function GlobalNotFound() {
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="masthead" role="banner">
          <div className="container">
            <div className="masthead-topbar">
              <span className="masthead-edition">Foundry Dispatch • Vol. 1</span>
              <time dateTime={new Date().toISOString()} className="masthead-date">{today}</time>
              <div className="masthead-topbar-actions">
                <Link href="/search" className="masthead-search-link" aria-label="Search articles">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search</span>
                </Link>
                <Link href="/admin" className="masthead-admin-link">
                  Admin Studio &rarr;
                </Link>
              </div>
            </div>
            <div className="masthead-brand">
              <BrandLockup variant="masthead" href="/" />
              <p className="masthead-tagline">Craftsmanship, Typography, and Editorial Precision</p>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1}>
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
        </main>

        <footer className="site-footer" role="contentinfo">
          <div className="container footer-inner">
            <BrandLockup variant="footer" href="/" />
            <div className="footer-links">
              <Link href="/">Front Page</Link>
              <Link href="/search">Search Archives</Link>
              <Link href="/admin">Editorial Workspace</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
