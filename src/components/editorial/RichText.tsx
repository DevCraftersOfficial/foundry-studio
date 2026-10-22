import React from 'react'

export interface LexicalNode {
  type: string
  version?: number
  text?: string
  format?: number | string
  style?: string
  mode?: string
  tag?: string
  url?: string
  rel?: string
  target?: string
  listType?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

export interface RichTextProps {
  content?: {
    root?: LexicalNode
  } | null
  className?: string
}

function renderFormattedText(text: string, format?: number | string): React.ReactNode {
  if (!format || format === 0) return text

  let formatted: React.ReactNode = text
  const formatNum = typeof format === 'number' ? format : 0

  // Bitwise flags: 1 = bold, 2 = italic, 8 = underline, 16 = strikethrough, 32 = code
  if (formatNum & 1) {
    formatted = <strong>{formatted}</strong>
  }
  if (formatNum & 2) {
    formatted = <em>{formatted}</em>
  }
  if (formatNum & 8) {
    formatted = <span className="underline">{formatted}</span>
  }
  if (formatNum & 16) {
    formatted = <del>{formatted}</del>
  }
  if (formatNum & 32) {
    formatted = <code className="inline-code">{formatted}</code>
  }

  return formatted
}

function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return '#'
  const trimmed = rawUrl.trim()
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return trimmed
    }
  } catch {
    return '#'
  }
  return '#'
}

function renderNode(node: LexicalNode, index: number): React.ReactNode {
  if (!node || typeof node !== 'object') return null

  // 1. Text Leaf
  if (node.type === 'text') {
    return (
      <React.Fragment key={index}>
        {renderFormattedText(node.text || '', node.format)}
      </React.Fragment>
    )
  }

  // Render children recursively
  const children = Array.isArray(node.children)
    ? node.children.map((child, childIdx) => renderNode(child, childIdx))
    : null

  // 2. Element Nodes
  switch (node.type) {
    case 'paragraph':
      return (
        <p key={index} className="prose-paragraph">
          {children && children.length > 0 ? children : <br />}
        </p>
      )

    case 'heading': {
      const tag = node.tag || 'h2'
      // Demote rich-text h1 to h2 to preserve single-h1 heading hierarchy for the document
      if (tag === 'h1' || tag === 'h2') return <h2 key={index} className="prose-h2">{children}</h2>
      if (tag === 'h3') return <h3 key={index} className="prose-h3">{children}</h3>
      if (tag === 'h4') return <h4 key={index} className="prose-h4">{children}</h4>
      return <h2 key={index} className="prose-h2">{children}</h2>
    }

    case 'quote':
      return (
        <blockquote key={index} className="prose-quote">
          {children}
        </blockquote>
      )

    case 'list': {
      if (node.listType === 'number') {
        return (
          <ol key={index} className="prose-ol">
            {children}
          </ol>
        )
      }
      return (
        <ul key={index} className="prose-ul">
          {children}
        </ul>
      )
    }

    case 'listitem':
      return (
        <li key={index} className="prose-li">
          {children}
        </li>
      )

    case 'link': {
      const rawUrl = node.url || '#'
      const safeUrl = sanitizeUrl(rawUrl)
      const isExternal = safeUrl.startsWith('http://') || safeUrl.startsWith('https://')
      return (
        <a
          key={index}
          href={safeUrl}
          className="prose-link"
          rel={isExternal ? 'noopener noreferrer' : undefined}
          target={isExternal ? '_blank' : undefined}
        >
          {children}
        </a>
      )
    }

    default:
      if (children && children.length > 0) {
        return <React.Fragment key={index}>{children}</React.Fragment>
      }
      return null
  }
}

export function RichText({ content, className = '' }: RichTextProps) {
  if (!content || !content.root || !content.root.children) {
    return null
  }

  return (
    <div className={`prose-content ${className}`}>
      {content.root.children.map((child, index) => renderNode(child, index))}
    </div>
  )
}
