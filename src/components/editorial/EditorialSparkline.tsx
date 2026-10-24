import React from 'react'

export interface EditorialSparklineProps {
  /** 7-day publication velocity samples (drafts → published). Empty array renders a quiet flat baseline. */
  data: number[]
  /** Pixel width of the SVG viewport */
  width?: number
  /** Pixel height of the SVG viewport */
  height?: number
  /** Accent color for the area fill and stroke */
  color?: string
  /** Accessible label for the screen-reader announcement */
  label?: string
  className?: string
}

/**
 * EditorialSparkline — a lightweight, dependency-free SVG sparkline.
 *
 * Renders a compact publication-velocity trend line inside metric cards.
 * Pure presentational: no animation dependency, respects prefers-reduced-motion
 * by rendering a static path, and exposes a textual summary for screen readers.
 */
export function EditorialSparkline({
  data,
  width = 120,
  height = 34,
  color = '#EA580C',
  label = 'Publication velocity trend',
  className = '',
}: EditorialSparklineProps) {
  const safeData = Array.isArray(data) ? data.filter((n) => Number.isFinite(n)) : []
  const hasData = safeData.length > 0

  const max = hasData ? Math.max(...safeData, 1) : 1
  const min = hasData ? Math.min(...safeData, 0) : 0
  const range = Math.max(max - min, 1)

  const padX = 2
  const padY = 3
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const points = hasData
    ? safeData.map((value, index) => {
        const x = safeData.length === 1 ? innerW / 2 : (index / (safeData.length - 1)) * innerW
        const y = innerH - ((value - min) / range) * innerH
        return [padX + x, padY + y] as [number, number]
      })
    : []

  const linePath = points.length > 0 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') : ''
  const areaPath = hasData
    ? `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${innerH + padY} L ${points[0][0].toFixed(2)} ${innerH + padY} Z`
    : ''

  const summary = hasData
    ? `Peak ${Math.round(max)} · Latest ${Math.round(safeData[safeData.length - 1])}`
    : 'No trend data available'

  return (
    <svg
      className={`editorial-sparkline ${className}`.trim()}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}: ${summary}`}
      focusable="false"
    >
      <title>{`${label}: ${summary}`}</title>
      <g>
        {hasData && (
          <>
            <path
              d={areaPath}
              fill={color}
              fillOpacity="0.14"
            />
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={points[points.length - 1][0]}
              cy={points[points.length - 1][1]}
              r="2.4"
              fill={color}
            />
          </>
        )}
        {!hasData && (
          <line
            x1={padX}
            y1={height / 2}
            x2={width - padX}
            y2={height / 2}
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="1"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  )
}