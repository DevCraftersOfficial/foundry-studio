import React from 'react'
import Link from 'next/link'

export const AdminNavBrand: React.FC = () => {
  return (
    <div
      className="foundry-admin-nav-brand"
      style={{
        padding: '16px 16px 12px 16px',
        borderBottom: '1px solid var(--theme-elevation-100, rgba(0,0,0,0.08))',
        marginBottom: '8px',
      }}
    >
      <Link
        href="/admin"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: 'inherit',
        }}
        aria-label="Foundry Studio Editorial Workspace — Return to Dashboard"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <polygon
            points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2"
            stroke="#EA580C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.5" fill="#EA580C" />
          <path
            d="M12 4.5V9.5M12 14.5V19.5M5.5 8.2L9.8 10.7M14.2 13.3L18.5 15.8"
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.06em',
              color: 'var(--theme-elevation-1000, #0F172A)',
            }}
          >
            FOUNDRY STUDIO
          </span>
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontWeight: 600,
              fontSize: '8.5px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#EA580C',
            }}
          >
            BY DEVCRAFTERS
          </span>
        </div>
      </Link>
    </div>
  )
}

export default AdminNavBrand
