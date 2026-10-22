/**
 * Generates a URL-safe slug from a string.
 * Converts to lowercase, strips accents/diacritics, replaces non-alphanumeric chars with hyphens,
 * collapses multiple hyphens, and trims leading/trailing hyphens.
 */
export function formatSlug(val: string): string {
  if (!val || typeof val !== 'string') return ''

  return val
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Validates whether a slug matches URL-safe kebab-case format.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
