import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site-url'
import './styles.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Foundry Studio',
    default: 'Foundry Studio — Independent Journalism & Publishing',
  },
  description: 'An authoritative content publishing platform engineered for thoughtful editorial journalism and modular publishing.',
  metadataBase: new URL(getSiteUrl()),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="masthead" role="banner">
          <div className="container">
            <div className="masthead-topbar">
              <span>Foundry Dispatch • Vol. 1</span>
              <time dateTime={new Date().toISOString()}>{today}</time>
              <Link href="/admin" className="masthead-admin-link">
                Admin Studio &rarr;
              </Link>
            </div>
            <div className="masthead-brand">
              <Link href="/" aria-label="Foundry Studio Front Page">
                <div className="masthead-title">FOUNDRY STUDIO</div>
              </Link>
              <p className="masthead-tagline">Craftsmanship, Typography, and Editorial Precision</p>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="site-footer" role="contentinfo">
          <div className="container footer-inner">
            <div>
              <div className="footer-brand-title">FOUNDRY STUDIO</div>
              <p className="footer-desc">An Open-Source Publishing Platform by DevCrafters</p>
            </div>
            <div className="footer-links">
              <Link href="/">Front Page</Link>
              <Link href="/admin">Editorial Workspace</Link>
              <a
                href="https://github.com/DevCraftersOfficial/foundry-studio"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
