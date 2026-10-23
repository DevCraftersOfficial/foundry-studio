# Foundry Studio — Design System & Visual Standards

- **Status:** Approved Product Baseline (Milestone FS-UI-002: Design Tokens, Typography & Brand Primitives)
- **Target Audience:** Frontend Engineers, UI/UX Designers, Autonomous Agents, Agency Implementers
- **Accessibility Target:** WCAG 2.2 AA Conformance (Deterministic Verification)
- **Brand Architecture:** Endorsed Product — **Foundry Studio by DevCrafters**
- **Technology Alignment:** Next.js (App Router), `next/font/google` (Build-Time Bundled), Payload CMS 3.x, Tailwind CSS, Pure SVG Marks

---

## 1. Product Vision & Design Principles

Foundry Studio is a proprietary content publishing product developed by **DevCrafters**. It is an **endorsed product** that bridges two distinct operational modes:

1. **The Editorial Experience:** A focused, high-efficiency operational workspace for writers, editors, and administrators.
2. **The Public Publishing Experience:** A refined, authoritative, typographic-first reading surface for audiences and search engines.

### Brand Relationship: Endorsed Product ("Foundry Studio by DevCrafters")
- **Foundry Studio** maintains its unique identity as a quiet, literary, and typographically peerless publication surface.
- **DevCrafters** provides architectural and engineering pedigree. This endorsement is visibly and subtly expressed through:
  - DevCrafters warm paper canvas (`#FAF8F5`).
  - DevCrafters obsidian ink (`#0F172A`).
  - DevCrafters Flame Orange (`#EA580C`) for precision interactive elements, focus rings, and brand marks.
  - DevCrafters signature brand typeface (`Manrope`) for UI chrome, navigation, and controls.
  - The geometric hexagon bracket mark as an endorsement symbol.

### Core Principles

- **Quiet Craftsmanship Over Digital Slop:** Avoid generic AI templates, floating purple/cyan gradient orbs, and arbitrary card grids. Content and typography take precedence; UI decoration recedes.
- **Typographic Authority:** Rooted in the traditions of Swiss editorial design and classic print journalism. High contrast, precise vertical rhythm, comfortable line measures (65–75 characters), and harmonious scale.
- **State Transparency & Resilient States:** Every view must account for all six lifecycle states: Ideal, Loading, Empty, Error, Success, and Permission Denied.
- **Deterministic Accessibility (WCAG 2.2 AA):** Accessibility is not a post-launch audit; it is a structural invariant. High contrast (>=4.5:1 text, >=3:1 UI boundaries), visible focus rings, full keyboard traversability, and explicit reduced-motion accommodations are non-negotiable.
- **Single-Source Design Tokens:** All colors, spacing units, and typography scales are defined via semantic CSS custom properties and consumed by Tailwind CSS classes. Ad-hoc hex values and arbitrary utility values are strictly prohibited.

---

## 2. Dual Experience Visual Direction

### 2.1. Editorial Experience (Workspace & CMS Admin)

The editorial UI is an **App Screen** designed for daily, prolonged cognitive work:
- **Visual Tone:** Quiet, structured, calm, high utility. Neutral grey surfaces with crisp 1px borders, subtle paneling, and dense table/form layouts.
- **Status Clarity:** Content publication state (`Draft`, `In Review`, `Scheduled`, `Published`, `Archived`) is immediately discernible at a glance through semantic badges (`StatusBadge`).
- **Predictable Control Layout:** Primary actions ("Save Draft", "Submit for Review", "Publish") are positioned consistently in fixed header/footer utility bars. Destructive actions require double confirmation.
- **Payload CMS Extension Model:** Custom components injected into Payload CMS adopt Payload's native CSS variables and design tokens rather than injecting conflicting third-party component libraries.

### 2.2. Public Publishing Experience (Reader & Publication Site)

The public UI is a **Reading Surface** optimized for immersion, comprehension, and performance:
- **Visual Tone:** Sophisticated, timeless, literary. High-contrast ink on warm paper backgrounds.
- **Grid & Layout:** Fluid layout with deliberate asymmetrical whitespace options, classical single-column longform with 68ch maximum reading measure.
- **Media Presentation:** High-definition photography, rich text quotes, and embed slots framed with clean rectangular geometry.
- **Zero Draft Leaks:** Server components strictly filter out unapproved/draft content before rendering the public tree.

---

## 3. Design Tokens

### 3.1. Color Tokens & Verified Contrast Analysis

All colors are mapped to CSS custom variables supporting both Light Mode (default) and Dark Mode with strict contrast parity.

```css
:root {
  /* Surface & Background */
  --bg-canvas: #FAF8F5;              /* Warm off-white / DevCrafters paper canvas */
  --bg-surface: #FFFFFF;             /* Pure white card / panel */
  --bg-surface-elevated: #F4F1EB;    /* Slightly elevated panel / hover */
  --bg-muted: #E2E8F0;               /* Subtle container background */

  /* Ink & Typography */
  --text-primary: #0F172A;          /* DevCrafters Obsidian ink (16.84:1 on canvas, passes AAA) */
  --text-secondary: #475569;        /* Editorial slate (7.15:1 on canvas, passes AA) */
  --text-muted: #52525B;            /* Captions, timestamps, metadata (5.80:1 on canvas, passes AA) */
  --text-inverse: #FAFAFA;          /* Text on dark fills */

  /* Borders & Dividers */
  --border-subtle: #E2E8F0;         /* Crisp 1px rule (1.3:1 structural) */
  --border-strong: #94A3B8;         /* Active / hovered border (2.5:1) */
  --border-focus: #EA580C;          /* DevCrafters Flame Orange focus ring (3.56:1 >= 3.0:1) */

  /* Brand & Editorial Accents */
  --brand-primary: #0F172A;         /* Deep editorial obsidian */
  --brand-accent: #EA580C;          /* DevCrafters Flame Orange (UI / non-text accent, 3.56:1) */
  --brand-accent-text: #C2410C;     /* Accessible burnt orange for text links/labels (4.89:1 on canvas, passes AA) */
  --brand-accent-hover: #9A3412;    /* Deeper burnt orange for hover states (6.89:1) */
  --brand-accent-subtle: #FFF7ED;   /* Subtle orange tint */

  /* Status Tokens (All verified WCAG 2.2 AA >= 4.5:1 compliant) */
  --status-draft-bg: #F1F5F9;
  --status-draft-text: #475569;     /* 6.92:1 contrast */
  --status-draft-border: #CBD5E1;

  --status-review-bg: #FEF3C7;
  --status-review-text: #92400E;     /* 6.37:1 contrast */
  --status-review-border: #FDE68A;

  --status-scheduled-bg: #EEF2FF;
  --status-scheduled-text: #3730A3;  /* 8.88:1 contrast */
  --status-scheduled-border: #C7D2FE;

  --status-published-bg: #ECFDF5;
  --status-published-text: #065F46;  /* 7.29:1 contrast */
  --status-published-border: #A7F3D0;

  --status-archived-bg: #F3F4F6;
  --status-archived-text: #4B5563;   /* 6.87:1 contrast */
  --status-archived-border: #E5E7EB;

  /* Typography Scale */
  --font-serif: var(--font-newsreader), "Newsreader", "Charter", "Georgia", "Cambria", serif;
  --font-sans: var(--font-manrope), "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```

#### Empirical Contrast Ratios Summary

| Color Pair | Luminance Values | Measured Ratio | WCAG 2.2 AA Requirement | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| Canvas (`#FAF8F5`) vs Primary Ink (`#0F172A`) | `0.94` vs `0.01` | **16.84:1** | >= 4.5:1 (Normal Text) | **Passes AAA** |
| Canvas (`#FAF8F5`) vs Secondary Slate (`#475569`) | `0.94` vs `0.07` | **7.15:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Canvas (`#FAF8F5`) vs Muted Slate (`#52525B`) | `0.94` vs `0.09` | **5.80:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| White (`#FFFFFF`) vs Accessible Orange Text (`#C2410C`) | `1.00` vs `0.14` | **5.18:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Canvas (`#FAF8F5`) vs Accessible Orange Text (`#C2410C`) | `0.94` vs `0.14` | **4.89:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| White (`#FFFFFF`) vs Flame Orange UI (`#EA580C`) | `1.00` vs `0.23` | **3.56:1** | >= 3.0:1 (Non-text UI) | **Passes AA** |
| Canvas (`#FAF8F5`) vs Flame Orange UI (`#EA580C`) | `0.94` vs `0.23` | **3.36:1** | >= 3.0:1 (Non-text UI) | **Passes AA** |
| Dark Ink (`#0F172A`) on Flame Orange (`#EA580C`) | `0.01` vs `0.23` | **5.02:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Draft Badge: `#F1F5F9` bg vs `#475569` text | `0.88` vs `0.07` | **6.92:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Review Badge: `#FEF3C7` bg vs `#92400E` text | `0.90` vs `0.09` | **6.37:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Scheduled Badge: `#EEF2FF` bg vs `#3730A3` text | `0.86` vs `0.04` | **8.88:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Published Badge: `#ECFDF5` bg vs `#065F46` text | `0.92` vs `0.07` | **7.29:1** | >= 4.5:1 (Normal Text) | **Passes AA** |
| Archived Badge: `#F3F4F6` bg vs `#4B5563` text | `0.90` vs `0.08` | **6.87:1** | >= 4.5:1 (Normal Text) | **Passes AA** |

> [!IMPORTANT]
> **Contrast Guardrail:** DevCrafters Flame Orange (`#EA580C`) provides 3.56:1 contrast against white surfaces. This satisfies WCAG SC 1.4.11 for non-text UI components (focus rings, button borders, decorative icons, status indicator dots). However, for normal body text or un-bolded link labels on light surfaces, use `--brand-accent-text: #C2410C` (4.89:1) or dark ink text (`#0F172A`, 5.02:1) over solid orange fills.

---

### 3.2. Typography Architecture & Self-Hosted Strategy

Foundry Studio implements a three-family typographic system loaded at build-time with **zero runtime requests to external hosts**:

1. **`Newsreader` (Editorial Serif):**
   - **Role:** Main publication masthead, article headlines, section headings, and longform article body.
   - **Weights:** Variable (200–800), regular and italic styles.
   - **Licensing:** SIL Open Font License 1.1 (OFL-1.1). 100% free and open-source.
2. **`Manrope` (Brand Sans-Serif):**
   - **Role:** DevCrafters brand alignment, UI chrome, navigation bars, buttons, form controls, and masthead sub-lockups.
   - **Weights:** Variable (400–800).
   - **Licensing:** SIL Open Font License 1.1 (OFL-1.1). 100% free and open-source.
3. **`JetBrains Mono` (Technical Monospace):**
   - **Role:** Status badges, dates, timestamps, reading time, code blocks, and metadata tags.
   - **Weights:** 400, 500, 600.
   - **Licensing:** SIL Open Font License 1.1 (OFL-1.1). 100% free and open-source.

#### Zero-Runtime Font Loading Mechanism
Fonts are imported in [`src/app/(frontend)/layout.tsx`](file:///home/lokeshverma/DevCrafters/foundry-studio/src/app/(frontend)/layout.tsx) via `next/font/google`. During `next build`:
1. Font files (`.woff2`) are downloaded and stored locally in `.next/static/media/`.
2. CSS `@font-face` rules are emitted with local hashed URLs (`/_next/static/media/*.woff2`).
3. Fonts are injected via CSS variables `--font-newsreader`, `--font-manrope`, `--font-jetbrains-mono`.
4. At runtime, the browser makes **zero external HTTP requests** to Google servers, conforming strictly to Content Security Policy (`font-src 'self' data:`).

---

### 3.3. Reusable Brand & UI Primitives

#### 3.3.1. `BrandLockup` (`src/components/ui/BrandLockup.tsx`)
The primary brand signature establishing the endorsed relationship "Foundry Studio by DevCrafters":
- **Variants:**
  - `masthead`: Newspaper masthead with title and uppercase sub-lockup ("BY DEVCRAFTERS").
  - `footer`: Balanced footer lockup with title and DevCrafters product credit.
  - `compact`: Inline header lockup (`FOUNDRY STUDIO / by DevCrafters`).
  - `badge`: Pill badge for metadata or headers.
- **Accessibility:** Pure SVG DevCrafters mark with `aria-hidden="true"`, explicit `aria-label` on navigation links, full keyboard navigability with visible focus rings.

#### 3.3.2. `StatusBadge` (`src/components/ui/StatusBadge.tsx`)
Accessible indicator for the 5 publishing lifecycle states:
- **States:** `draft`, `in_review`, `scheduled`, `published`, `archived`.
- **Accessibility:** `role="status"` with descriptive `aria-label`, indicator dot with `aria-hidden="true"`, and verified WCAG 2.2 AA contrast on every state badge.

#### 3.3.3. `CategoryNav` (`src/components/editorial/CategoryNav.tsx`)
Accessible, responsive section navigation bar:
- **Active Section Identification:** The active category or Front Page is explicitly identified with semantic `aria-current="page"` and high-contrast pill styling (`--text-primary` background with `--text-inverse` text, providing 16.84:1 contrast).
- **Responsive Layout:** Horizontal overflow container with smooth touch scrolling (`-webkit-overflow-scrolling: touch`) and hidden scrollbars for clean mobile ergonomics.
- **Keyboard Support:** Visible focus rings (`--border-focus: #EA580C`) and logical tab traversal.

#### 3.3.4. Reading Time Engine (`src/lib/reading-time.ts`)
Deterministic reading-time calculation for editorial journalism:
- **Metric:** Industry standard 200 words per minute (WPM).
- **Lexical AST Extraction:** Recursively extracts plain text from Lexical node trees (`paragraph`, `quote`, `heading`, `list`, `link`).
- **Safety Invariant:** Handles `null`, `undefined`, empty string, and empty AST objects gracefully without throwing (`0 min read`). Minimum 1 minute read for any content with non-zero words.

#### 3.3.5. Related Stories & Publishing Boundary
- **Section Placement:** Rendered at the conclusion of article pages under `<section className="related-stories-section" aria-label="Related Stories">`.
- **Relationship Matching:** Dynamically queries up to 3 published articles sharing categories with the active post.
- **Strict Isolation Invariant:** Constrained by `getPublicPostWhere(now)` and `{ id: { not_equals: post.id } }`. Drafts, in-review, scheduled, and archived posts are strictly prevented from appearing in public related stories recommendations.

#### 3.3.6. Restrained Editorial Refinements
- **Editorial Drop Cap:** Classic print drop cap applied via CSS (`.article-body-container > .rich-text > .prose-paragraph:first-of-type::first-letter`) floats initial letter at 3.5rem in `Newsreader` bold serif without DOM pollution, preserving screen-reader accessibility.
- **Editorial Standfirst:** Stylized lead paragraph (`.article-standfirst`) in italicized serif with a 3px DevCrafters orange border rule (`--brand-accent`).
- **Reading Measure:** Article body constrained to `68ch` with 1.8 line-height for optimal reading ergonomics.

#### 3.3.7. Payload Admin Editorial Workspace Branding & Studio Navigation
- **Architectural Approach:** Employs Payload CMS 3.x's official extension points (`admin.components.Nav`, `admin.components.header`, `admin.components.graphics`, and `custom.scss`) per ADR-0004 without brittle DOM hacking or global CSS monkey-patching.
- **Components:**
  - `StudioNav` (`src/components/admin/StudioNav.tsx`) & `StudioNavClient` (`src/components/admin/StudioNavClient.tsx`): Replaces default sidebar navigation with a responsive, role-aware newsroom desk navigation wrapped in Payload's native `NavWrapper`. Features branded masthead, active route indicators (`border-left: 3px solid #EA580C`, subtle warm highlight), user session profile card, role badges (`ADMIN`, `EDITOR`, `AUTHOR`), and sign-out controls.
  - `StudioHeader` (`src/components/admin/StudioHeader.tsx`): Bespoke top newsroom desk masthead rendered globally at `admin.components.header`. Displays live publishing status, environment badge (`PROD` / `LOCAL DEV`), role indicator pill, direct link to Public Reader, and an integrated Draft Mode status banner with an explicit "Exit Preview" control (`/api/exit-preview`).
  - `AdminLogo` (`src/components/admin/Logo.tsx`): Responsive SVG brand lockup displayed on admin login (`/admin/login`) featuring the DevCrafters geometric hexagon bracket in Flame Orange (`#EA580C`) and obsidian wordmark (`var(--theme-elevation-1000)`). Fully light/dark mode responsive.
  - `AdminIcon` (`src/components/admin/Icon.tsx`): Compact 25×25 SVG icon rendered in the authenticated workspace header and StepNav breadcrumbs.
  - `Favicon` (`public/favicon.svg`): Standalone SVG favicon for browser tabs across both public and administrative routes.
- **Role-Aware Navigation Desks (Usability Measures):**
  - **Editorial Desk** (Overview Desk, Dispatches, Media Room): Visible to all authenticated editorial roles (`admin`, `editor`, `author`).
  - **Organization & Beats** (Categories, Topic Tags): Visible to `admin` and `editor`.
  - **Governance** (Staff & Authors): Visible to `admin` only.
  - **Review & Fallbacks** (Native Data Tables): Explicit fallback link to Payload standard collection tables for administrative recovery.
- **Lifecycle & Error States:**
  - **Loading State:** Shimmering animated skeleton loaders when session data is resolving.
  - **Permission-Denied State:** High-visibility restricted workspace banner when an account has zero accessible collections.
- **Restrained Admin Stylesheet (`src/app/(payload)/custom.scss`):**
  - DevCrafters Flame Orange accent focus outlines (`:focus-visible`).
  - High-contrast obsidian ink header (`#0F172A`) with crisp borders.
  - Responsive mobile drawer styling integrated with Payload's native hamburger toggle.
- **Editorial Workflow Guidance:**
  - `Posts.status`: Step-by-step description of editorial lifecycle (`draft` → `in_review` → `scheduled` → `published` → `archived`).
  - `Posts.publishedAt`: Validation guidance explaining scheduled future requirements versus immediate publication auto-dating.
  - `Posts.author`: Attribution boundaries for authors versus editors/admins.
  - `Media.alt`: WCAG 2.2 AA accessibility instructions for content creators.

#### 3.3.8. Foundry Studio Newsroom Dashboard View (`StudioDashboard`)
- **Architectural Approach:** Implemented via Payload 3.x's official custom dashboard extension point (`admin.components.views.dashboard.Component`), replacing generic Payload collection cards with a purpose-built editorial newsroom desk.
- **Components:**
  - `StudioDashboard` (`src/components/admin/StudioDashboard.tsx`): Server Component executing role-aware, server-authorized queries via Local API with `overrideAccess: false, user`. Evaluates RBAC boundaries without leaking drafts or restricted content across authors.
  - `StudioDashboardView` (`src/components/admin/StudioDashboardView.tsx`): High-craft presentation component rendering newsroom masthead, 4 KPI metric cards, review queues, work-in-progress drafts, scheduled release countdowns, live dispatches, and quick desk actions.
  - `editorial-date` (`src/lib/editorial-date.ts`): Deterministic helpers for relative time (`just now`, `5m ago`, `2d ago`), scheduled countdowns (`in 45m`, `in 3h`, `in 2d`), and greeting generation.
- **Role-Aware Content Queues & Privacy Boundaries:**
  - **Author Role:**
    - Metric cards display author's own drafts, author's submissions in review, author's scheduled stories, and live dispatches.
    - Review section presents "Your Submissions in Review" with status badges.
    - "Your In-Progress Drafts" provides direct "Continue Writing" links.
    - Strictly prevents leaking other authors' un-submitted drafts or in-review items.
  - **Editor & Admin Roles:**
    - Priority "Editorial Review Queue" (Needs Review) displaying team-wide submissions awaiting evaluation, proofreading, and approval, sorted by latest submissions (`-createdAt`).
    - "Work in Progress (Recent Drafts)" displaying team drafts.
    - "Upcoming Releases" with relative release countdowns.
    - Quick Desk Actions including Categories and Topic Tags.
    - Admin role additionally displays Staff & Authors Directory and native collection table fallback.
- **Lifecycle & Standard UI States:**
  - **Ideal State:** High-contrast editorial workspace with 4 KPI cards and responsive 2-column grid.
  - **Loading State:** Shimmering animated card and row skeletons matching the real geometric layout of the dashboard.
  - **Empty State:** When total publication records are 0, displays a Newsroom Onboarding Banner with 3-step setup guidance ("1. Organize Beats", "2. Draft a Story", "3. Upload Media"). Section-specific empty states reassure the user when queues are clear ("Editorial desk is clear. No submissions currently awaiting review.").
  - **Error State:** High-visibility error card with custom message and "Refresh Newsroom Desk" recovery link.
  - **Permission-Denied State:** Secure restricted desk card blocking unauthenticated users without exposing metrics or publication titles.
- **Design Tokens & Visual Hierarchy:**
  - High-contrast obsidian ink (`#0F172A`) on warm canvas (`#FAF8F5`).
  - DevCrafters Flame Orange (`#EA580C`) for active highlights, focus rings, and primary "+ New Dispatch" CTA.
  - Status tokens matching WCAG 2.2 AA (Draft `#475569`, Review `#92400E`, Scheduled `#3730A3`, Published `#065F46`).
  - Zero emojis: pure inline SVGs for all functional icons.

#### 3.3.9. Foundry Studio Authoring Desk & Dual-Mode Preview (`StudioAuthoringHUD`)
- **Architectural Approach:** Implemented through Payload 3.x's official document controls extension point (`admin.components.edit.beforeDocumentControls`), integrating proprietary HUD controls and branding without replacing the native form state, Lexical rich-text editor, or field validation engine.
- **Two-Column Editorial Writing Desk Layout:**
  - **Writing Canvas (`.document-fields__main`):** Distraction-free, centered editorial canvas (`max-width: 920px`) housing the headline (`title`), custom URL slug (`slug`), standfirst summary (`excerpt`), and longform Lexical rich-text editor (`content`).
  - **Inspector Sidebar (`.document-fields__sidebar`):** Dedicated metadata inspector housing publication workflow status (`status`), scheduled release date (`publishedAt`), attribution (`author`), primary photography (`featuredImage`), category taxonomy (`categories`), and topic tags (`tags`).
  - **Responsive Stacking:** On viewports `<= 1024px` and mobile (`375px`), the inspector sidebar collapses seamlessly beneath the writing canvas into an accessible single-column stack.
- **Word-Count & Reading-Time HUD:**
  - Derived deterministically in real time from Lexical AST node structure using `calculateReadingTime` (`src/lib/reading-time.ts`).
  - Evaluates standard 200 WPM publishing metrics with formatted labels (`34 words • 1 min read`).
  - Accessible via `role="status"` and `aria-atomic="true"`.
- **Form Persistence & Lifecycle Status:**
  - Real-time indicator badges tracking document lifecycle:
    - `Saved to Desk` (emerald dot `#22C55E`): Confirmed database persistence.
    - `Unsaved Changes` (pulsing flame dot `#EA580C`): Active unsaved modifications.
    - `Saving...` (animated SVG spinner): Asynchronous network mutation in flight.
    - `Read-Only` (padlock icon): User lacks edit/save permissions.
  - Document workflow pills (`DRAFT`, `IN REVIEW`, `PUBLISHED`, `SCHEDULED`).
- **Dual-Mode Secure Preview Flow:**
  - **1. Split-Pane Live Preview:** Toggled via `Split Preview` button, utilizing Payload's native `admin.livePreview` with responsive device switchers (`mobile 375px`, `tablet 768px`, `desktop 1280px`).
  - **2. Reader in Separate Tab (`POST /api/preview`):** Authorizes draft mode using server-side session authentication (`payload.auth()`). Automatically issues Next.js `draftMode().enable()` and opens `/posts/[slug]` in a new tab without exposing preview secrets in URLs, client code, or query strings.
  - **Server-Side Authorization Invariant:** Strictly blocks authors from previewing drafts authored by others (HTTP 403), while permitting Editors and Admins team-wide preview.

#### 3.3.10. Foundry Studio Public Reader Redesign (FS-UI-009)
- **Architectural Approach:** Complete, distinctive editorial reader experience rooted in Swiss typographic authority, high contrast, and asymmetrical broadsheet presentation.
- **Asymmetric Front-Page Hierarchy (`src/app/(frontend)/page.tsx`):**
  - **Lead Feature Story:** Expansive primary card with large Newsreader headline (`clamp(2rem, 3.5vw, 3rem)`), standfirst summary, publication metadata, reading time pill, and featured photography framed with crisp 1px borders.
  - **Secondary Feature Story:** Complementary story positioned alongside the lead feature in an asymmetrical two-column layout (`1.4fr : 1fr`), establishing visual pacing and editorial rhythm.
  - **Latest Dispatches Grid:** Multi-column grid for standard articles featuring author attribution with doodle profile avatars, reading time badges, category labels, and hover micro-interactions.
  - **Editorial Beats Index:** Taxonomy navigation showcasing active content categories with direct links and counts.
- **Longform Article Reading Experience (`src/app/(frontend)/posts/[slug]/page.tsx`):**
  - **Reading Geometry:** Maximum measure constrained to `68ch` (`max-w-prose`) with `1.8` line-height for optimal optical ergonomics and longform comfort.
  - **Author Attribution Card:** Positioned directly below the headline and standfirst, featuring a prominent doodle profile avatar (`Avatar.tsx`), linked author archive, editorial role pill, publication date, and calculated reading time.
  - **Topic Tags & Navigation:** Clean typographic tag pills linking directly to `/tag/[slug]` topic archives.
  - **Related Dispatches:** Contextual article recommendations dynamically querying up to 3 published posts in shared categories, strictly constrained by `getPublicPostWhere(now)` to eliminate draft leakage.
- **Taxonomy & Author Archives:**
  - **Topic Tag Archive (`src/app/(frontend)/tag/[slug]/page.tsx`):** Dedicated archive view with tag header and grid of eligible published stories.
  - **Category Archive (`src/app/(frontend)/category/[slug]/page.tsx`):** Section archive with breadcrumbs and published dispatches.
  - **Author Archive (`src/app/(frontend)/author/[id]/page.tsx`):** Author profile header featuring large doodle avatar (`size="xl"`), author name, editorial role badge, total published stories count, and an archive grid of authored stories with strict publication filtering.
- **Server-Side Public Search (`src/app/(frontend)/search/page.tsx`):**
  - Robust server-side `like` search querying post titles and excerpts using Local API.
  - Strict publication eligibility invariant enforced (`getPublicPostWhere(now)`).
  - Explicit UI lifecycle states: Search bar input, Results grid, Empty query guidance ("Enter a query above to explore stories..."), Zero results state ("No stories found matching '...'"), and Error recovery.
  - Search engine privacy: Configured with `robots: { index: false, follow: true }` and disallowed in `robots.ts` to prevent crawl budget dilution.
- **Editorial 404 Recovery View (`src/app/not-found.tsx` & `src/app/(frontend)/not-found.tsx`):**
  - Bespoke literary not-found page with search query field, quick navigation links back to front page beats, and clean typographic framing.
- **Obsolete Copy Removal:**
  - Updated brand lockup footer endorsement from "An Open-Source Editorial Publishing Platform" to "Editorial Publishing Platform" in `BrandLockup.tsx`, while maintaining accurate open-source license notices in `LICENSE`.

#### 3.3.11. Default Doodle Profile Avatars & Fallback System (FS-UI-009)
- **Visual Identity Alignment:**
  - Two original, AI-generated doodle-style illustrated avatars created locally:
    - `public/avatars/avatar-male.jpg`: Friendly, modern illustrated portrait.
    - `public/avatars/avatar-female.jpg`: Friendly, modern illustrated portrait.
  - Palette: Warm ivory canvas (`#FAF8F5`), obsidian ink line art (`#0F172A`), and restrained DevCrafters flame-orange accents (`#EA580C`).
  - Stored locally as static assets — **zero runtime external HTTP requests and zero recurring costs**.
- **Deterministic Fallback Engine (`src/lib/avatar.ts`):**
  - Resolves avatar image path and alt text for any user object.
  - **Precedence Rule:** Custom user-uploaded profile photos take precedence. When absent, the engine falls back to default doodle avatars.
  - **Deterministic Selection Mechanism:** Explicit user ID parity (`id % 2 === 0 ? male : female`) guarantees consistent, reproducible avatar assignment across all surfaces without guessing or inferring from user names, and without requiring database schema migrations.
  - Graceful null/undefined safety: Returns male doodle fallback if user is null or undefined.
- **Accessible Avatar Component (`src/components/ui/Avatar.tsx`):**
  - Reusable presentation component supporting sizes: `xs` (20px), `sm` (28px), `md` (40px), `lg` (64px), and `xl` (80px).
  - Accessible Screen-Reader Treatment:
    - When `decorative={true}` (default when rendered alongside a visible username/byline), applies `aria-hidden="true"` to prevent redundant screen reader announcements.
    - When rendered standalone, applies descriptive `alt` text.
  - Integrated across both Editorial and Public surfaces:
    - Public: Article author attribution card, Author archive header, and Dispatch cards.
    - Editorial: Studio navigation user session card (`StudioNavClient.tsx`) and Newsroom Dashboard review queues (`StudioDashboardView.tsx`).

| Token | Size | Line Height | Tracking | Recommended Use |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | 3.5rem (56px) | 1.1 | -0.025em | Main publication masthead / Hero title |
| `text-h1` | 2.5rem (40px) | 1.15 | -0.02em | Article headline (Desktop) |
| `text-h2` | 1.875rem (30px) | 1.25 | -0.015em | Major section headers, Collection titles |
| `text-h3` | 1.5rem (24px) | 1.3 | -0.01em | Subsections, Card headlines |
| `text-lead` | 1.25rem (20px) | 1.5 | 0 | Standfirst, Article introductory summaries |
| `text-body` | 1.0rem (16px) | 1.65 | 0 | Standard longform body reading |
| `text-ui` | 0.875rem (14px) | 1.4 | 0 | Admin forms, table cells, metadata, buttons |
| `text-caption` | 0.75rem (12px) | 1.4 | +0.02em | Photo captions, status badges, timestamps |

**Reading Geometry Rule:** Longform article bodies (`text-body`) must have an enforced maximum line length of `68ch` (`max-w-prose`) to maintain optimal visual reading comfort and prevent eye fatigue.

### 3.3. Spacing Scale

Based on an 8pt primary spatial grid with 4pt half-steps for micro-components:

```css
--space-1:  0.25rem;  /* 4px  - icon gaps, badge internal padding */
--space-2:  0.5rem;   /* 8px  - form input padding-y, tight item gap */
--space-3:  0.75rem;  /* 12px - button padding-y, card internal micro-gap */
--space-4:  1.0rem;   /* 16px - standard component padding, form element gap */
--space-6:  1.5rem;   /* 24px - card internal padding, panel spacing */
--space-8:  2.0rem;   /* 32px - section spacing in admin workspace */
--space-12: 3.0rem;   /* 48px - sub-feature separations */
--space-16: 4.0rem;   /* 64px - article section spacing */
--space-24: 6.0rem;   /* 96px - major editorial hero/chapter separations */
```

### 3.4. Borders, Radii, and Elevation

- **Radii:**
  - `radius-none`: `0px` — Used for architectural images, full-bleed containers, print-like layout dividers.
  - `radius-sm`: `3px` — Badges, chips, small code snippets.
  - `radius-md`: `6px` — Standard buttons, inputs, modal containers, and cards.
  - `radius-full`: `9999px` — Strictly for status indicator dots or circular avatars. **Never** use pill-shaped buttons for editorial CTAs.
- **Borders:**
  - Standard border width is strictly `1px solid var(--border-subtle)`.
  - Focused interactive controls use `2px solid var(--border-focus)`.
- **Elevation / Shadows:**
  - Avoid soft diffuse blurred floating shadows ("Apple-style" or "neumorphic" blur).
  - Use subtle, tight boundary elevation:
    - `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (card resting state)
    - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` (modals & popovers)

---

## 4. Responsive Breakpoints

Foundry Studio tests and certifies four primary viewports:

| Breakpoint | Target Width | Typical Hardware Target | Core Layout Behavior |
| :--- | :--- | :--- | :--- |
| **Mobile (`sm`)** | `375px` – `639px` | Modern smartphones | Single-column stack, full-width touch targets (>=44px), collapsible navdrawer. |
| **Tablet (`md`)** | `768px` – `1023px` | iPad, tablet portrait/landscape | 2-column editorial grids, persistent sidebars collapsed to icons or slide-overs. |
| **Desktop (`lg`)** | `1024px` – `1439px` | Realistic laptops, standard monitors | Full editorial multi-column layouts, sticky metadata sidebars, split-screen editor previews. |
| **Wide (`xl`/`2xl`)**| `1440px+` | External displays, 4K monitors | Centered layout with maximum reading boundary (`max-w-7xl`), expanded margins for margin notes. |

---

## 5. Interaction States & Transitions

### 5.1. Interactive Lifecycle Rules

All clickable or interactive elements (`<a>`, `<button>`, inputs, list row actions) must define explicit visual styles for:

1. **Resting:** Clear visual boundary, unmistakable interactive cue (cursor: pointer).
2. **Hover:** 150ms–200ms ease-out transition. Subtle background shift (`bg-surface-elevated`) or text color change. No aggressive scaling (no `scale-110`).
3. **Focus-Visible:** Essential for keyboard navigation. A distinct `2px solid var(--border-focus)` outline with `2px` offset. Never disable `outline` without providing an equal-or-better focus indicator.
4. **Active (Pressed):** Instant response (0ms–50ms) with subtle visual feedback (e.g., slight background darkening or `translate-y-px`).
5. **Disabled:** Visual de-emphasis (`opacity-50`), `cursor-not-allowed`, and accessibility tags (`aria-disabled="true"`).

### 5.2. Motion & Reduced Motion Standards

- **Functional Purpose Only:** Motion is permitted only to communicate state change, spatial continuity (modals opening/closing), or progressive disclosure (accordions). Purely ornamental bouncing, continuous rotating badges, or automatic marquee animations are banned.
- **Timing:** 150ms–250ms with ease-out timing curve `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Reduced Motion Requirement:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 6. Accessibility & WCAG 2.2 AA Compliance

1. **Contrast Ratio Strictness:**
   - Normal text (< 18pt or < 14pt bold): minimum **4.5:1** contrast against background.
   - Large text (>= 18pt or >= 14pt bold): minimum **3.0:1** contrast against background.
   - Essential UI components and active borders: minimum **3.0:1** contrast.
2. **Target Sizing (Touch & Pointer):**
   - Interactive touch targets must meet the minimum size of **44 × 44 CSS pixels** on mobile/tablet viewports.
3. **Accessible Forms & Error Handling:**
   - Every input must have an associated, programmatically linked `<label>` (using `htmlFor` / `id`).
   - Placeholder text is **never** a replacement for a label.
   - Validation errors must appear adjacent to the field with `aria-describedby` pointing to the error message ID and `aria-invalid="true"` set on the input.
4. **Iconography & Visual Elements:**
   - Use clean, scalable SVG icons (Lucide or Heroicons).
   - **Strict prohibition:** Never use emojis (e.g., 📝, 🚀, ❌) as icons for functional UI actions.
   - Standalone icon buttons (no visible text) must provide an accessible label via `aria-label` or visually hidden screen reader text (`sr-only`). Decorative icons must have `aria-hidden="true"`.

---

## 7. Component Architecture Conventions

1. **Atomic & Focused:** Build UI components in `src/components/` grouped by domain (`src/components/ui/` for primitive buttons, badges, inputs; `src/components/editorial/` for article cards, mastheads, author bios).
2. **Server-First by Default:** All components are Next.js Server Components unless interactive browser APIs, event listeners, or React client state (`useState`, `useEffect`) are explicitly required. Mark client boundaries with `'use client'` at the lowest possible sub-tree leaf.
3. **Resilient State Handling:** Every container or list component must implement:
   - **Loading State:** Skeleton loaders matching the real geometric layout of the loaded content (no generic centered spinning wheels).
   - **Empty State:** Honest, helpful editorial copy explaining what belongs here and how to create the first item.
   - **Error State:** Clear, non-technical explanation with an actionable recovery option ("Try Again" button).
4. **Safe Rich Text:** Lexical rich text output must be sanitized and rendered through approved semantic server components. Never execute raw `dangerouslySetInnerHTML` with untrusted markup.

---

## 8. Explicit Anti-Patterns to Avoid

- ❌ **No AI Slop Gradients:** No vibrant neon-purple-to-hot-pink diagonal gradients on buttons or hero backgrounds.
- ❌ **No Arbitrary Three-Card Clones:** No generic marketing rows with three identical icon-in-tinted-circle feature cards.
- ❌ **No Emojis as UI Icons:** Functional controls must use crisp, consistent SVG icons with accessibility labels.
- ❌ **No Low-Contrast Gray Text:** Never use faint `#9CA3AF` body text on white backgrounds. Text contrast must be verified at >=4.5:1.
- ❌ **No Unlabeled Icon Buttons:** Every button must either have visible text or an accessible `aria-label`.
- ❌ **No Hardcoded Hex Values in Markup:** All colors must flow through semantic tokens (`var(--text-primary)`, `var(--bg-surface)`).
- ❌ **No Pill Buttons for Editorial CTAs:** Avoid hyper-rounded bubble buttons in formal publishing contexts.
- ❌ **No Disabling Keyboard Focus:** Removing `outline: none` without providing a visible focus ring is a critical accessibility failure.
- ❌ **No Leaking Draft Articles:** Draft or unverified editorial revisions must never be rendered in public routes, RSS feeds, or sitemaps.

---

## 9. Extending the Design System

When new components or custom editorial views are introduced in future milestones:

1. **Check Existing Tokens First:** Map the requirements onto existing color, spacing, and typography scales before proposing additions.
2. **Consult Installed Skills:**
   - For public pages and visual art direction, consult `design-taste-frontend` (`.agents/skills/design-taste-frontend/SKILL.md`).
   - For UI component specifications, UX accessibility rules, and layout constraints, run `ui-ux-pro-max` search:
     ```bash
     python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
     ```
3. **Document Token Shifts in ADRs:** Any addition of major design tokens, color scales, or typography providers requires updating `docs/DESIGN_SYSTEM.md` and logging an ADR if architectural conventions change.
