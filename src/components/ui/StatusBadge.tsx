import React from 'react'

export type PostStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived'

export interface StatusBadgeProps {
  /** The publication workflow state */
  status: PostStatus
  /** Size variant (defaults to 'md') */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to render an accessible indicator dot (defaults to true) */
  showDot?: boolean
  /** Custom additional CSS classes */
  className?: string
}

interface StatusMeta {
  label: string
  description: string
  className: string
}

const STATUS_CONFIG: Record<PostStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    description: 'Content is private to the author and editors',
    className: 'status-badge--draft',
  },
  in_review: {
    label: 'In Review',
    description: 'Content submitted by author for editorial review and approval',
    className: 'status-badge--in_review',
  },
  scheduled: {
    label: 'Scheduled',
    description: 'Approved and scheduled for future automated publication',
    className: 'status-badge--scheduled',
  },
  published: {
    label: 'Published',
    description: 'Publicly visible and indexed',
    className: 'status-badge--published',
  },
  archived: {
    label: 'Archived',
    description: 'Retired from public listing, preserved for editorial record',
    className: 'status-badge--archived',
  },
}

/**
 * StatusBadge:
 * Accessible, WCAG 2.2 AA compliant badge representing the formal
 * editorial workflow lifecycle of Foundry Studio posts.
 */
export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    description: `Status: ${status}`,
    className: 'status-badge--draft',
  }

  return (
    <span
      role="status"
      aria-label={`Publication status: ${config.label} (${config.description})`}
      className={`status-badge status-badge--${size} ${config.className} ${className}`.trim()}
    >
      {showDot && <span className="status-badge__dot" aria-hidden="true" />}
      <span className="status-badge__label">{config.label}</span>
    </span>
  )
}
