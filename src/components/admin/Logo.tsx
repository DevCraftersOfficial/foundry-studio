'use client'

import React, { useEffect } from 'react'

export interface AdminLogoProps {
  className?: string
}

export const AdminLogo: React.FC<AdminLogoProps> = ({ className = '' }) => {
  useEffect(() => {
    try {
      const cookies = document.cookie.split('; ')
      const themeCookie = cookies.find((r) => r.startsWith('payload-theme='))
      const val = themeCookie ? themeCookie.split('=')[1] : null
      if (val === 'dark' || (!val && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else if (val === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
      }
    } catch {}
  }, [])

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 280 48"
        width="280"
        height="48"
        className={`graphic-logo foundry-admin-logo ${className}`.trim()}
        role="img"
        aria-label="Foundry Studio by DevCrafters"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
      >
      <title>Foundry Studio by DevCrafters</title>
      
      {/* DevCrafters Hexagonal Geometric Mark */}
      <g transform="translate(6, 6)">
        {/* Outer Hexagon */}
        <polygon
          points="18,3 31.5,10.8 31.5,25.2 18,33 4.5,25.2 4.5,10.8"
          stroke="#EA580C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Central Core */}
        <circle cx="18" cy="18" r="3.2" fill="#EA580C" />
        {/* Spokes */}
        <path
          d="M18 6.5V14.8M18 21.2V29.5M8.5 12.5L14.8 16.1M21.2 19.9L27.5 23.5"
          stroke="#EA580C"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>

      {/* Primary Brand Typography */}
      <text
        x="54"
        y="25"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="17"
        fontWeight="800"
        letterSpacing="1.2"
        fill="var(--admin-logo-text, var(--theme-elevation-1000, currentColor))"
      >
        FOUNDRY STUDIO
      </text>

      {/* Parent Brand Endorsement Subtitle */}
      <text
        x="55"
        y="38"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2.2"
        fill="#EA580C"
      >
        BY DEVCRAFTERS
      </text>
    </svg>
    </>
  )
}

export default AdminLogo
