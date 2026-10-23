# Foundry Studio — Phased Development Roadmap

This document outlines the phased development roadmap, milestone dependencies, measurable acceptance criteria, review gates, and deferred capabilities for Foundry Studio.

---

## 1. Roadmap Overview & Milestones

```
[ FS-001: Foundation ]
         │
         ▼
[ FS-002: Core Scaffolding & Local DB ]
         │
         ▼
[ FS-003: Content Models & Media Pipeline ]
         │
         ▼
[ FS-004: Editorial Lifecycle & Previews ]
         │
         ▼
[ FS-005: Public Reader & SEO Engine ]
         │
         ▼
[ FS-006: Deployment Validation & Production Hardening ]
         │
         ▼
[ Future: SaaS & Multi-Tenancy ]
```

---

## 2. Milestone Details & Acceptance Criteria

### Milestone FS-001: Project Foundation & Engineering Governance
- **Status:** Complete (Accepted)
- **Dependencies:** None
- **Objective:** Establish the project repository foundation, conventions, security constraints, and comprehensive documentation without introducing premature code.

---

### Milestone FS-002: Core Scaffolding & Local Database Environment
- **Status:** Complete (Accepted, including FS-002-V and FS-002.5)
- **Dependencies:** FS-001 sign-off
- **Objective:** Initialize Next.js with TypeScript and Tailwind CSS, embed Payload CMS 3.x, and provide a containerized local PostgreSQL database via Docker Compose.

---

### Milestone FS-003: Content Models & Media Management Pipeline
- **Status:** Complete & Ready for Review
- **Dependencies:** FS-002.5 sign-off
- **Objective:** Implement core publishing collections (`Posts`, `Categories`, `Tags`, `Media`, `Users`) with robust validation, publishing lifecycle rules, database migrations, and image processing.
- **Measurable Acceptance Criteria:**
  1. TypeScript collection schemas configured for `Posts`, `Categories`, `Tags`, `Media`, and `Users`.
  2. Rich text editor configured (Lexical) storing structured JSON AST safely without unsafe HTML rendering.
  3. Media upload collection with mime-type validation (JPEG, PNG, WebP, AVIF, GIF — SVG strictly rejected to eliminate stored XSS vectors), 10MB file limit, and automatic variant generation (thumbnail, card, feature).
  4. Database migration generated (`20261022_170247_add_publishing_domain`) and applied safely with complete idempotency.
  5. Publishing lifecycle security enforced: Drafts private by default, scheduled posts restricted until publication date, and author email privacy protected.
  6. Integration test suite passing with 18 verified tests across models, security boundaries, and upload limits.
- **Review Gate:** CTO sign-off on content models, migration, and access control verification.

---

### Milestone FS-004: Editorial Workflow & Publishing Lifecycle
- **Status:** Complete (Implemented & Verified)
- **Dependencies:** FS-003
- **Objective:** Establish formal editorial states (`Draft`, `In Review`, `Scheduled`, `Published`, `Archived`), scheduling capabilities, and live draft previews.
- **Measurable Acceptance Criteria:**
  1. Role-based access controls separating `Author`, `Editor`, and `Admin` permissions. (Verified)
  2. Workflow state machine preventing non-editorial roles from direct publishing. (Verified)
  3. Author draft submission to `in_review` and author recall to `draft`. (Verified)
  4. Editor and Admin approval gates, author reassignment, and archiving. (Verified)
  5. Deterministic initial administrator provisioning and idempotent CLI seed (`seed:admin`). (Verified)
  6. Non-destructive migration `20261022_183000_add_editorial_workflow` applied. (Verified)
  7. 43 integration tests passing across all suites. (Verified)
- **Review Gate:** CTO sign-off on RBAC state machine, taxonomy governance, and migration safety.

---

### Milestone FS-005: Public Reader Polish, SEO Validation, and Accessibility Audits
- **Status:** Complete (Implemented & Verified)
- **Dependencies:** FS-004
- **Objective:** Verify and finish the public publishing experience with semantic markup, robust SEO/OpenGraph metadata, sitemap/robots discoverability, WCAG 2.2 AA accessibility, and content rendering safety.
- **Measurable Acceptance Criteria:**
  1. Responsive editorial homepage featuring Swiss typography, single semantic `<h1>`, skip link, masthead, category nav, and responsive image sizing. (Verified)
  2. Article detail pages with dynamic SEO metadata, OpenGraph tags, Twitter cards, canonical URLs, and schema.org `NewsArticle` JSON-LD structured data. (Verified)
  3. Safe Lexical rich text AST rendering component with link URL protocol sanitization (blocking `javascript:`/dangerous schemes) and heading demotion to preserve single-`<h1>` document outline. (Verified)
  4. Dynamic `sitemap.xml` strictly indexing published posts (`publishedAt <= now`) and categories while strictly excluding drafts, in-review, archived, and future-scheduled posts. (Verified)
  5. Dynamic `robots.txt` configured with public index rules and disallowing admin, preview, and API routes. (Verified)
  6. Category archive views with dynamic filtering and published-state enforcement. (Verified)
  7. Accessibility enhancements: skip-to-content link, high-contrast `:focus-visible` rings, screen reader landmarks, and reduced-motion support. (Verified)
  8. 83 automated integration tests passing across 5 test suites (`npm run test:int`), 0 lint warnings, 0 type errors, clean Next.js Turbopack build, and live browser audit verified. (Verified)
- **Review Gate:** CTO sign-off on reader experience, SEO engine, and accessibility polish.

---

### Milestone FS-006: Production Hardening & Deployment Validation
- **Status:** Complete (Implemented & Verified — Awaiting CTO Launch Review)
- **Dependencies:** FS-005
- **Objective:** Establish and validate single-host production deployment baseline, harden multi-stage container images, implement strict centralized server-side environment validation, enforce security headers and health checks, and document operational runbooks.
- **Measurable Acceptance Criteria:**
  1. Centralized server-side environment validator (`src/lib/env.ts`) rejecting missing/short secrets and localhost/wildcard URLs in production. (Verified)
  2. Multi-stage Node 22 Alpine `Dockerfile` with Next.js standalone output and unprivileged user execution (`USER nextjs`, UID 1001). Image content size measured at 91.9 MB (disk usage: 363 MB). (Verified)
  3. Single-host production orchestration baseline (`docker-compose.prod.yml`) with private PostgreSQL, persistent media volume, and standalone migration runner. (Verified)
  4. Operational disaster recovery runbook (`docs/RUNBOOK_DISASTER_RECOVERY.md`) covering pre-deployment migrations, PostgreSQL `-Fc` backups, media tarballs, and rollback caveats. (Verified)
  5. Configurable email delivery adapter (`src/lib/email.ts`) falling back to console in development and visibly rejecting sends in production when unconfigured. (Verified)
  6. Operational security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS toggle) and zero-leak health probe (`/api/health`). (Verified)
  7. Automated verification: 97 integration tests passing across 6 test suites (`npm run test:int`), `npx tsc --noEmit` clean (0 errors), `npm run lint` clean (0 errors, 0 warnings), Next.js standalone build passing, and live endpoint smoke tests verified (all returning HTTP 200). (Verified)
  8. FS-006-V Verification Gate: CSP tightened without `'unsafe-eval'`, health payload minimized to status/database, migration failure gating verified, network loopback binding verified, and empirical backup/restore drill executed. (Verified)
- **Review Gate:** Formal CTO production review before live public hosting deployment.

---

### Milestone FS-UI-001: DevCrafters Brand & Foundry Studio UI/UX Audit
- **Status:** Complete (Discovery & Planning Accepted)
- **Dependencies:** FS-006
- **Objective:** Audit live DevCrafters brand deployment and existing Foundry Studio repository; produce concrete design system recommendations and phased UI/UX roadmap for endorsed product relationship.
- **Measurable Acceptance Criteria:**
  1. Full inspection of DevCrafters brand site (`https://dev.devcrafters-website.pages.dev/`) capturing palette, typography (`Manrope` + `JetBrains Mono`), layout conventions, and visual artifacts. (Verified)
  2. Repository baseline audit establishing missing font assets, system fallbacks, and unbranded Payload Admin. (Verified)
  3. Concrete design system proposals with verified contrast analysis and OFL-1.1 font licensing. (Verified)
  4. 4-phase bounded implementation roadmap defined. (Verified)
- **Review Gate:** CTO approval of Phase 1 implementation.

---

### Milestone FS-UI-002: Design Tokens, Typography & Brand Primitives (Phase 1)
- **Status:** Complete & Ready for Review
- **Dependencies:** FS-UI-001 sign-off
- **Objective:** Implement zero-runtime self-hosted font architecture (`Newsreader`, `Manrope`, `JetBrains Mono`), update CSS design tokens, build accessible `BrandLockup` and `StatusBadge` primitives, and update living design system documentation.
- **Measurable Acceptance Criteria:**
  1. Build-time font bundling via `next/font/google` producing local `.woff2` files with 0 external runtime requests. (Verified)
  2. CSS variables updated to warm paper canvas (`#FAF8F5`), obsidian ink (`#0F172A`), DevCrafters orange (`#EA580C`, 3.56:1 for UI non-text elements), and accessible text orange (`#C2410C`, 4.89:1 for text). (Verified)
  3. Reusable accessible `BrandLockup` component supporting `masthead`, `footer`, `compact`, and `badge` variants with pure SVG mark. (Verified)
  4. Reusable accessible `StatusBadge` component supporting all 5 publishing lifecycle states (`draft`, `in_review`, `scheduled`, `published`, `archived`) with verified >= 6.37:1 contrast. (Verified)
  5. 110 automated tests passing across 7 test suites (`npm run test:int`), `npx tsc --noEmit` clean, `npm run lint` clean, production build passing, and live browser audit verified. (Verified)
- **Review Gate:** CTO sign-off on Phase 1 primitives before authorizing Phase 2 (Public Reader Experience & Article Polish).

---

### Milestone FS-UI-003: Public Reader Experience & Article Template Polish (Phase 2)
- **Status:** Complete & Ready for Review
- **Dependencies:** FS-UI-002
- **Objective:** Polish front-page hero hierarchy, active category filter pill styling, article template typography (drop caps, reading time), and category-filtered related stories.
- **Measurable Acceptance Criteria:**
  1. Accessible `CategoryNav` component with explicit `aria-current="page"` and high-contrast pill styling (`#0F172A` / `#FAFAFA`). (Verified)
  2. Deterministic reading time utility (`calculateReadingTime`) based on 200 WPM with recursive Lexical AST support and empty safety. (Verified)
  3. Related stories section dynamically querying up to 3 published articles in matching categories, strictly isolated via `getPublicPostWhere(now)` and `{ id: { not_equals: post.id } }`. (Verified)
  4. Restrained editorial refinements: print drop cap on opening paragraph, 3px DevCrafters orange border on standfirst, WCAG-compliant blockquote styling. (Verified)
  5. 116 automated integration tests passing across 8 test files (`npm run test:int`), `npx tsc --noEmit` clean, `npm run lint` clean, standalone Turbopack build passing, and live browser audit verified. (Verified)
- **Review Gate:** CTO sign-off on Phase 2 before authorizing Phase 3 (Editorial Workspace & Admin Login Customization).

---

### Milestone FS-UI-004: Editorial Workspace & Admin Login Customization (Phase 3)
- **Status:** Complete (Accepted)
- **Dependencies:** FS-UI-003
- **Objective:** Brand Payload CMS administrative login with DevCrafters endorsed identity, add Studio icon in StepNav, customize sidebar navigation, and provide contextual editorial workflow guidance.
- **Measurable Acceptance Criteria:**
  1. Accessible SVG `AdminLogo` component with DevCrafters Hexagon mark (`#EA580C`) and dark ink wordmark on login screen (`/admin/login`). (Verified)
  2. Compact 25×25 SVG `AdminIcon` in StepNav and AppHeader breadcrumbs. (Verified)
  3. Reusable `AdminNavBrand` anchored via `beforeNavLinks` at top of sidebar navigation. (Verified)
  4. Restrained `custom.scss` stylesheet applying DevCrafters Flame Orange focus rings and active navigation indicators without brittle DOM hacks. (Verified)
  5. Enhanced field workflow guidance on `Posts.status`, `Posts.publishedAt`, `Posts.author`, and `Media.alt`. (Verified)
  6. Automated integration tests in `tests/int/payload-admin-branding.int.spec.ts` (128/128 suite tests passing), `npx tsc --noEmit` clean, `npm run lint` clean, standalone build passing, and browser audit verified with screenshots. (Verified)
- **Review Gate:** CTO sign-off on Phase 3 completed.

---

### Milestone FS-UI-005A: Foundry Studio Full Product Revamp — Discovery & Specification
- **Status:** Complete & Ready for Review
- **Dependencies:** FS-UI-004 sign-off
- **Objective:** Reposition Foundry Studio as a distinctive, proprietary publishing product by DevCrafters with its own design language and complete editorial experience; specify full screen inventory and architectural evaluation in `docs/UI_REVAMP_SPEC.md`.
- **Measurable Acceptance Criteria:**
  1. Product positioning updated to proprietary publishing product with potential commercial licensing; public copy sanitized of open-source descriptions while preserving underlying dependency notices. (Verified)
  2. Complete screen inventory specified for both Editorial Workspace (Studio) and Public Publishing Experience (Reader). (Verified)
  3. Architectural evaluation completed (Option A: pure Payload Admin vs. Option B: bespoke Next.js studio vs. Option C: hybrid proprietary engine). Option C recommended and documented. (Verified)
  4. Phased dependency-ordered roadmap defined across 5 discrete, verifiable implementation milestones. (Verified)
  5. Zero application code or database modifications introduced during discovery. (Verified)
- **Review Gate:** CTO review and approval of `docs/UI_REVAMP_SPEC.md` before authorizing implementation.

---

### Milestone FS-UI-005B: Foundry Studio Full Redesign — Technical Feasibility
- **Status:** Complete (Feasibility & Architectural Analysis Accepted — Awaiting CTO Review)
- **Dependencies:** FS-UI-005A
- **Objective:** Determine the safest, maintainable way to replace generic Payload Admin experience with proprietary Foundry Studio interface; evaluate extension APIs, split-pane preview security, and PostgreSQL search feasibility; document findings in ADR-0004 and update technical specifications.
- **Measurable Acceptance Criteria:**
  1. Technical audit of installed Payload 3.91.0 and Next.js 15.3.6 extension APIs (`admin.components.Nav`, `header`, `views.dashboard`, `collection.admin.components.views.list`). (Verified)
  2. Preview security architecture validated: split-pane same-origin iframe permitted under existing `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'`; Next.js Server Action draft session activation eliminating client-side `PREVIEW_SECRET` leakage. (Verified)
  3. Search strategy documented: in-process Payload API `where` baseline with forward-compatible PostgreSQL `tsvector` GIN indexing under zero additional SaaS cost. (Verified)
  4. Architectural decision record created (`docs/adr/0004-editorial-workspace-architecture.md`) establishing Option C (Hybrid Proprietary Engine). (Verified)
  5. Specification and roadmap synchronized (`docs/UI_REVAMP_SPEC.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATE.md`). (Verified)
  6. Zero application code or database schema mutations executed. (Verified)
- **Review Gate:** CTO review and approval of technical feasibility report before authorizing FS-UI-006.

---

### Milestone FS-UI-006: Studio Navigation Shell & Desk Header
- **Status:** Complete (Implemented & Verified — Awaiting CTO Review)
- **Dependencies:** FS-UI-005B
- **Objective:** Implement proprietary Studio navigation (`admin.components.Nav`) and desk header (`admin.components.header`) replacing Payload's default sidebar with the DevCrafters Studio shell.
- **Measurable Acceptance Criteria:**
  1. Custom Server Component registered at `admin.components.Nav` (`StudioNav`) wrapping `StudioNavClient` in Payload native `NavWrapper` with full responsive mobile drawer support. (Verified)
  2. Custom Server Component registered at `admin.components.header` (`StudioHeader`) rendering the bespoke Studio Desk Masthead with live publishing indicator, environment badge, role pill, and integrated Draft Mode exit link. (Verified)
  3. Role-based visibility enforced as a usability measure: Admins see system governance and fallback tables; Editors see editorial desks and taxonomy; Authors see Core Editorial Desks. (Verified)
  4. Standard UI states handled gracefully: Ideal authenticated workspace, Loading skeleton shimmer, and Restricted Workspace permission-denied box. (Verified)
  5. Administrative fallback link to standard Payload collection tables preserved. (Verified)
  6. 141 automated integration tests passing across 10 test suites (`npm run test:int`), `npx tsc --noEmit` clean (0 errors), `npm run lint` clean (0 errors, 0 warnings), Next.js Turbopack build passing, and live desktop/mobile browser audit verified. (Verified)
- **Review Gate:** CTO review and approval of FS-UI-006 before authorizing FS-UI-007.

---

### Milestone FS-UI-007: Editorial Newsroom Dashboard View
- **Status:** Complete (Implemented & Verified — Awaiting CTO Review)
- **Dependencies:** FS-UI-006 sign-off
- **Objective:** Replace generic Payload Admin collection-card landing page with a purpose-built editorial newsroom dashboard (`admin.components.views.dashboard`) featuring submission review queues, scheduled release countdowns, desk triage controls, and strict server-authorized queries.
- **Measurable Acceptance Criteria:**
  1. The `/admin` landing page renders the custom newsroom dashboard (`StudioDashboard`), completely replacing generic collection cards. (Verified)
  2. Server-side queries strictly enforce RBAC and author boundaries (`overrideAccess: false, user`): Authors only see their own drafts and in-review submissions; other authors' restricted content is never leaked. (Verified)
  3. Editors and Admins receive team-wide visibility: priority review queue (`Needs Review`), work-in-progress drafts, scheduled releases, and live dispatches. (Verified)
  4. Standard UI states handled gracefully: Ideal, Loading (shimmer skeleton loaders), Empty (3-step newsroom onboarding guidance), Error (actionable refresh button), and Permission-Denied (secure restricted workspace alert). (Verified)
  5. 4 KPI metric cards (Drafts, In Review, Scheduled, Live Dispatches) provide accurate publication velocity at a glance with zero polling or paid analytics. (Verified)
  6. Quick actions provide rapid navigation: `+ New Dispatch`, `Upload Media`, `All Dispatches`, `Categories`, `Topic Tags`, `Staff Directory` (Admin), and `Public Reader`. (Verified)
  7. Automated verification: 156 integration tests passing across 11 test suites (`npm run test:int`), `npx tsc --noEmit` clean (0 errors), `npm run lint` clean (0 errors, 0 warnings), Next.js standalone Turbopack build compiling cleanly, and live browser audit verified across desktop (1280×800) and mobile (375×812) viewports. (Verified)
- **Review Gate:** CTO review and approval of FS-UI-007 before authorizing FS-UI-008.

---

### Milestone FS-UI-008: Article Authoring Desk & Split Live Preview
- **Status:** Complete (Implemented & Verified — Awaiting CTO Review)
- **Dependencies:** FS-UI-007
- **Objective:** Create a premium, proprietary authoring experience native to Foundry Studio with a two-column authoring layout, real-time word-count & reading-time HUD, and secret-free dual-mode preview (split live preview and separate tab reader preview) while strictly preserving Payload's native Lexical editor, field validation, relationship drawers, authorization, and persistence behavior.
- **Measurable Acceptance Criteria:**
  1. Proprietary two-column authoring desk layout: focused central writing canvas (`title`, `slug`, `excerpt`, `content`) and metadata inspector sidebar (`status`, `publishedAt`, `author`, `featuredImage`, `categories`, `tags`) with seamless responsive stacking on mobile viewports. (Verified)
  2. Preserves Payload native form state, Lexical rich-text editor, validation, and relationship drawers using supported extension points (`admin.components.edit.beforeDocumentControls`). (Verified)
  3. Real-time word-count and reading-time HUD derived deterministically from Lexical AST via `calculateReadingTime` with accessible live region (`role="status"`, `aria-atomic="true"`). (Verified)
  4. Real-time persistence and lifecycle status indicators: `Saved to Desk`, `Saving...` (spinner), `Unsaved Changes` (pulsing amber dot), and `Read-Only` (padlock) with document workflow pills. (Verified)
  5. Dual-mode secure preview flow: Split-pane live preview (`isLivePreviewing`) with responsive breakpoints (Mobile 375px, Tablet 768px, Desktop 1280px) and Reader in separate tab (`POST /api/preview`) using session authentication and Next.js `draftMode().enable()`, strictly without exposing secrets in URLs, client code, or query strings. (Verified)
  6. Strict server-side RBAC and publication workflow boundaries preserved: authors can preview their own drafts, forbidden from previewing drafts of other authors (HTTP 403); editors and admins have team-wide preview. (Verified)
  7. Automated verification: 170 integration tests passing across 12 test suites (`npm run test:int`), `npx tsc --noEmit` clean (0 errors), `npm run lint` clean (0 errors, 0 warnings), Next.js standalone Turbopack build compiling cleanly, and live browser audit verified on desktop (1280×800) and mobile (375×812) viewports. (Verified)
- **Review Gate:** CTO review and approval of FS-UI-008 before authorizing FS-UI-009.

---

### Milestone FS-UI-009: Public Reader Redesign & Default Doodle Profile Avatars
- **Status:** Complete (Implemented & Verified — Awaiting CTO Review)
- **Dependencies:** FS-UI-008
- **Objective:** Complete the premium public publishing experience so the reader feels like a distinctive Foundry Studio product rather than a generic blog template. Implement broadsheet front-page hierarchy with asymmetric feature presentation, refined long-form reading typography, author archives (`/author/[id]`), topic tag archives (`/tag/[slug]`), server-side public search (`/search?q=...`), editorial 404 recovery, obsolete copy removal, and original AI-generated default doodle profile avatars.
- **Measurable Acceptance Criteria:**
  1. Redesigned public homepage featuring asymmetric broadsheet hierarchy: lead feature story, complementary secondary feature, multi-column dispatches grid with author attribution and reading times, and editorial beats taxonomy index. (Verified)
  2. Refined long-form article page: 68ch optical reading geometry, Newsreader serif typography, breadcrumbs, prominent author attribution card with doodle profile avatar, publication date, reading time pill, topic tags, and strictly eligible related dispatches. (Verified)
  3. Author archives implemented at `/author/[id]` with author profile header (doodle avatar, role badge, total stories count) and article card grid, strictly filtering out unpublished drafts. (Verified)
  4. Topic tag archives implemented at `/tag/[slug]` and category archives at `/category/[slug]` with published-state enforcement. (Verified)
  5. Server-side public search implemented at `/search?q=...` using Local API `like` queries across titles and excerpts, strictly constrained by `getPublicPostWhere(now)`, with empty query guidance, zero results state, and robots disallow to protect crawl budget. (Verified)
  6. Literary 404 recovery page implemented at `src/app/not-found.tsx` with search input and direct navigation links. (Verified)
  7. Strict publication eligibility invariant: drafts, in-review, scheduled, and archived posts strictly quarantined and prevented from leaking into search, author archives, tag archives, related stories, sitemaps, or structured data. (Verified)
  8. Two original AI-generated doodle profile avatars (`avatar-male.jpg`, `avatar-female.jpg`) created in Foundry Studio's palette, stored locally in `public/avatars/`, deterministically selected by persistent user ID parity (preserving custom avatars), and rendered accessibly with `decorative={true}` (`aria-hidden="true"`) across both Public Reader and Admin Studio surfaces. (Verified)
  9. Obsolete public product copy ("An Open-Source Editorial Publishing Platform") updated to "Editorial Publishing Platform" in brand lockup footer while preserving third-party open-source licensing. (Verified)
  10. Automated verification: 182 integration tests passing across 13 test suites (`npm run test:int`), `npx tsc --noEmit` clean (0 errors), `npm run lint` clean (0 errors, 0 warnings), Next.js standalone Turbopack build compiling cleanly, and live browser audit verified across desktop (1280×800) and mobile (375×812) viewports. (Verified)
- **Review Gate:** CTO review and approval of FS-UI-009 before authorizing FS-UI-010.

---

### Milestone FS-UI-010: Comprehensive WCAG 2.2 AA & Responsive Certification
- **Status:** Planned
- **Dependencies:** FS-UI-009
- **Objective:** Complete automated axe-core accessibility regression suite, keyboard navigation certification, and responsive verification across 375px, 768px, 1280px, and 1920px viewports.


---

## 3. Explicitly Deferred Capabilities (Post-MVP / SaaS Roadmap)

The following capabilities are out of scope for the MVP and explicitly deferred to the SaaS transformation phase:
- **Multi-Tenant Architecture:** Database-level tenant separation and tenant routing.
- **Billing & Subscription Management:** Stripe or payment gateway integration.
- **Custom Domain Automation:** Automated SSL certificate issuance for client custom domains.
- **Enterprise SSO:** SAML 2.0 / Okta integration.
- **AI Content Plugins:** Automated summary or translation generation.
- **Global Search Cluster:** Third-party managed search indices (Algolia / Meilisearch).

---

## 4. Testing and Review Gates Summary

| Gate | Check Type | Target Standard | Blocker Criteria |
| :--- | :--- | :--- | :--- |
| **Lint & Type Check** | Automated (`tsc`, `eslint`) | 0 errors, 0 warnings | Any type or lint failure blocks merge. |
| **Security Audit** | Automated (`npm audit`, secret scan) | 0 high/critical CVEs; 0 hardcoded secrets | Any secret detected blocks progress immediately. |
| **Database Migrations** | Deterministic runner | Clean up and down migrations | Schema drift or destructive unreviewed changes block execution. |
| **Visual & SEO Audit** | Lighthouse & browser test | SEO: 100, Performance: >90 | Accessibility or performance regressions block release. |
| **Milestone Sign-Off** | Architecture & Product Review | Meets 100% acceptance criteria | No milestone advancement without explicit CTO approval. |
