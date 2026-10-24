'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  useDocumentInfo,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useLivePreviewContext,
} from '@payloadcms/ui'
import { calculateReadingTime } from '@/lib/reading-time'

export function StudioAuthoringHUD() {
  const { hasSavePermission, id } = useDocumentInfo()
  const isProcessing = useFormProcessing()
  const isModified = useFormModified()
  const { isLivePreviewing, setIsLivePreviewing, isLivePreviewEnabled } = useLivePreviewContext()

  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Reactive access to form fields
  const content = useFormFields(([fields]) => fields?.content?.value)
  const slug = useFormFields(([fields]) => fields?.slug?.value as string | undefined)
  const status = useFormFields(([fields]) => fields?.status?.value as string | undefined)

  // Derive metrics reliably from current editor state
  const metrics = useMemo(() => {
    return calculateReadingTime(content)
  }, [content])

  // Securely request Draft Mode session authorization on the server without leaking secrets
  const authorizePreview = useCallback(async (): Promise<string | null> => {
    if (!slug) {
      setPreviewError('A URL slug is required to preview this dispatch.')
      return null
    }

    setPreviewLoading(true)
    setPreviewError(null)

    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPreviewError(data?.error || 'Preview authorization denied.')
        return null
      }

      return data?.url || `/posts/${slug}`
    } catch {
      setPreviewError('Network error initializing secure preview.')
      return null
    } finally {
      setPreviewLoading(false)
    }
  }, [slug])

  // Handle Split-Pane Preview toggle
  const handleToggleSplitPreview = useCallback(async () => {
    if (!slug) {
      setPreviewError('Save dispatch draft with a slug first to enable split preview.')
      return
    }

    // If turning on split preview, ensure draft mode cookie is set
    if (!isLivePreviewing) {
      const authorizedUrl = await authorizePreview()
      if (!authorizedUrl) return
    }

    setIsLivePreviewing(!isLivePreviewing)
  }, [slug, isLivePreviewing, setIsLivePreviewing, authorizePreview])

  // Handle Open in Reader (New Tab)
  const handleOpenReader = useCallback(async () => {
    if (!slug) {
      setPreviewError('Save dispatch draft with a slug first to open reader preview.')
      return
    }

    const authorizedUrl = await authorizePreview()
    if (authorizedUrl) {
      window.open(authorizedUrl, '_blank', 'noopener,noreferrer')
    }
  }, [slug, authorizePreview])

  // Determine persistence status badge truthfully:
  // "Saved to Desk" appears ONLY after confirmed persistence (id exists, not modified, not processing)
  let statusBadge = (
    <div className="studio-hud-status studio-hud-status-saved" title="All changes saved to database">
      <span className="studio-hud-status-dot" aria-hidden="true" />
      <span>Saved to Desk</span>
    </div>
  )

  if (!hasSavePermission) {
    statusBadge = (
      <div className="studio-hud-status studio-hud-status-readonly" title="You do not have permission to modify this document">
        <svg className="studio-hud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Read-Only</span>
      </div>
    )
  } else if (isProcessing) {
    statusBadge = (
      <div className="studio-hud-status studio-hud-status-saving" role="status" aria-live="polite">
        <svg className="studio-hud-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
        <span>Saving...</span>
      </div>
    )
  } else if (!id) {
    statusBadge = (
      <div className="studio-hud-status studio-hud-status-modified" title="New document not yet created">
        <span className="studio-hud-status-dot-amber" aria-hidden="true" />
        <span>Unsaved Draft</span>
      </div>
    )
  } else if (isModified) {
    statusBadge = (
      <div className="studio-hud-status studio-hud-status-modified" title="Document contains unsaved modifications">
        <span className="studio-hud-status-dot-amber" aria-hidden="true" />
        <span>Unsaved Changes</span>
      </div>
    )
  }

  const canPreview = Boolean(slug)

  return (
    <div className="studio-authoring-hud" role="region" aria-label="Editorial Desk Heads-Up Display">
      {/* 1. Persistence & Publication Lifecycle State */}
      <div className="studio-hud-group studio-hud-lifecycle">
        {statusBadge}
        {status && (
          <span className={`studio-hud-workflow-pill studio-hud-workflow-${status}`}>
            {status === 'in_review' ? 'In Review' : status.toUpperCase()}
          </span>
        )}
      </div>

      <div className="studio-hud-divider" aria-hidden="true" />

      {/* 2. Word Count & Reading Time HUD */}
      <div className="studio-hud-group studio-hud-metrics" role="status" aria-atomic="true">
        <span className="studio-hud-metric" title="Total words in article content">
          <svg className="studio-hud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="studio-hud-metric-value">{metrics.words.toLocaleString()}</span>
          <span className="studio-hud-metric-label">words</span>
        </span>

        <span className="studio-hud-metric-sep" aria-hidden="true">•</span>

        <span className="studio-hud-metric" title="Estimated reading time at standard 200 words per minute">
          <svg className="studio-hud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="studio-hud-metric-value">{metrics.text}</span>
        </span>
      </div>

      <div className="studio-hud-divider" aria-hidden="true" />

      {/* 3. Dual-Mode Preview Controls */}
      <div className="studio-hud-group studio-hud-preview-controls">
        {/* Split Preview Button */}
        {isLivePreviewEnabled !== false && (
          <button
            type="button"
            className={`studio-hud-btn studio-hud-btn-split ${isLivePreviewing ? 'studio-hud-btn-active' : ''}`}
            onClick={handleToggleSplitPreview}
            disabled={!canPreview || previewLoading}
            title={canPreview ? (isLivePreviewing ? 'Close split-pane preview' : 'Open live split-pane preview') : 'Save draft first to enable preview'}
            aria-pressed={isLivePreviewing}
            id="studio-toggle-split-preview"
          >
            <svg className="studio-hud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span>{isLivePreviewing ? 'Close Preview' : 'Split Preview'}</span>
          </button>
        )}

        {/* Reader in Separate Tab Button */}
        <button
          type="button"
          className="studio-hud-btn studio-hud-btn-reader"
          onClick={handleOpenReader}
          disabled={!canPreview || previewLoading}
          title={canPreview ? 'Open in Reader (separate tab with Draft Mode)' : 'Save draft first to open reader preview'}
          id="studio-open-reader-preview"
        >
          {previewLoading ? (
            <svg className="studio-hud-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <svg className="studio-hud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          )}
          <span>Reader ↗</span>
        </button>
      </div>

      {/* Diagnostic Preview Error Banner */}
      {previewError && (
        <div className="studio-hud-error" role="alert">
          <span>{previewError}</span>
          <button
            type="button"
            className="studio-hud-error-close"
            onClick={() => setPreviewError(null)}
            aria-label="Dismiss error notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
