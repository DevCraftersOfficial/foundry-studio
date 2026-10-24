import { describe, it, expect } from 'vitest'
import {
  cleanEditorialTitle,
  cleanEditorialCategory,
  cleanEditorialTag,
  deduplicateCategories,
} from '@/lib/editorial-format'

describe('FS-UI-011: Editorial Format and Data Sanitation', () => {
  describe('cleanEditorialTitle', () => {
    it('strips trailing 10-14 digit Unix timestamps', () => {
      expect(cleanEditorialTitle('The Architecture of Independent Journalism 1792767320590')).toBe(
        'The Architecture of Independent Journalism'
      )
      expect(cleanEditorialTitle('Typographic Systems for Long-Form Reading 1792767320590')).toBe(
        'Typographic Systems for Long-Form Reading'
      )
    })

    it('strips hyphenated or bracketed raw numeric IDs', () => {
      expect(cleanEditorialTitle('Special Dispatch - 1792767320590')).toBe('Special Dispatch')
      expect(cleanEditorialTitle('Breaking Story [1792767320590]')).toBe('Breaking Story')
      expect(cleanEditorialTitle('Story (#1792767320590)')).toBe('Story')
    })

    it('preserves genuine editorial titles and dates without alteration', () => {
      expect(cleanEditorialTitle('The Outlook for 2026: Technology and Society')).toBe(
        'The Outlook for 2026: Technology and Society'
      )
      expect(cleanEditorialTitle('10 Rules of Investigative Reporting')).toBe(
        '10 Rules of Investigative Reporting'
      )
      expect(cleanEditorialTitle('Apollo 11 Retrospective')).toBe('Apollo 11 Retrospective')
    })

    it('handles empty or missing titles gracefully with fallback', () => {
      expect(cleanEditorialTitle('')).toBe('Untitled Dispatch')
      expect(cleanEditorialTitle(undefined)).toBe('Untitled Dispatch')
    })
  })

  describe('cleanEditorialCategory', () => {
    it('strips timestamp suffixes and formats category name', () => {
      expect(cleanEditorialCategory('Investigative Desk 1792767320590')).toBe('Investigative Desk')
      expect(cleanEditorialCategory('Technology1792767320590')).toBe('Technology')
    })

    it('splits PascalCase synthetic categories into readable words', () => {
      expect(cleanEditorialCategory('PublicPolicy')).toBe('Public Policy')
      expect(cleanEditorialCategory('CivicTech')).toBe('Civic Tech')
    })

    it('preserves valid editorial categories', () => {
      expect(cleanEditorialCategory('Culture & Arts')).toBe('Culture & Arts')
      expect(cleanEditorialCategory('Investigations')).toBe('Investigations')
    })

    it('returns sensible fallback when category is missing', () => {
      expect(cleanEditorialCategory('')).toBe('Dispatches')
      expect(cleanEditorialCategory(undefined)).toBe('Dispatches')
    })
  })

  describe('cleanEditorialTag', () => {
    it('cleans tags and separates PascalCase', () => {
      expect(cleanEditorialTag('PublicPolicy1792767320590')).toBe('Public Policy')
      expect(cleanEditorialTag('CleanEnergy')).toBe('Clean Energy')
    })
  })

  describe('deduplicateCategories', () => {
    it('deduplicates repetitive categories that normalize to the same beat and returns clean name', () => {
      const input = [
        { id: 1, name: 'Investigative Desk 1792767320590', slug: 'investigative-1' },
        { id: 2, name: 'Investigative Desk 1792767320591', slug: 'investigative-2' },
        { id: 3, name: 'Public Policy', slug: 'public-policy' },
        { id: 4, name: 'Investigative Desk', slug: 'investigative' },
      ]

      const deduplicated = deduplicateCategories(input)
      expect(deduplicated).toHaveLength(2)
      expect(deduplicated[0].name).toBe('Investigative Desk')
      expect(deduplicated[1].name).toBe('Public Policy')
    })
  })
})
