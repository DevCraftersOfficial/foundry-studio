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
- **Status:** Planned
- **Dependencies:** FS-005
- **Objective:** Select and validate production hosting candidate (per ADR-0003), harden container images, verify zero-cost or approved budget constraints, and execute launch checklist.
- **Measurable Acceptance Criteria:**
  1. Multi-stage production `Dockerfile` with standalone Next.js output and non-root execution.
  2. Production deployment validated on approved infrastructure (Render / Fly.io / Self-hosted VPS).
  3. Database backup and restore runbook documented and tested.
  4. Security audit: HTTP security headers, CORS policies, rate limiting, and secret sanitization verified.
  5. Formal launch gate review completed with CTO.
- **Review Gate:** Formal CTO production acceptance sign-off.

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
