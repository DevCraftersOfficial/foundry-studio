# ADR-0004: Editorial Workspace Architecture & Customization Strategy

- **Status:** Accepted
- **Date:** 2026-10-23
- **Deciders:** Foundry Studio Engineering & DevCrafters Architecture
- **Consulted:** `AGENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_REVAMP_SPEC.md`

---

## 1. Context and Problem Statement

Foundry Studio is repositioning from a lightly customized Payload CMS installation into a distinctive, proprietary editorial publishing product by DevCrafters. 

We must determine the safest, most maintainable architectural strategy to deliver a proprietary, newsroom-grade interface for content authors and editors while retaining Payload CMS 3.x and PostgreSQL as the core backend engine.

### Core Requirements
1. **Proprietary Editorial Identity:** The workspace must look and feel like a custom-crafted newsroom tool (Foundry Studio by DevCrafters), not a stock headless CMS admin.
2. **Security & Authorization Invariants:** All server-side access controls, role-based permissions (`Author`, `Editor`, `Admin`), draft isolation rules, and preview security must remain strictly intact.
3. **Ergonomic Continuity:** Authors and editors must retain high-grade rich-text editing (Lexical AST), relationship picker mechanics, asset focal cropping, locked-document concurrency, and field validation.
4. **Budget & Dependency Constraint:** Strict ₹0 development budget; zero commercial SaaS dependencies; minimal maintenance overhead for minor/patch upgrades of underlying libraries.

---

## 2. Decision Drivers

- **Maintainability & Upgrade Compatibility:** Avoiding fragile DOM monkey-patching or hacking Payload internals that break during minor `@payloadcms/*` updates.
- **Security & Concurrency Safety:** Not re-implementing authentication sessions, password hashing, or document takeover locking from scratch.
- **Development Velocity & Scope Control:** Delivering maximum brand and editorial value without re-writing thousands of lines of form state management and file upload pipelines.

---

## 3. Considered Options

### Option A: Pure Global CSS / DOM Overrides
- **Approach:** Apply aggressive custom CSS and script injection over the stock Payload Admin panel without replacing component trees.
- **Rejected:** Highly brittle. Class names and DOM structures in `@payloadcms/ui` are subject to internal refactoring. Global overrides fail to deliver custom workflows (e.g. newsroom pipelines or live writing HUDs).

### Option B: Standalone Next.js App (`/studio`) Disabling Payload Admin
- **Approach:** Disable Payload Admin entirely (`admin: { disable: true }`). Build a 100% custom Next.js App Router application under `/studio` interacting with Payload purely via `getPayload({ config })` and Server Actions.
- **Rejected:** High maintenance overhead and severe risk of security/state regressions. Requires writing custom implementations for:
  - Complex Lexical rich-text editing with upload/link drawers.
  - Multi-relation search pickers (`Categories`, `Tags`, `Media`, `Users`).
  - Media focal-point crop selectors and chunked file uploads.
  - Locked-document concurrency (`payload-locked-documents`).
  - Session expiration and token refresh handling.

### Option C: Hybrid Proprietary Engine via Payload 3.x Component Extension Points (Selected)
- **Approach:** Retain Payload CMS 3.x as the headless core. Utilize Payload's official, first-class component replacement extension points:
  1. `admin.components.Nav`: Completely replaces default sidebar with a custom DevCrafters Studio navigation shell.
  2. `admin.components.header`: Injects a custom studio desk header with system status and desk metrics.
  3. `admin.components.views.dashboard`: Completely replaces the stock collection card grid with a newsroom desk dashboard.
  4. `collection.admin.components.views`: Extends or replaces specific collection lists or document action headers where custom workflows are required.
  5. `admin.livePreview` & Server Actions: Integrates one-click Draft Mode previews without exposing secrets.
  6. `src/app/(payload)/custom.scss`: Enforces brand design tokens (`#EA580C`, obsidian ink, warm canvas) natively.

---

## 4. Decision Outcome

**Adopted: Option C (Hybrid Proprietary Engine).**

### Key Justifications
1. **100% Proprietary Presentation:** The navigation shell, desk header, newsroom dashboard, and brand accents are completely custom React components, eliminating the generic CMS appearance.
2. **Zero Maintenance Regressions on Complex Form Controls:** Lexical rich-text editing, media upload pipelines, and document locking remain natively managed by Payload's proven engine.
3. **Upgrade Durability:** Uses Payload's official `importMap.js` generator and TypeScript interfaces (`AdminViewConfig`, `CustomComponent`).
4. **Security Isolation:** Session cookies, RBAC hooks, and draft isolation remain strictly enforced by Payload core.

---

## 5. Preview & Search Strategy Decisions

### 5.1. Preview Architecture
- **Dual-Mode Previews:** Supported in both split-pane (same-origin `iframe`) and separate-tab modes.
- **Secret Encapsulation:** `PREVIEW_SECRET` is never exposed to browser client JavaScript. A Next.js Server Action verifies `payload.auth()` server-side and enables Next.js Draft Mode (`draftMode().enable()`), setting the signed `__prerender_bypass` cookie.
- **Iframe Compatibility:** Current security headers (`X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`) explicitly permit same-origin split-pane iframes while blocking clickjacking from third-party domains.

### 5.2. Search Strategy
- **Baseline (FS-UI-006):** In-process Payload API querying across `title` and `excerpt` with strict public eligibility filtering (`getPublicPostWhere(now)`).
- **Production Full-Text Search (Future Phase):** PostgreSQL native `tsvector` with GIN indexing generated via a Drizzle migration. Zero third-party service cost (Algolia/Elasticsearch rejected).

---

## 6. Implementation Phasing

1. **FS-UI-005B (Current):** Technical feasibility, security audit, and documentation updates.
2. **FS-UI-006:** Studio Navigation Shell (`admin.components.Nav`) & Desk Header.
3. **FS-UI-007:** Editorial Newsroom Dashboard (`admin.components.views.dashboard`).
4. **FS-UI-008:** Article Authoring Desk & Live Preview Integration.
5. **FS-UI-009:** Public Reader Overhaul & Author Archives.
6. **FS-UI-010:** Automated WCAG 2.2 AA Accessibility & Responsive Certification.
