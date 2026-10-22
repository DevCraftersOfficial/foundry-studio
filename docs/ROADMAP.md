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
  3. Media upload collection with mime-type validation (JPEG, PNG, WebP, AVIF, GIF, SVG), 10MB file limit, and automatic variant generation (thumbnail, card, feature).
  4. Database migration generated (`20261022_170247_add_publishing_domain`) and applied safely with complete idempotency.
  5. Publishing lifecycle security enforced: Drafts private by default, scheduled posts restricted until publication date, and author email privacy protected.
  6. Integration test suite passing with 18 verified tests across models, security boundaries, and upload limits.
- **Review Gate:** CTO sign-off on content models, migration, and access control verification.

---

### Milestone FS-004: Editorial Workflow & Publishing Lifecycle
- **Status:** Planned
- **Dependencies:** FS-003
- **Objective:** Establish formal editorial states (`Draft`, `In Review`, `Published`, `Archived`), scheduling capabilities, and live draft previews.
- **Measurable Acceptance Criteria:**
  1. Role-based access controls separating `Author`, `Editor`, and `Admin` permissions.
  2. Workflow state machine preventing non-editorial roles from direct publishing.
  3. Version history and draft reversion functional.
  4. Real-time / live preview mode functional for draft content before publication.
  5. Content scheduling mechanism for future publication timestamps.
- **Review Gate:** End-to-end editorial review walk-through from author draft to scheduled publishing.

---

### Milestone FS-005: Public Reader Experience & SEO Engine
- **Status:** Planned
- **Dependencies:** FS-004
- **Objective:** Build the public-facing content publishing interface with fast Server Components, semantic markup, and automated SEO/OpenGraph metadata.
- **Measurable Acceptance Criteria:**
  1. Responsive, mobile-first public pages: Homepage / Article Feed, Category Filtering, Article Detail, Author Profile.
  2. Dynamic OpenGraph tags, JSON-LD structured data (Article schema), and canonical URLs.
  3. Next.js Server Components utilizing caching and on-demand revalidation.
  4. Lighthouse score audit: Performance >= 90, Accessibility >= 95, SEO = 100.
  5. Fully responsive UI designed with Tailwind CSS without generic aesthetic shortcuts.
- **Review Gate:** Automated Lighthouse audit pass and cross-browser rendering verification.

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
