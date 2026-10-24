import React from 'react'
import Link from 'next/link'
import {
  formatRelativeTime,
  formatScheduledCountdown,
  formatDateShort,
  getDeskGreeting,
} from '../../lib/editorial-date'
import { Avatar } from '../ui/Avatar'
import { cleanEditorialTitle, cleanEditorialCategory } from '@/lib/editorial-format'
import { EditorialSparkline } from '../editorial/EditorialSparkline'

export interface DashboardQueueItem {
  id: string | number
  title: string
  slug: string
  authorName?: string
  categoryTitle?: string
  updatedAt: string
  createdAt?: string
  publishedAt?: string
}

export interface StudioDashboardData {
  user: {
    id: string | number
    name?: string | null
    email: string
    role: 'admin' | 'editor' | 'author'
  }
  metrics: {
    drafts: number
    inReview: number
    scheduled: number
    published: number
    totalUsers?: number
    totalMedia?: number
    /** 7-day publication velocity samples (0..N) used to render sparkline trend visuals */
    velocity: number[]
  }
  reviewQueue: DashboardQueueItem[]
  drafts: DashboardQueueItem[]
  scheduled: DashboardQueueItem[]
  published: DashboardQueueItem[]
}

export interface StudioDashboardViewProps {
  state?: 'ideal' | 'loading' | 'empty' | 'error' | 'permission-denied'
  data?: StudioDashboardData
  errorMessage?: string
}

export const StudioDashboardView: React.FC<StudioDashboardViewProps> = ({
  state = 'ideal',
  data,
  errorMessage,
}) => {
  // 1. Loading State
  if (state === 'loading') {
    return (
      <main className="foundry-studio-dashboard" role="main" aria-label="Loading Editorial Newsroom">
        <div className="studio-dashboard-container">
          <div className="studio-dashboard-masthead">
            <div className="studio-skeleton studio-skeleton-title" style={{ width: '280px', height: '32px' }} />
            <div className="studio-skeleton studio-skeleton-sub" style={{ width: '420px', height: '18px', marginTop: '8px' }} />
          </div>

          <div className="studio-metrics-grid" aria-label="Loading Metrics">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="studio-metric-card studio-skeleton-card">
                <div className="studio-skeleton" style={{ width: '40%', height: '14px' }} />
                <div className="studio-skeleton" style={{ width: '60px', height: '36px', marginTop: '12px' }} />
                <div className="studio-skeleton" style={{ width: '70%', height: '12px', marginTop: '12px' }} />
              </div>
            ))}
          </div>

          <div className="studio-dashboard-columns">
            <div className="studio-col-primary">
              <div className="studio-desk-section studio-skeleton-section">
                <div className="studio-skeleton" style={{ width: '200px', height: '24px', marginBottom: '16px' }} />
                <div className="studio-skeleton" style={{ width: '100%', height: '80px', marginBottom: '12px' }} />
                <div className="studio-skeleton" style={{ width: '100%', height: '80px' }} />
              </div>
            </div>
            <div className="studio-col-secondary">
              <div className="studio-desk-section studio-skeleton-section">
                <div className="studio-skeleton" style={{ width: '160px', height: '24px', marginBottom: '16px' }} />
                <div className="studio-skeleton" style={{ width: '100%', height: '120px' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 2. Permission-Denied State
  if (state === 'permission-denied') {
    return (
      <main className="foundry-studio-dashboard" role="main" aria-label="Restricted Editorial Desk">
        <div className="studio-dashboard-container">
          <div className="studio-state-card studio-restricted-desk" role="alert">
            <div className="studio-state-icon studio-icon-lock" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="studio-state-title">Restricted Editorial Newsroom Desk</h1>
            <p className="studio-state-body">
              You must be signed in with an authorized author, editor, or administrator account to access the newsroom desk.
            </p>
            <div className="studio-state-actions">
              <Link href="/admin/login" className="studio-btn studio-btn-primary">
                Sign In to Studio Desk
              </Link>
              <Link href="/" className="studio-btn studio-btn-secondary">
                Return to Reader
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 3. Error State
  if (state === 'error') {
    return (
      <main className="foundry-studio-dashboard" role="main" aria-label="Editorial Newsroom Error">
        <div className="studio-dashboard-container">
          <div className="studio-state-card studio-error-desk" role="alert">
            <div className="studio-state-icon studio-icon-alert" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="studio-state-title">Editorial Desk Data Temporarily Unavailable</h1>
            <p className="studio-state-body">
              {errorMessage || 'The desk was unable to retrieve publication metrics and queues from the database.'}
            </p>
            <div className="studio-state-actions">
              <Link href="/admin" className="studio-btn studio-btn-primary">
                Refresh Newsroom Desk
              </Link>
              <Link href="/admin/collections/posts" className="studio-btn studio-btn-secondary">
                Open Dispatches Table
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Fallback if data is missing
  if (!data) {
    return null
  }

  const { user, metrics, reviewQueue, drafts, scheduled, published } = data
  const velocity = metrics.velocity || []
  const role = user.role || 'author'
  const isAuthor = role === 'author'
  const isEditor = role === 'editor'
  const isAdmin = role === 'admin'
  const isStaff = isEditor || isAdmin

  const totalContentCount = metrics.drafts + metrics.inReview + metrics.scheduled + metrics.published
  const isWorkspaceEmpty = totalContentCount === 0

  const { greeting, deskDate } = getDeskGreeting()
  const userName = user.name || user.email.split('@')[0]

  return (
    <main className="foundry-studio-dashboard" role="main" aria-label="Foundry Studio Editorial Newsroom Dashboard">
      <div className="studio-dashboard-container">
        {/* Newsroom Masthead Header */}
        <header className="studio-dashboard-masthead">
          <div className="studio-masthead-main">
            <div className="studio-masthead-meta">
              <span className={`studio-desk-badge studio-desk-${role}`}>
                {role === 'admin' ? 'ADMINISTRATIVE DESK' : role === 'editor' ? 'EDITORIAL DESK' : 'AUTHOR WORKSPACE'}
              </span>
              <span className="studio-masthead-date" aria-label="Today">{deskDate}</span>
            </div>
            <h1 className="studio-masthead-title">
              {greeting}, {userName}
            </h1>
            <p className="studio-masthead-sub">
              {isAuthor
                ? 'Your personal workspace for drafting dispatches, tracking reviews, and viewing publications.'
                : 'Central newsroom desk for review triage, publication velocity, and release management.'}
            </p>
          </div>

          <div className="studio-masthead-actions">
            <Link
              href="/admin/collections/posts/create"
              className="studio-btn studio-btn-primary studio-btn-new-dispatch"
              id="dashboard-new-dispatch-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ New Dispatch</span>
            </Link>
          </div>
        </header>

        {/* Workspace Onboarding Banner (When 0 posts exist) */}
        {isWorkspaceEmpty && (
          <div className="studio-empty-onboarding-banner" role="region" aria-label="Newsroom Setup Guidance">
            <div className="studio-onboarding-content">
              <span className="studio-onboarding-pill">NEWSROOM ONBOARDING</span>
              <h2 className="studio-onboarding-title">Welcome to Foundry Studio Editorial Desk</h2>
              <p className="studio-onboarding-text">
                Your publication workspace is initialized and ready. To establish your newsroom velocity:
              </p>
              <div className="studio-onboarding-steps">
                <div className="studio-onboarding-step">
                  <span className="studio-step-num">1</span>
                  <div className="studio-step-text">
                    <strong>Organize Beats:</strong> Create editorial categories to structure dispatches.
                  </div>
                  {isStaff && (
                    <Link href="/admin/collections/categories/create" className="studio-step-link">
                      + Add Category &rarr;
                    </Link>
                  )}
                </div>
                <div className="studio-onboarding-step">
                  <span className="studio-step-num">2</span>
                  <div className="studio-step-text">
                    <strong>Draft a Story:</strong> Author your initial article in the Lexical desk.
                  </div>
                  <Link href="/admin/collections/posts/create" className="studio-step-link">
                    + Draft First Dispatch &rarr;
                  </Link>
                </div>
                <div className="studio-onboarding-step">
                  <span className="studio-step-num">3</span>
                  <div className="studio-step-text">
                    <strong>Media Assets:</strong> Upload photography and illustrations.
                  </div>
                  <Link href="/admin/collections/media/create" className="studio-step-link">
                    + Upload Media &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desk Metrics Bar (4 KPI Cards - Prioritized: 1. Review, 2. Drafts, 3. Scheduled, 4. Live) */}
        <section className="studio-metrics-bar" aria-label="Desk Metrics Overview">
          <div className="studio-metrics-grid">
            {/* 1. Review Queue (Priority #1) */}
            <div className={`studio-metric-card ${metrics.inReview > 0 ? 'studio-metric-active-review' : ''}`} id="metric-card-review">
              <div className="studio-metric-header">
                <span className="studio-metric-label">
                  {isAuthor ? 'Your Submissions' : 'Needs Review'}
                </span>
                {metrics.inReview > 0 ? (
                  <span className="studio-status-pill-amber" aria-label={`${metrics.inReview} items need review`}>
                    ACTIVE
                  </span>
                ) : (
                  <span className="studio-metric-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="studio-metric-number" id="metric-review-count">
                {metrics.inReview}
              </div>
              <div className="studio-metric-footer">
                <span className="studio-metric-subtext">
                  {isAuthor ? 'Awaiting editor review' : 'Desk triage queue'}
                </span>
                <Link href="/admin/collections/posts" className="studio-metric-link" title="Open review queue in dispatches">
                  Queue &rarr;
                </Link>
              </div>
            </div>

            {/* 2. Drafts (Priority #2) */}
            <div className="studio-metric-card" id="metric-card-drafts">
              <div className="studio-metric-header">
                <span className="studio-metric-label">Drafts</span>
                <span className="studio-metric-icon studio-icon-drafts" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </span>
              </div>
              <div className="studio-metric-number" id="metric-drafts-count">
                {metrics.drafts}
              </div>
              <div className="studio-metric-footer">
                <span className="studio-metric-subtext">
                  {isAuthor ? 'Your active drafts' : 'Work in progress'}
                </span>
                <Link href="/admin/collections/posts" className="studio-metric-link" title="Open all drafts in dispatches">
                  View &rarr;
                </Link>
              </div>
            </div>

            {/* 3. Scheduled (Priority #3) */}
            <div className="studio-metric-card" id="metric-card-scheduled">
              <div className="studio-metric-header">
                <span className="studio-metric-label">Scheduled</span>
                <span className="studio-metric-icon studio-icon-scheduled" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </div>
              <div className="studio-metric-number" id="metric-scheduled-count">
                {metrics.scheduled}
              </div>
              <div className="studio-metric-footer">
                <span className="studio-metric-subtext">
                  {isAuthor ? 'Your scheduled stories' : 'Queued release dispatches'}
                </span>
                <Link href="/admin/collections/posts" className="studio-metric-link" title="Open scheduled dispatches">
                  Schedule &rarr;
                </Link>
              </div>
            </div>

            {/* 4. Published (Live - Priority #4) */}
            <div className="studio-metric-card" id="metric-card-published">
              <div className="studio-metric-header">
                <span className="studio-metric-label">Live Dispatches</span>
                <span className="studio-metric-icon studio-icon-published" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
              </div>
              <div className="studio-metric-number" id="metric-published-count">
                {metrics.published}
              </div>
              <div className="studio-metric-trend">
                <EditorialSparkline
                  data={velocity}
                  width={120}
                  height={34}
                  color="var(--brand-sparkline-color, #22C55E)"
                  label="Publication velocity trend"
                />
              </div>
              <div className="studio-metric-footer">
                <span className="studio-metric-subtext">Published records</span>
                <Link href="/" target="_blank" rel="noopener noreferrer" className="studio-metric-link" title="View live publication">
                  Reader &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-Column Editorial Work Area */}
        <div className="studio-dashboard-columns">
          {/* PRIMARY WORKSPACE COLUMN (Pipelines, Review, Drafts) */}
          <div className="studio-col-primary">
            {/* Section 1: Editorial Review Queue */}
            <section className="studio-desk-section" aria-labelledby="heading-review-queue" id="section-review-queue">
              <div className="studio-section-header">
                <div className="studio-section-title-wrap">
                  <h2 id="heading-review-queue" className="studio-section-title">
                    {isAuthor ? 'Your Submissions in Review' : 'Editorial Review Queue'}
                  </h2>
                  <span className="studio-section-badge studio-badge-amber">
                    {reviewQueue.length}
                  </span>
                </div>
                <Link href="/admin/collections/posts" className="studio-section-link">
                  All Dispatches &rarr;
                </Link>
              </div>

              {reviewQueue.length > 0 ? (
                <div className="studio-queue-list" role="list">
                  {reviewQueue.map((item) => (
                    <article key={item.id} className="studio-queue-item" role="listitem">
                      <div className="studio-queue-item-main">
                        <div className="studio-queue-item-meta">
                          {item.categoryTitle && (
                            <span className="studio-category-pill">{cleanEditorialCategory(item.categoryTitle)}</span>
                          )}
                          <span className="studio-item-status studio-status-in-review">
                            IN REVIEW
                          </span>
                          <span className="studio-meta-timestamp">
                            Updated {formatRelativeTime(item.updatedAt)}
                          </span>
                        </div>

                        <h3 className="studio-queue-item-title">
                          <Link href={`/admin/collections/posts/${item.id}`} className="studio-headline-link">
                            {cleanEditorialTitle(item.title)}
                          </Link>
                        </h3>

                        {item.authorName && (
                          <div className="studio-queue-item-author">
                            <Avatar user={{ name: item.authorName }} size="xs" decorative={true} />
                            <span className="studio-author-name">By {item.authorName}</span>
                          </div>
                        )}
                      </div>

                      <div className="studio-queue-item-actions">
                        <Link
                          href={`/admin/collections/posts/${item.id}`}
                          className="studio-btn studio-btn-outline studio-btn-sm"
                          title="Open article in editor desk"
                        >
                          Review &amp; Edit &rarr;
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="studio-empty-card" id="empty-review-queue">
                  <div className="studio-empty-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3 className="studio-empty-title">
                    {isAuthor ? 'No submissions currently in review' : 'Editorial desk is clear'}
                  </h3>
                  <p className="studio-empty-text">
                    {isAuthor
                      ? 'When you submit drafts for review, they will appear here awaiting editorial approval.'
                      : 'All author submissions have been evaluated. The review queue has no pending items.'}
                  </p>
                </div>
              )}
            </section>

            {/* Section 2: Work in Progress (Drafts) */}
            <section className="studio-desk-section" aria-labelledby="heading-drafts" id="section-drafts">
              <div className="studio-section-header">
                <div className="studio-section-title-wrap">
                  <h2 id="heading-drafts" className="studio-section-title">
                    {isAuthor ? 'Your In-Progress Drafts' : 'Recent Work in Progress (Drafts)'}
                  </h2>
                  <span className="studio-section-badge studio-badge-neutral">
                    {drafts.length}
                  </span>
                </div>
                <Link href="/admin/collections/posts" className="studio-section-link">
                  View All &rarr;
                </Link>
              </div>

              {drafts.length > 0 ? (
                <div className="studio-drafts-list" role="list">
                  {drafts.map((item) => (
                    <article key={item.id} className="studio-draft-row" role="listitem">
                      <div className="studio-draft-main">
                        <div className="studio-draft-meta">
                          <span className="studio-item-status studio-status-draft">DRAFT</span>
                          <span className="studio-meta-timestamp">
                            Saved {formatRelativeTime(item.updatedAt)}
                          </span>
                        </div>
                        <h3 className="studio-draft-title">
                          <Link href={`/admin/collections/posts/${item.id}`} className="studio-headline-link">
                            {cleanEditorialTitle(item.title)}
                          </Link>
                        </h3>
                        {item.authorName && isStaff && (
                          <span className="studio-author-subline">Author: {item.authorName}</span>
                        )}
                      </div>

                      <div className="studio-draft-action">
                        <Link
                          href={`/admin/collections/posts/${item.id}`}
                          className="studio-btn studio-btn-secondary studio-btn-sm"
                          title="Continue writing in author desk"
                        >
                          Continue &rarr;
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="studio-empty-card" id="empty-drafts">
                  <div className="studio-empty-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <h3 className="studio-empty-title">No drafts in progress</h3>
                  <p className="studio-empty-text">
                    {isAuthor
                      ? 'You have no open drafts. Begin authoring a new dispatch for review.'
                      : 'No un-submitted drafts are active in the newsroom.'}
                  </p>
                  <Link href="/admin/collections/posts/create" className="studio-btn studio-btn-primary studio-btn-sm">
                    + Start New Dispatch
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* SECONDARY SIDEBAR COLUMN (Prioritized: 3. Schedule, 4. Recent Live, 5. Quick Actions) */}
          <div className="studio-col-secondary">
            {/* Priority 3: Upcoming Scheduled Releases */}
            <section className="studio-desk-section" aria-labelledby="heading-scheduled" id="section-scheduled">
              <div className="studio-section-header">
                <div className="studio-section-title-wrap">
                  <h2 id="heading-scheduled" className="studio-section-title">Upcoming Releases</h2>
                  <span className="studio-section-badge studio-badge-blue">
                    {scheduled.length}
                  </span>
                </div>
              </div>

              {scheduled.length > 0 ? (
                <div className="studio-scheduled-list" role="list">
                  {scheduled.map((item) => (
                    <article key={item.id} className="studio-scheduled-item" role="listitem">
                      <div className="studio-scheduled-meta">
                        <span className="studio-item-status studio-status-scheduled">
                          SCHEDULED
                        </span>
                        {item.publishedAt && (
                          <span className="studio-scheduled-countdown">
                            {formatScheduledCountdown(item.publishedAt)}
                          </span>
                        )}
                      </div>
                      <h3 className="studio-scheduled-title">
                        <Link href={`/admin/collections/posts/${item.id}`} className="studio-headline-link">
                          {cleanEditorialTitle(item.title)}
                        </Link>
                      </h3>
                      {item.authorName && isStaff && (
                        <span className="studio-author-subline">By {item.authorName}</span>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="studio-empty-card studio-empty-compact" id="empty-scheduled">
                  <p className="studio-empty-text">No publications scheduled.</p>
                </div>
              )}
            </section>

            {/* Priority 4: Recently Published Dispatches */}
            <section className="studio-desk-section" aria-labelledby="heading-published" id="section-published">
              <div className="studio-section-header">
                <div className="studio-section-title-wrap">
                  <h2 id="heading-published" className="studio-section-title">Live Dispatches</h2>
                  <span className="studio-section-badge studio-badge-green">
                    {published.length}
                  </span>
                </div>
                <Link href="/" target="_blank" rel="noopener noreferrer" className="studio-section-link">
                  Open Reader &rarr;
                </Link>
              </div>

              {published.length > 0 ? (
                <div className="studio-published-list" role="list">
                  {published.map((item) => (
                    <article key={item.id} className="studio-published-item" role="listitem">
                      <div className="studio-published-meta">
                        {item.categoryTitle && (
                          <span className="studio-category-pill">{cleanEditorialCategory(item.categoryTitle)}</span>
                        )}
                        <span className="studio-meta-timestamp">
                          {item.publishedAt ? formatDateShort(item.publishedAt) : 'Live'}
                        </span>
                      </div>
                      <h3 className="studio-published-title">
                        <Link href={`/admin/collections/posts/${item.id}`} className="studio-headline-link">
                          {cleanEditorialTitle(item.title)}
                        </Link>
                      </h3>
                      <div className="studio-published-actions">
                        <Link href={`/admin/collections/posts/${item.id}`} className="studio-link-subtle">
                          Edit
                        </Link>
                        {item.slug && (
                          <a
                            href={`/posts/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="studio-link-subtle"
                          >
                            View Live &rarr;
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="studio-empty-card studio-empty-compact" id="empty-published">
                  <p className="studio-empty-text">No published stories yet.</p>
                </div>
              )}
            </section>

            {/* Priority 5: Quick Desk Actions */}
            <section className="studio-desk-section studio-quick-actions-section" aria-labelledby="heading-quick-actions">
              <div className="studio-section-header">
                <h2 id="heading-quick-actions" className="studio-section-title">Desk Actions</h2>
              </div>

              <nav className="studio-action-button-grid" aria-label="Newsroom quick actions">
                <Link href="/admin/collections/posts/create" className="studio-action-btn studio-action-highlight">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Dispatch</span>
                </Link>

                <Link href="/admin/collections/media/create" className="studio-action-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Upload Media</span>
                </Link>

                <Link href="/admin/collections/posts" className="studio-action-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>All Dispatches</span>
                </Link>

                {isStaff && (
                  <>
                    <Link href="/admin/collections/categories" className="studio-action-btn">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <span>Categories</span>
                    </Link>

                    <Link href="/admin/collections/tags" className="studio-action-btn">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span>Topic Tags</span>
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link href="/admin/collections/users" className="studio-action-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Staff Directory</span>
                  </Link>
                )}

                <Link href="/" target="_blank" rel="noopener noreferrer" className="studio-action-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Public Reader &rarr;</span>
                </Link>
              </nav>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
