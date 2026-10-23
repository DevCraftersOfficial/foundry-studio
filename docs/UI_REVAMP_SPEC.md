# Foundry Studio — Full Product Revamp Specification
**Document Version:** 1.0.0  
**Status:** Discovery & Specification (Approved for CTO Review)  
**Milestone:** `FS-UI-005A`  
**Brand Identity:** Foundry Studio by DevCrafters (Endorsed Product)  

---

## 1. Product Positioning & Strategic Redirection

### 1.1. Executive Vision
Foundry Studio is transitioning from a lightly branded headless CMS implementation into a **distinctive, proprietary content publishing product** engineered by **DevCrafters**. 

While the underlying technology stack continues to leverage battle-tested open-source libraries (Next.js 16, Payload CMS 3.x, PostgreSQL, Lexical) to maintain a strict ₹0 infrastructure development budget, the user-facing product is positioned as a **premium editorial platform** with potential future commercial licensing and hosted service tiers.

### 1.2. Brand Relationship: Endorsed Product
Foundry Studio operates under an **endorsed brand architecture**:
- **Primary Product:** Foundry Studio
- **Endorsing Parent Brand:** DevCrafters ("by DevCrafters")
- **Relationship Definition:** Foundry Studio maintains its own dedicated editorial design language, typography, and personality, with DevCrafters acting as the guarantor of engineering excellence, security, and precision.

### 1.3. Copy & Positioning Rules
- **No Open-Source Self-Description in Product Copy:** Public-facing copy, mastheads, footers, meta descriptions, and documentation must **not** describe Foundry Studio as an "open-source publishing platform". Instead, use:
  - *"An Authoritative Content Publishing Platform by DevCrafters"*
  - *"An Independent Editorial Publishing Product"*
  - *"Engineered for Long-Form Journalism and Thoughtful Publishing"*
- **Legal & Dependency Transparency:** Underlying open-source licenses (MIT, Apache 2.0) of runtime dependencies and third-party packages must remain completely accurate and unencumbered in license files, dependency manifests, and legal notices.
- **Commercial Boundary:** Pricing, subscription billing, tenant routing, and hosted cloud commitments remain explicitly undecided and out of scope for current phases.

---

## 2. Design Language & Editorial Aesthetic

### 2.1. Visual Principles
Foundry Studio rejects "AI-slop" conventions (neon gradients, generic floating cards, unmotivated animations, and centered purple CTA buttons) in favor of **Swiss-style editorial rigor, typographic craft, and intellectual weight**:

1. **Ink on Paper:** Warm canvas (`#FAF8F5`) paired with deep obsidian ink (`#0F172A`) evoking high-grade newsprint and broadsheet editorial authority.
2. **Restrained Engineering Accent:** DevCrafters Flame Orange (`#EA580C`) is applied sparingly as a deliberate editorial accent (standfirst rules, status pills, brand anchors, focus indicators). It never dominates the reading field.
3. **Typographic Hierarchy as Architecture:**
   - **Editorial Headlines & Long-Form Body:** *Newsreader* (variable optical-size serif, italics, drop caps).
   - **Interface, Controls & Navigation:** *Manrope* (geometric grotesque sans-serif with high legibility at 12px–14px).
   - **Metadata, Timestamps, System Badges & Code:** *JetBrains Mono* (monospaced clarity for timestamps, word counts, and system states).
4. **Information Density with Breathing Room:** High data density in administrative views without visual clutter; generous line measure (maximum `68ch`) and 1.7–1.8 line-height in public long-form reading.

### 2.2. Design Tokens Baseline

| Token Name | Value | Purpose / Role |
| :--- | :--- | :--- |
| `--color-canvas` | `#FAF8F5` | Primary canvas (warm newsprint paper) |
| `--color-surface` | `#FFFFFF` | Elevated card & panel surface |
| `--color-surface-subtle` | `#F4F1EA` | Table headers, secondary containers, card footers |
| `--color-ink` | `#0F172A` | Primary text and headlines (16.84:1 contrast on canvas) |
| `--color-ink-muted` | `#475569` | Secondary text, standfirst summaries (7.25:1 contrast) |
| `--color-ink-subtle` | `#64748B` | Timestamps, metadata, reading time (4.89:1 contrast) |
| `--color-accent` | `#EA580C` | DevCrafters Flame Orange (brand accent, focus rings, border accents) |
| `--color-accent-text` | `#C2410C` | High-contrast orange for text on light surfaces (4.89:1 contrast) |
| `--color-border-subtle` | `rgba(15, 23, 42, 0.08)` | Structural hairline dividers, grid lines |
| `--color-border-strong` | `rgba(15, 23, 42, 0.20)` | Active containers, input borders |
| `--font-editorial` | `Newsreader, serif` | Article headlines, body paragraphs, pull-quotes |
| `--font-ui` | `Manrope, sans-serif` | Menus, buttons, table cells, form labels |
| `--font-meta` | `JetBrains Mono, monospace` | Timestamps, reading times, slug previews, badge text |

---

## 3. Screen Inventory & UX Specifications

### 3.1. Editorial Workspace (Studio)

The Editorial Workspace is the heart of Foundry Studio. It must feel like a dedicated, bespoke newsroom tool—not a generic database browser.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ FOUNDRY STUDIO / by DevCrafters                           [● System Ready] [Lokesh Verma ▼]│
├───────────────┬────────────────────────────────────────────────────────────────────────────┤
│ ❖ Dashboard   │ Editorial Desk                                       [ + New Dispatch ]    │
│ ▤ Dispatches  │ ────────────────────────────────────────────────────────────────────────── │
│ 📁 Taxonomy   │ Active Submissions (3)  •  Drafts (5)  •  Live (12)  •  Scheduled (2)      │
│ 🖼 Media Room │ ┌────────────────────────────────────────────────────────────────────────┐ │
│ ⚙ Settings    │ │ Quick Filter: [ All Categories ▼ ] [ All Authors ▼ ] [ Search...     ] │ │
│               │ └────────────────────────────────────────────────────────────────────────┘ │
│               │                                                                            │
│               │ DISPATCH TITLE                      AUTHOR       STATUS      UPDATED       │
│               │ The Craft of Editorial Systems      Lokesh V.    Published   2 hours ago   │
│               │ Modern Content Modeling in 2026     Editorial    In Review   Yesterday     │
│               │ Investigation: Supply Chains        Jane Doe     Draft       3 days ago    │
└───────────────┴────────────────────────────────────────────────────────────────────────────┘
```

#### Screen 3.1.1: Authentication (`/admin/login` / `/studio/login`)
- **User Goals:** Fast, secure authentication for authors, editors, and platform administrators.
- **Layout & Hierarchy:**
  - Centered editorial lockup on warm canvas (`#FAF8F5`).
  - Prominent `AdminLogo` (Flame Orange hexagon mark + obsidian "FOUNDRY STUDIO" wordmark + "BY DEVCRAFTERS" subtext).
  - Clean credentials form: Email and Password inputs with visible labels, focus rings, and validation feedback.
  - Dedicated "Studio Workspace" subtitle: *"Sign in to access the newsroom desk"*.
- **Responsive Behavior:** Full-width card with comfortable touch padding (min 44px input height) on mobile; centered 420px card on desktop.
- **Accessibility:** Explicit labels linked via `htmlFor`, error messages linked via `aria-describedby`, error alert with `role="alert"`.

#### Screen 3.1.2: Editorial Dashboard (`/admin` / `/studio`)
- **User Goals:** High-level operational awareness of publication velocity, pending reviews, scheduled releases, and quick actions.
- **Key Modules:**
  1. **Desk Metrics Bar:** Count of Drafts in progress, Submissions awaiting review, Scheduled releases, and Live dispatches.
  2. **Needs Review Pipeline:** Highlighted cards of posts in `in_review` status awaiting editorial approval with quick one-click preview and review links.
  3. **Upcoming Scheduled Dispatches:** Timeline of upcoming automated releases with countdown timers.
  4. **Recent Editorial Activity:** Chronological log of recent changes across authors and editors.
  5. **Quick Actions:** Prominent `+ New Dispatch`, `Upload Media`, `Manage Categories`.
- **States:** Ideal, Loading (table skeletons), Empty (guidance card explaining how to start the first story), Error (actionable retry).

#### Screen 3.1.3: Content Listing & Dispatches Table (`/admin/collections/posts`)
- **User Goals:** Rapid scanning, filtering, bulk status updates, and triage of all publication content.
- **Key Features:**
  - **Faceted Filters:** Status pills (`All`, `Draft`, `In Review`, `Scheduled`, `Published`, `Archived`), Category dropdown, Author dropdown, Date range.
  - **Live Search:** Fast title and slug search with instantaneous debounce.
  - **Sortable Columns:** Title, Author, Primary Category, Status Badge, Publication Date, Word Count / Read Time, Last Updated.
  - **Row Quick Actions:** Edit, View Live / Preview, Submit for Review (Authors), Publish / Unpublish (Editors/Admins).
- **Responsive Behavior:** On narrow screens (<768px), collapse table into structured editorial dispatch cards displaying headline, author, status badge, and date.

#### Screen 3.1.4: Article Authoring & Editing Desk (`/admin/collections/posts/[id]`)
- **User Goals:** Focused, distraction-free writing environment coupled with comprehensive publishing metadata controls.
- **Layout Structure (2-Column Studio Desk):**
  - **Main Writing Canvas (Left 70%):**
    - Large headline input (`Newsreader` serif styling).
    - Subtitle / Standfirst input (300 character limit counter, auto-generated excerpt).
    - Full-featured Lexical rich-text editor with clean inline floating toolbar:
      - Headings (`H2`, `H3` — `H1` reserved for post title).
      - Bold, Italic, Strikethrough, Code.
      - Bulleted & Numbered lists.
      - Blockquotes with author/citation subfield.
      - Inline link with URL protocol validation and target settings.
      - Curated media image insertion with caption and alt text modal.
      - Horizontal divider rule.
  - **Editorial Inspector Sidebar (Right 30%):**
    - **Publishing Actions Box:** Sticky save button, "Submit for Review" (Authors), "Publish Now" / "Schedule" (Editors/Admins), "Save as Draft", "Archive".
    - **Live Preview Button:** Opens persistent Next.js Draft Mode preview in split view or new tab.
    - **Workflow Status Badge & Selector:** Visual lifecycle state indicator with descriptive guidance.
    - **Publication Timestamp Picker:** Day and time picker with future-date validation for scheduled posts.
    - **Author Attribution:** Fixed to authenticated user for authors; reassignable by editors/admins.
    - **Taxonomy Selectors:** Categories (multi-select), Tags (tag picker with on-the-fly creation for editors).
    - **Featured Asset:** Media picker with drag-and-drop upload and focal point selector.
    - **SEO & Social Metadata Accordion:** Canonical URL override, social title, social description, OpenGraph card preview.
    - **Live Ergonomics:** Dynamic word count, character count, and calculated reading time (200 WPM).
- **States:** Draft auto-saving status indicator ("Draft saved at 14:32:05"), Unsaved changes warning modal, Validation error banner highlighting missing required fields.

#### Screen 3.1.5: Media Library Room (`/admin/collections/media`)
- **User Goals:** Browse, search, upload, inspect, and reuse media assets across articles.
- **Key Features:**
  - Responsive asset grid with thumbnail previews and file metadata.
  - Direct drag-and-drop upload zone with client-side file validation (JPEG, PNG, WebP, AVIF, GIF <= 10MB; SVG disallowed).
  - Asset Detail Drawer: Edit accessibility `alt` text, caption/photojournalism credit, focal point coordinate selector, file size, dimensions, and generated variant URLs.
  - Usage tracker indicating which dispatches reference the asset.
  - Empty state with clear dropzone and accessibility checklist.

#### Screen 3.1.6: Taxonomy & Governance Views (`/admin/collections/categories`, `tags`, `users`)
- **User Goals:** Maintain editorial coherence, taxonomy structure, and team permissions.
- **Categories:** List and edit topical categories with name, unique slug, and editorial description.
- **Tags:** Indexing tags with post counts and slug normalization.
- **User Directory:** Team management displaying full name, role badge (`Author`, `Editor`, `Admin`), email, and published story count. Self-service profile editing for individual contributors.

---

### 3.2. Public Publishing Experience (Reader)

The public publishing experience is the showcase of Foundry Studio's editorial quality.

#### Screen 3.2.1: Publication Front Page (`/`)
- **User Goals:** Discover top stories, understand editorial hierarchy, browse topical categories, and read latest dispatches.
- **Layout & Structure:**
  - **Masthead:** Grand editorial newspaper masthead with date stamp, weather/edition indicator, and authoritative `BrandLockup` (`FOUNDRY STUDIO / by DevCrafters`).
  - **Category Navigation (`CategoryNav`):** Horizontal scrollable section pill navigation with active "Front Page" indicator (`aria-current="page"`).
  - **Hero Lead Story:** Asymmetric 2-column featured dispatch with large headline (`text-display`), high-resolution featured image with focal crop, standfirst excerpt with flame orange border accent, author byline, date, and reading time pill.
  - **Secondary Feature Grid:** 3-column dispatches grid with balanced typography, category tags, standfirsts, and reading times.
  - **Section Curations:** Grouped dispatches by category (e.g., Architecture, Systems, Investigations).
  - **Footer:** Deep editorial signature with parent credit, category links, accessibility statement, and copyright.

#### Screen 3.2.2: Article Reading Experience (`/posts/[slug]`)
- **User Goals:** Immersive, distraction-free, accessible reading of long-form journalism.
- **Layout & Structure:**
  - **Header Meta Row:** Primary category tag, published date, author name, reading time badge (`"5 min read"`).
  - **Headline (`text-h1`):** `Newsreader` serif, line-height 1.15, max 24ch measure.
  - **Standfirst:** Italicized summary lead with 3px DevCrafters Flame Orange left rule.
  - **Featured Media:** Full-width or inline editorial image with accessible caption and photographer attribution.
  - **Article Body:** Constrained reading column (max `68ch`), classic print drop cap on opening paragraph, 1.8 line-height, styled blockquotes with subtle canvas tint.
  - **Tags Row:** Categorical indexing chips linked to tag archives.
  - **Author Bio Box:** Mini author attribution card with name, role, and dispatches link.
  - **Related Dispatches Section:** 3-column grid of related published stories in matching categories, strictly isolated via `getPublicPostWhere(now)`.

#### Screen 3.2.3: Category & Tag Archives (`/category/[slug]`, `/tag/[slug]`)
- **User Goals:** Deep-dive into a specific beat, topic, or series.
- **Layout:** Section header with category name, editorial description, active category filter highlight, and responsive dispatch grid with pagination.

#### Screen 3.2.4: Author Archive (`/author/[id]`)
- **User Goals:** View all stories authored by a specific journalist or contributor.
- **Layout:** Author profile header (name, role, story count) and reverse-chronological list of published stories. Strictly enforces published-content eligibility.

#### Screen 3.2.5: Search & 404 Experience (`/search`, `/_not-found`)
- **User Goals:** Recover from broken links or find specific stories.
- **Layout:** Restrained editorial 404 page ("Dispatch Not Found") with search input and links to recent front-page dispatches.

---

## 4. Architecture Evaluation & Recommendation

### 4.1. The Architecture Dilemma
Foundry Studio needs to look and feel like a proprietary, custom-built product, yet avoid discarding the battle-tested PostgreSQL relational persistence, Drizzle migrations, draft isolation, role-based access control, and Lexical rich-text AST pipeline provided by Payload CMS 3.x.

We evaluated three potential architectural approaches:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Architectural Options                                   │
├─────────────────────────┬───────────────────────────────┬──────────────────────────────┤
│ Option A:               │ Option B:                     │ Option C (Recommended):      │
│ Pure Payload Admin View │ Completely Independent Studio │ Hybrid Proprietary Engine    │
│ Customization           │ Next.js App                   │ (Payload Core + Studio Shell)│
├─────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Keep standard Payload   │ Build bespoke `/studio` app   │ Retain Payload collections,  │
│ admin, customize via    │ using Next.js App Router and  │ ORM, and Local API. Build a  │
│ components & CSS.       │ Payload Local API exclusively.│ proprietary Studio UI shell  │
│                         │ Disable /admin completely.    │ using Payload 3.x Custom     │
│                         │                               │ Views and Root Components.   │
└─────────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

### 4.2. Option Trade-Off Analysis

#### Option A: Pure Payload Admin Customization
- **Mechanism:** Use `admin.components.graphics`, `admin.components.Nav`, `admin.components.views`, and `custom.scss` inside Payload's existing Admin UI.
- **Advantages:** Smallest initial code footprint; zero re-implementation of table pagination or form states.
- **Drawbacks:** Trapped within Payload's internal React component tree and DOM conventions. Highly susceptible to upstream layout changes in minor Payload versions; difficult to achieve a truly distinctive newsroom feel.

#### Option B: Completely Independent Next.js Studio (`/studio`)
- **Mechanism:** Disable Payload Admin (`admin: { disable: true }` or delete `app/(payload)/admin`). Build a 100% custom React/Next.js dashboard at `/studio` calling `getPayload()` via Server Actions.
- **Advantages:** 100% design autonomy. Zero Payload UI artifacts.
- **Drawbacks:** Huge maintenance burden. Requires re-implementing user authentication sessions, live Lexical editor client state, complex relationship select pickers, focal point selectors, and locked-document concurrency. High risk of introducing security bugs in session handling.

#### Option C: Hybrid Proprietary Engine (Recommended)
- **Mechanism:**
  1. **Retain Payload CMS 3.x as the Headless Core:** Keep all collections (`Posts`, `Categories`, `Tags`, `Media`, `Users`), Drizzle ORM migrations, access control hooks, and API endpoints.
  2. **Replace Admin Navigation & Header:** Implement a custom `admin.components.Nav` and custom `admin.components.header` providing a bespoke DevCrafters Studio shell with dark/light theme controls, desk metrics, and newsroom shortcuts.
  3. **Custom Editorial Dashboard (`admin.components.views.dashboard`):** Replace Payload's default collection card list with a custom newsroom dashboard view featuring active pipelines, scheduled release timers, and quick dispatches.
  4. **Enhanced Document Controls & Live Preview:** Inject custom header controls (`admin.components.actions`) for one-click split-screen reader previews and publication transitions.
  5. **Bespoke Public Frontend:** Completely custom Next.js App Router implementation (`src/app/(frontend)`) with zero Payload UI dependencies.
- **Why Option C is Superior:** It delivers **100% proprietary brand identity** where users interact, while maintaining **100% security, migration compatibility, and zero code duplication** on the complex CMS backend.

### 4.3. Verified Extension APIs & Code Locations (Technical Audit)
Our repository inspection confirmed the following exact extension points in `@payloadcms/next` and `@payloadcms/ui` (v3.91.0):

| Target Feature | Payload Extension Point | Verified Code Location | Compatibility / Status |
| :--- | :--- | :--- | :--- |
| **Studio Navigation** | `admin.components.Nav` | `node_modules/payload/dist/config/types.d.ts:745` | Replaces standard sidebar completely with a custom Server Component. |
| **Global Desk Header** | `admin.components.header` | `node_modules/payload/dist/config/types.d.ts:736` | Renders above admin views across all screens. |
| **Newsroom Dashboard** | `admin.components.views.dashboard` | `node_modules/payload/dist/config/types.d.ts:770` | Replaces default collection card grid with custom newsroom view. |
| **Document Actions** | `admin.components.actions` | `node_modules/payload/dist/config/types.d.ts:693` | Mounts custom split-preview and workflow triage buttons in top right. |
| **Collection Views** | `collection.admin.components.views.list` | `node_modules/payload/dist/collections/config/types.d.ts:344` | Replaces or augments collection list view without breaking data layer. |
| **Import Map Generation** | `payload generate:importmap` | `src/app/(payload)/admin/importMap.js` | Built-in CLI generator auto-resolves TS aliases (`@/components/...`). |

### 4.4. Preview Feasibility & Security Architecture

1. **Secret Encapsulation (Zero Client Exposure):**
   - The preview secret (`PREVIEW_SECRET`) must **never** be injected into client-side bundles or constructed in browser JavaScript (`?secret=${...}`).
   - **Mechanism:** When the user clicks "Preview" inside the Studio desk, a Next.js Server Action running server-side calls `payload.auth({ headers })` to verify the authenticated user session. Upon authorization, the Server Action enables Next.js Draft Mode (`draftMode().enable()`), issuing the signed, encrypted `__prerender_bypass` session cookie directly to the browser.
   - The browser is then directed to `/posts/${slug}` without passing any secret tokens in the URL or history.

2. **Split-Pane (Same-Origin Iframe) Feasibility:**
   - **Security Headers Verified:** Inspection of `next.config.ts` confirms that both `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'` are enforced.
   - **Feasibility:** Because the studio desk (`/admin`) and the reader route (`/posts/${slug}`) share the exact same origin (`http://127.0.0.1:3000` or the production domain), same-origin embedding inside an `<iframe>` is **100% permitted by the browser**.
   - **Clickjacking Protection:** Third-party websites remain strictly prohibited from embedding Foundry Studio pages by `frame-ancestors 'self'`.
   - **Cookie Sharing:** Same-origin iframes automatically inherit the `__prerender_bypass` and `payload-token` cookies, enabling the reader Server Component to verify authorization and render unpublished content seamlessly.

### 4.5. Search Strategy & Database Implications

1. **Current In-Process Querying (Payload Baseline):**
   - Can query `title` and `excerpt` using Payload's `where: { or: [{ title: { like: query } }, { excerpt: { like: query } }] }`.
   - Maps to SQL `ILIKE '%query%'` in `@payloadcms/db-postgres`.
   - **Limitations:** Cannot search rich text AST content (JSONB column); cannot utilize standard B-tree indexes; lacks relevance scoring and word stemming.

2. **PostgreSQL Native Full-Text Search (Target Architecture):**
   - **Mechanism:** PostgreSQL includes full-text search natively (`tsvector`, `tsquery`, GIN indexes) with zero external service requirements (preserving the ₹0 budget constraint).
   - **Searchable Fields:**
     - `title` (Weight 'A' — highest relevance)
     - `excerpt` / standfirst (Weight 'B')
     - Plain text extracted from Lexical AST (Weight 'C')
     - Associated Category and Tag names (Weight 'B')
   - **Strict Publication Invariant:** All public search queries must strictly append `getPublicPostWhere(now)` (`status = 'published' AND publishedAt <= now`) to mathematically prevent unpublished drafts or scheduled articles from appearing in search results.
   - **Migration Requirements:** A future Drizzle migration will add a generated `tsvector` column and a GIN index (`CREATE INDEX idx_posts_search ON posts USING GIN(...)`). No migration is executed in this discovery milestone.

---

## 5. Phased Implementation Roadmap

In accordance with [ADR-0004](adr/0004-editorial-workspace-architecture.md), the revamp is structured into discrete, verifiable implementation milestones:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-005A: Revamp Discovery & Specification] (Complete)                       │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-005B: Technical Feasibility & Architectural Validation] (Current)        │
│  - Extension point audit & import map verification                             │
│  - Preview secret encapsulation & iframe security analysis                     │
│  - Search feasibility & ADR-0004 publication                                    │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-006: Studio Navigation Shell & Desk Header]                             │
│  - Custom AdminNav component replacing default Payload sidebar                  │
│  - Studio header with desk metrics and brand lockup                             │
│  - Theme tokens & layout styling via custom.scss                                │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-007: Editorial Newsroom Dashboard View]                                  │
│  - Custom dashboard view (replaces generic collection cards)                    │
│  - Pipeline queues: Needs Review, Scheduled Releases, Recent Dispatches        │
│  - One-click workflow triage actions                                            │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-008: Article Authoring Desk & Split Live Preview]                        │
│  - Two-column writing environment layout                                        │
│  - Character/word/reading-time ergonomics HUD                                   │
│  - Integrated split-screen live preview runner                                  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-009: Public Reader Redesign & Beat Archives]                             │
│  - Broadsheet editorial homepage with asymmetric hero                           │
│  - Author archive route (`/author/[id]`) with publication boundary isolation    │
│  - Search and 404 editorial recovery experience                                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [FS-UI-010: Comprehensive WCAG 2.2 AA & Responsive Certification]               │
│  - Automated axe-core accessibility regression suite                            │
│  - Responsive certification across 375px, 768px, 1280px, 1920px                 │
│  - Keyboard navigation and screen reader audits                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Risk Assessment & Mitigation Matrix

| Risk / Failure Mode | Likelihood | Impact | Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **Payload Upstream Breaking Changes** | Medium | High | Rely strictly on documented Payload 3.x component extension points (`admin.components.views`, `admin.components.Nav`, `importMap.js`). Never patch node_modules or use brittle CSS class selectors that rely on minified hash names. |
| **Draft / Scheduled Content Leakage** | Low | Critical | Shared public invariant (`getPublicPostWhere(now)`) remains the immutable single source of truth for all public and reader endpoints. Validated via automated integration tests. |
| **Performance Degradation from Rich Custom Views** | Low | Medium | Custom admin components are implemented as React Server Components (RSC) by default. Client state is isolated to interactive leaves. |
| **Accessibility Regressions in Custom Editor** | Low | High | Enforce WCAG 2.2 AA contrast standards (minimum 4.5:1), visible 2px focus rings (`:focus-visible`), and programmatically linked labels across all custom forms. |
| **Scope Creep into Multi-Tenancy / Billing** | Medium | Medium | Strict phase boundaries in `AGENTS.md` and `docs/ROADMAP.md`. Commercial billing and multi-tenant routing remain deferred until SaaS transformation milestone. |

---

## 7. Review Gate & Verification Checklist

Before any implementation milestone is authorized:
- [x] Discovery audit complete across all collections, routes, and Payload 3.x capabilities.
- [x] Product positioning updated to proprietary platform by DevCrafters.
- [x] Public copy sanitized of "open-source platform" descriptions while preserving required legal notices.
- [x] Screen inventory specified with user goals, layout hierarchy, and accessibility rules.
- [x] Architecture evaluation documents why Option C (Hybrid Proprietary Engine) is selected.
- [x] Phased roadmap established with small, verifiable milestones.
- [x] Zero application code changes executed in this specification milestone.
