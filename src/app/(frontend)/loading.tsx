import React from 'react'

export default function Loading() {
  return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            height: '24px',
            width: '120px',
            backgroundColor: 'var(--bg-muted)',
            margin: '0 auto 1.5rem auto',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            height: '48px',
            width: '80%',
            backgroundColor: 'var(--bg-muted)',
            margin: '0 auto 1.5rem auto',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            height: '20px',
            width: '50%',
            backgroundColor: 'var(--bg-muted)',
            margin: '0 auto 3rem auto',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            height: '360px',
            width: '100%',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  )
}
