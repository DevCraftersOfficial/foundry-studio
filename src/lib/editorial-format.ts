/**
 * src/lib/editorial-format.ts
 *
 * Presentation formatting utilities for Foundry Studio public reader and editorial workspaces.
 * Safely sanitizes synthetic test/seed tokens (such as trailing 10-14 digit timestamps or raw numeric IDs)
 * from titles, category labels, and tags when presenting to readers, while strictly preserving
 * genuine editorial text (e.g. "Report 2024", "100 Years of Solitude", "Section 1").
 */

export function cleanEditorialTitle(title?: string | null): string {
  if (!title || !title.trim()) return 'Untitled Dispatch'
  // Remove bracketed or parenthesized numeric IDs: e.g. "Story [1792767320590]", "Story (#1792767320590)"
  let cleaned = title.replace(/\s*[\[(]#?\d{10,14}[\])]\s*$/, '')
  // Remove trailing 10-14 digit Unix timestamps with optional dashes: e.g. "The Architecture of Independent Journalism 1792767320590", "Dispatch - 1792767320590"
  cleaned = cleaned.replace(/(?:\s*[-–—]\s*|\s+)\d{10,14}$/, '')
  // Remove leading raw ID brackets if present: e.g. "[1356] Story Title", "#123: Story"
  cleaned = cleaned.replace(/^\[#?\d+\]\s*/, '').replace(/^#\d+:\s*/, '')
  return cleaned.trim() || 'Untitled Dispatch'
}

export function cleanEditorialCategory(name?: string | null): string {
  if (!name || !name.trim()) return 'Dispatches'
  // Remove bracketed or parenthesized numeric IDs
  let cleaned = name.replace(/\s*[\[(]#?\d{10,14}[\])]\s*$/, '')
  // Remove trailing 10-14 digit Unix timestamps or hyphenated numeric suffixes
  cleaned = cleaned.replace(/(?:\s*[-–—]\s*|\s+)\d{10,14}$/, '').replace(/\d{10,14}$/, '')
  // Separate concatenated PascalCase if applicable (e.g. "PublicPolicy" -> "Public Policy")
  if (/^[A-Z][a-z]+[A-Z][a-z]+$/.test(cleaned.trim())) {
    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  return cleaned.trim() || 'Dispatches'
}

export function cleanEditorialTag(name?: string | null): string {
  if (!name || !name.trim()) return 'Topic'
  let cleaned = name.replace(/\s*[\[(]#?\d{10,14}[\])]\s*$/, '')
  cleaned = cleaned.replace(/(?:\s*[-–—]\s*|\s+)\d{10,14}$/, '').replace(/\d{10,14}$/, '')
  if (/^[A-Z][a-z]+[A-Z][a-z]+$/.test(cleaned.trim())) {
    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  return cleaned.trim() || 'Topic'
}

/**
 * Deduplicates categories by normalized clean name so repetitive synthetic
 * category records do not flood the reader navigation and beat grids.
 */
export function deduplicateCategories<T extends { id: number | string; name: string; slug: string }>(
  categories: T[],
): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const cat of categories) {
    const cleanName = cleanEditorialCategory(cat.name).toLowerCase()
    if (!seen.has(cleanName)) {
      seen.add(cleanName)
      result.push({
        ...cat,
        name: cleanEditorialCategory(cat.name),
      })
    }
  }

  return result
}
