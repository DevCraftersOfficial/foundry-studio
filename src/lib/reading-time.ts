/**
 * Reading Time Calculation Utility
 *
 * Implements a deterministic, WCAG-compliant reading-time estimation
 * based on the standard publishing metric of 200 words per minute (WPM).
 */

export interface ReadingTimeResult {
  /** Estimated reading time in full minutes (minimum 1 when words > 0, 0 when empty) */
  minutes: number
  /** Exact total word count extracted from the content */
  words: number
  /** Formatted human-readable label (e.g. "4 min read") */
  text: string
}

const DEFAULT_WORDS_PER_MINUTE = 200

/**
 * Recursively extracts plain text from a Lexical AST node tree or unknown JSON structure.
 * Guaranteed never to throw on null, undefined, circular, or malformed inputs.
 */
export function extractTextFromLexical(node: unknown): string {
  if (!node) return ''

  if (typeof node === 'string') {
    return node
  }

  if (typeof node !== 'object') {
    return ''
  }

  const obj = node as Record<string, unknown>
  let text = ''

  // If node has text property (Lexical text leaf node)
  if (typeof obj.text === 'string') {
    text += obj.text + ' '
  }

  // If node has root property (top-level Lexical editor state: { root: { children: [...] } })
  if (obj.root && typeof obj.root === 'object') {
    text += extractTextFromLexical(obj.root) + ' '
  }

  // If node has children array
  if (Array.isArray(obj.children)) {
    for (const child of obj.children) {
      text += extractTextFromLexical(child) + ' '
    }
  }

  return text
}

/**
 * Calculates reading time from Lexical content, plain string, or article excerpts.
 *
 * @param content - Lexical AST, content object, or plain string
 * @param wordsPerMinute - Reading speed (defaults to 200 WPM)
 * @returns ReadingTimeResult with minutes, words, and formatted text
 */
export function calculateReadingTime(
  content: unknown,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE
): ReadingTimeResult {
  if (!content) {
    return {
      minutes: 0,
      words: 0,
      text: '0 min read',
    }
  }

  const rawText = typeof content === 'string' ? content : extractTextFromLexical(content)
  const trimmed = rawText.trim()

  if (!trimmed) {
    return {
      minutes: 0,
      words: 0,
      text: '0 min read',
    }
  }

  // Split on unicode whitespace and count non-empty tokens
  const words = trimmed.split(/\s+/).filter(Boolean).length

  if (words === 0) {
    return {
      minutes: 0,
      words: 0,
      text: '0 min read',
    }
  }

  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute))

  return {
    minutes,
    words,
    text: `${minutes} min read`,
  }
}
