import React from 'react'

export interface AdminIconProps {
  fill?: string
  size?: number | string
  className?: string
}

export const AdminIcon: React.FC<AdminIconProps> = ({
  fill: _fill,
  size,
  className = '',
}) => {
  const accentColor = '#EA580C'

  return (
    <svg
      className={`graphic-icon foundry-admin-icon ${className}`.trim()}
      width={size || '100%'}
      height={size || '100%'}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Foundry Studio"
    >
      <title>Foundry Studio</title>
      {/* Outer DevCrafters Hexagon */}
      <polygon
        points="12.5,2 22,7.5 22,17.5 12.5,23 3,17.5 3,7.5"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Core */}
      <circle cx="12.5" cy="12.5" r="2.8" fill={accentColor} />
      {/* Internal Spokes */}
      <path
        d="M12.5 4.5V9.5M12.5 15.5V20.5M5.6 8.5L10 11M15 14L19.4 16.5"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default AdminIcon
