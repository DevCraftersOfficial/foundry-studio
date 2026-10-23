/**
 * Foundry Studio — Editorial Date & Time Helpers
 *
 * Provides deterministic date formatting and relative countdown helpers
 * for newsroom dashboards, review queues, and release schedules.
 */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const DAYS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function parseDate(dateInput: string | Date | number): Date | null {
  if (!dateInput) return null
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns human-readable relative time (e.g. 'just now', '15m ago', '3h ago', '2d ago', 'Oct 23, 2026')
 */
export function formatRelativeTime(
  dateInput: string | Date | number,
  nowMs: number = Date.now(),
): string {
  const date = parseDate(dateInput)
  if (!date) return '—'

  const diffMs = nowMs - date.getTime()
  if (diffMs < 0) {
    return 'in the future'
  }

  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'just now'

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`

  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`

  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d ago`

  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

/**
 * Returns countdown for scheduled future releases (e.g. 'in 45m', 'in 3h', 'in 2d', 'Oct 25, 2026')
 */
export function formatScheduledCountdown(
  dateInput: string | Date | number,
  nowMs: number = Date.now(),
): string {
  const date = parseDate(dateInput)
  if (!date) return '—'

  const diffMs = date.getTime() - nowMs
  if (diffMs <= 0) {
    return 'Release pending'
  }

  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  if (min < 60) return `in ${Math.max(1, min)}m`

  const hr = Math.floor(min / 60)
  if (hr < 24) return `in ${hr}h`

  const days = Math.floor(hr / 24)
  if (days < 7) return `in ${days}d`

  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

/**
 * Returns concise formatted date (e.g. 'Oct 23, 2026')
 */
export function formatDateShort(dateInput: string | Date | number): string {
  const date = parseDate(dateInput)
  if (!date) return '—'
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

/**
 * Returns newsroom greeting and desk day formatted string
 */
export function getDeskGreeting(date: Date = new Date()): {
  greeting: string
  deskDate: string
} {
  const hours = date.getHours()
  let greeting = 'Good evening'
  if (hours < 12) {
    greeting = 'Good morning'
  } else if (hours < 17) {
    greeting = 'Good afternoon'
  }

  const dayName = DAYS_FULL[date.getDay()]
  const monthName = MONTHS_FULL[date.getMonth()]
  const dayNum = date.getDate()
  const year = date.getFullYear()

  return {
    greeting,
    deskDate: `${dayName}, ${monthName} ${dayNum}, ${year}`,
  }
}
