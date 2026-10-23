# Foundry Studio — Project State Record

- **Current Milestone:** `FS-UI-009 — Foundry Studio Public Reader Redesign & Default Doodle Profile Avatars`
- **Milestone Status:** Completed & Ready for CTO Review
- **Last Updated:** 2026-10-23
- **Authorized Next Task:** CTO Review & Phase Authorization for FS-UI-010 (Comprehensive WCAG 2.2 AA & Responsive Certification)

---

## 1. Executive Summary: FS-UI-009 Foundry Studio Public Reader Redesign

Milestone `FS-UI-009` completed the premium public publishing experience so the reader feels like a distinctive Foundry Studio publication rather than a generic blog template, while introducing original default doodle profile avatars, strict server-side search, taxonomy and author archives, literary 404 recovery, and removing obsolete open-source marketing copy.

### Key Actions Completed:

1. **Original Default Doodle Profile Avatars (`public/avatars/` & `src/lib/avatar.ts`):**
   - Generated two distinct original illustrated doodle-style avatars aligning with Foundry Studio visual identity (warm ivory canvas `#FAF8F5`, obsidian ink `#0F172A`, restrained flame-orange accents `#EA580C`):
     - `public/avatars/avatar-male.jpg`
     - `public/avatars/avatar-female.jpg`
   - Stored locally with zero runtime external requests, zero third-party CDNs, and zero recurring budget impact.
   - Built deterministic fallback engine in `src/lib/avatar.ts`:
     - Custom user-uploaded images take precedence.
     - Deterministically selects male/female doodle based on user ID parity (`id % 2 === 0 ? male : female`) without guessing from user names or requiring schema migrations.
     - Handles null/undefined user safely with male fallback.
   - Built accessible `Avatar` component (`src/components/ui/Avatar.tsx`):
     - Supports sizes `xs` (20px), `sm` (28px), `md` (40px), `lg` (64px), and `xl` (80px).
     - Accessible behavior: decorative avatars rendered alongside text bylines receive `decorative={true}` (`aria-hidden="true"`), preventing redundant screen-reader announcements; standalone avatars receive meaningful alt text.
     - Deployed across Admin Studio Navigation, Newsroom Dashboard review queues, Article author attribution, Author archive profiles, and Dispatch cards.

2. **Asymmetric Editorial Broadsheet Homepage (`src/app/(frontend)/page.tsx`):**
   - Designed a high-impact editorial broadsheet layout:
     - **Lead Feature Story:** Dominant presentation with large Newsreader headline (`clamp(2rem, 3.5vw, 3rem)`), standfirst summary, publication metadata, reading time pill, and primary photography framed with 1px obsidian ink borders.
     - **Secondary Feature Story:** Complementary story positioned alongside the lead feature in an asymmetrical layout (`1.4fr : 1fr`).
     - **Latest Dispatches Grid:** Multi-column responsive grid featuring author attribution with doodle profile avatars, reading time pills, category badges, and hover micro-interactions.
     - **Editorial Beats Index:** Taxonomy directory showcasing active publication categories with post counts and direct navigation.
   - Strict publication eligibility invariant: drafts, scheduled, and archived posts are completely filtered using `getPublicPostWhere(now)`.

3. **Refined Long-Form Reading Experience (`src/app/(frontend)/posts/[slug]/page.tsx`):**
   - Enforced 68ch maximum reading measure (`max-w-prose`) with 1.8 line-height for optimal ocular comfort.
   - Added contextual breadcrumb navigation (`Home / [Category] / [Article]`).
   - Built prominent Author Attribution Card directly beneath the headline: author doodle avatar, linked author archive profile, editorial role pill, publication date, and Lexical AST reading time pill.
   - Added typographic topic tags linking to `/tag/[slug]`.
   - Rendered related dispatches recommendations strictly filtered by `getPublicPostWhere(now)` and excluding the current post.

4. **Taxonomy & Author Archives (`src/app/(frontend)/author/[id]/` & `/tag/[slug]/`):**
   - Implemented Author Archive view (`/author/[id]`):
     - Displays author profile header with large doodle avatar (`size="xl"`), author name, role pill, total published stories count.
     - Grid of published stories strictly authored by the user, with draft leakage completely blocked.
   - Implemented Topic Tag Archive view (`/tag/[slug]`):
     - Displays tag header and responsive grid of published stories matching the tag.
   - Enhanced Category Archive view (`/category/[slug]`).

5. **Server-Side Public Search (`src/app/(frontend)/search/page.tsx`):**
   - Implemented server-side `like` search on `title` and `excerpt` via Payload Local API.
   - Strictly enforced publication eligibility invariant (`getPublicPostWhere(now)`).
   - Provided explicit UI states: Search input bar with search icon, Results count header, Empty query guidance, Zero-results state with suggestions, and Error recovery.
   - SEO privacy: Disallowed in `src/app/robots.ts` and tagged with `robots: { index: false, follow: true }` to protect search engine crawl budget.

6. **Literary 404 Recovery View (`src/app/not-found.tsx` & `src/app/(frontend)/not-found.tsx`):**
   - Implemented bespoke 404 recovery page featuring editorial headline, explanatory copy, live search input form, and quick links back to the front page and editorial beats.

7. **Obsolete Copy Removal:**
   - Updated `src/components/ui/BrandLockup.tsx` footer lockup from "An Open-Source Editorial Publishing Platform" to "Editorial Publishing Platform", removing outdated product copy while preserving accurate third-party open-source licensing in `LICENSE`.

8. **Automated Integration Test Suite (`tests/int/public-reader-redesign.int.spec.ts`):**
   - 12 comprehensive tests covering:
     - Avatar assets exist locally (`public/avatars/avatar-male.jpg`, `public/avatars/avatar-female.jpg`).
     - Avatar resolution engine parity rules (even = male, odd = female, custom image precedence, null safety).
     - Avatar component rendering (`aria-hidden="true"` when decorative, custom alt text when standalone, dimensions).
     - Obsolete copy removal ("Editorial Publishing Platform" without "Open-Source").
     - Publication eligibility invariant across search, author archives, tag archives, related stories.
     - Search empty and zero-results query states.
     - Author archive page structure and author attribution card components.

9. **Empirical Browser Verification:**
   - Subagent executed automated browser audit across desktop (1280×800) and mobile (375×812) viewports.
   - Captured artifacts:
     - Desktop Homepage: `desktop_homepage_redesign_1792759441100.png`
     - Desktop Article Detail: `desktop_article_detail_1792759452564.png`
     - Desktop Author Archive: `desktop_author_archive_1792759462457.png`
     - Desktop Search Results: `desktop_search_results_1792759472541.png`
     - Desktop 404 Recovery: `desktop_404_recovery_1792759482236.png`
     - Mobile Homepage (375×812): `mobile_homepage_redesign_1792759495200.png`
     - Full Audit Recording: `reader_avatars_audit_1792759409046.webp`

---

## 2. Updated Documentation & Code Inventory

| File | Status | Description |
| :--- | :--- | :--- |
| `public/avatars/avatar-male.jpg` | Created | Original AI-generated illustrated doodle male avatar in Foundry Studio palette. |
| `public/avatars/avatar-female.jpg` | Created | Original AI-generated illustrated doodle female avatar in Foundry Studio palette. |
| `src/lib/avatar.ts` | Created | Deterministic avatar resolution engine (custom image priority, user ID parity fallback, null safety). |
| `src/components/ui/Avatar.tsx` | Created | Accessible reusable Avatar component supporting sizes `xs`–`xl` and `decorative={true}` (`aria-hidden`). |
| `src/components/ui/BrandLockup.tsx` | Modified | Updated footer endorsement to "Editorial Publishing Platform" (removed obsolete "Open-Source" copy). |
| `src/components/admin/StudioNavClient.tsx` | Modified | Integrated `Avatar` component into Admin Studio navigation user profile card. |
| `src/components/admin/StudioDashboardView.tsx` | Modified | Integrated `Avatar` component into Newsroom Dashboard submission review queues. |
| `src/app/(frontend)/page.tsx` | Modified | Redesigned Homepage with asymmetric broadsheet hero, dispatches grid with avatars, and beats directory. |
| `src/app/(frontend)/posts/[slug]/page.tsx` | Modified | Refined Article view with breadcrumbs, author attribution card (avatar, role, date, reading time), tags, related stories. |
| `src/app/(frontend)/author/[id]/page.tsx` | Created | Author Archive route with author profile header (avatar, role badge, story count) and published story grid. |
| `src/app/(frontend)/tag/[slug]/page.tsx` | Created | Topic Tag Archive route with tag header and published stories grid. |
| `src/app/(frontend)/search/page.tsx` | Created | Server-side Search page with `like` query on title and excerpt, publication filtering, empty/error states. |
| `src/app/not-found.tsx` | Created | Root editorial 404 recovery page with search query field and navigation links. |
| `src/app/(frontend)/not-found.tsx` | Modified | Frontend route group 404 recovery page. |
| `src/app/(frontend)/layout.tsx` | Modified | Added Search link to topbar navigation and refined footer layout. |
| `src/app/(frontend)/styles.css` | Modified | Added scoped CSS for avatars, asymmetric hero, beats directory, search view, author archives, and mobile rules. |
| `src/app/(payload)/custom.scss` | Modified | Added avatar primitive styling for admin surfaces. |
| `src/app/robots.ts` | Modified | Added `/search` to disallow list to protect crawl budget. |
| `src/app/sitemap.ts` | Modified | Added topic tags and eligible authors to dynamic XML sitemap. |
| `tests/int/public-reader-redesign.int.spec.ts` | Created | 12 automated integration tests for avatars, search, archives, obsolete copy, and publication invariants. |
| `tests/int/brand-primitives.int.spec.ts` | Modified | Updated footer endorsement assertion to match "Editorial Publishing Platform". |
| `docs/DESIGN_SYSTEM.md` | Modified | Added Section 3.3.10 (Public Reader Redesign) and Section 3.3.11 (Default Doodle Profile Avatars). |
| `docs/ROADMAP.md` | Modified | Marked FS-UI-009 as Complete (Implemented & Verified — Awaiting CTO Review). |
| `docs/PROJECT_STATE.md` | Modified | Recorded completion of FS-UI-009 with complete verification evidence and browser audit findings. |

---

## 3. Verification Commands & Baseline Integrity

| Verification Check | Exact Command Executed | Result |
| :--- | :--- | :--- |
| **Milestone Integration Tests** | `npx vitest run tests/int/public-reader-redesign.int.spec.ts` | **12 passed** (100% green) |
| **All Integration Test Suites** | `npm run test:int` | **182 passed across 13 test files** (100% green) |
| **Type Checking** | `npx tsc --noEmit` | **0 errors** (100% type-safe) |
| **Linting** | `npm run lint` | **0 errors, 0 warnings** (clean) |
| **Production Build** | `npm run build` | **Successfully compiled standalone output** with Turbopack in 6.3s |
| **Live Browser Audit** | Playwright Chromium subagent | **Desktop (1280×800) and mobile (375×812) verified** with screenshots |
| **Publication Eligibility Invariant** | Automated integration checks | **Drafts, in-review, scheduled, and archived posts strictly quarantined** |

---

## 4. Remaining Risks & Operational Requirements

1. **Zero Git Command Boundary Preserved:** Autonomous agents have executed zero git commands (`git add`, `git commit`, `git push`, etc.). All version control operations remain manual for the human repository owner.
2. **Phase Boundary Enforcement:** Work stops here awaiting CTO review. No implementation of FS-UI-010 or production deployment has begun.
3. **Zero Budget & No External Network Dependencies:** Avatars are stored locally in `public/avatars/`. No external runtime avatar APIs, CDNs, or paid services were introduced.
4. **Database Migration Safety:** Deterministic avatar selection operates via user ID parity without requiring database schema changes or migrations.
