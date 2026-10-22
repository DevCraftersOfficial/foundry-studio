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
- **Status:** Complete & Ready for Review
- **Dependencies:** FS-UI-003
- **Objective:** Brand Payload CMS administrative login with DevCrafters endorsed identity, add Studio icon in StepNav, customize sidebar navigation, and provide contextual editorial workflow guidance.
- **Measurable Acceptance Criteria:**
  1. Accessible SVG `AdminLogo` component with DevCrafters Hexagon mark (`#EA580C`) and dark ink wordmark on login screen (`/admin/login`). (Verified)
  2. Compact 25×25 SVG `AdminIcon` in StepNav and AppHeader breadcrumbs. (Verified)
  3. Reusable `AdminNavBrand` anchored via `beforeNavLinks` at top of sidebar navigation. (Verified)
  4. Restrained `custom.scss` stylesheet applying DevCrafters Flame Orange focus rings and active navigation indicators without brittle DOM hacks. (Verified)
  5. Enhanced field workflow guidance on `Posts.status`, `Posts.publishedAt`, `Posts.author`, and `Media.alt`. (Verified)
  6. Automated integration tests in `tests/int/payload-admin-branding.int.spec.ts` (128/128 suite tests passing), `npx tsc --noEmit` clean, `npm run lint` clean, standalone build passing, and browser audit verified with screenshots. (Verified)
- **Review Gate:** CTO sign-off on Phase 3 before authorizing Phase 4 (Accessibility & Visual Regression Gating).

---

### Milestone FS-UI-005: Accessibility & Visual Regression Gating (Phase 4)
- **Status:** Planned
- **Dependencies:** FS-UI-004
- **Objective:** Complete automated WCAG 2.2 AA audit across responsive breakpoints and keyboard navigation flows.


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
