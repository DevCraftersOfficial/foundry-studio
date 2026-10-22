# ADR-0001: CMS and Application Architecture

- **Status:** Accepted (Planning Baseline)
- **Date:** 2026-10-22
- **Authors:** DevCrafters Architecture Team
- **Decision Owner:** CTO / Tech Lead

---

## 1. Context

Foundry Studio requires a modern web application framework and content management architecture to serve as a reusable publishing foundation for client projects and an eventual multi-tenant SaaS platform.

Key requirements include:
- A unified language ecosystem (TypeScript) from database layer to UI.
- Strong editorial controls with custom fields, drafts, live previews, and role-based permissions.
- High-performance, SEO-optimized public rendering with dynamic server rendering and static caching capabilities.
- Strict ₹0 initial budget constraint, eliminating paid CMS licenses or vendor lock-in.
- Developer flexibility to extend schemas, customize editorial UI, and tailor APIs.

---

## 2. Decision

We adopt a unified full-stack architecture pairing **Next.js (App Router)** with **Payload CMS 3.x** using **TypeScript** and **Tailwind CSS**.

In Payload CMS 3.x, Payload runs natively inside the Next.js process as App Router route handlers and server components, removing the operational overhead of running separate backend and frontend servers during local development and single-container deployments.

---

## 3. Alternatives Considered

| Alternative | Evaluation & Trade-offs | Why Rejected / Deferred |
| :--- | :--- | :--- |
| **Strapi** | Mature headless CMS (Node.js). Separate server process required; decoupled frontend architecture increases deployment surface; TypeScript typing for schemas is less seamless than Payload code-first schema definitions. | Requires running and managing two distinct services; greater operational overhead under zero-budget constraints. |
| **Directus** | Excellent SQL-wrapper and data studio. Heavy focus on raw database schema rather than content editorial workflows; requires separate backend process; free tier self-hosting has non-trivial resource requirements. | Less integrated with Next.js frontend code-first ecosystem. |
| **WordPress (Headless)** | Ubiquitous editorial familiarity and vast plugin ecosystem. | Requires PHP/MySQL infrastructure; dual-stack maintenance; high security attack surface; poor developer ergonomics for modern TypeScript application extensions. |
| **Custom Bespoke CMS** | Total flexibility; zero third-party constraints. | Prohibitive initial engineering investment; building rich text editing, draft revisions, media uploads, and access control from scratch conflicts with rapid MVP delivery. |

---

## 4. Rationale

1. **Single-Process Co-location:** Payload 3.x is built directly on Next.js App Router. The admin panel and API endpoints run alongside public pages in the same Next.js application, simplifying development, testing, and deployment.
2. **Code-First TypeScript Schemas:** Collections and globals are defined as typed TypeScript objects, generating end-to-end types automatically for frontend consumption.
3. **Open-Source & MIT Licensed:** Payload CMS core is free and open-source, aligning with the ₹0 capital budget requirement.
4. **Rich Editorial Experience:** Out-of-the-box Lexical rich text editor, draft versioning, live previews, and customizable React components.
5. **Tailwind CSS Synergy:** Tailwind provides atomic styling control for custom editorial components and the reader-facing frontend.

---

## 5. Consequences

### Positive
- Unified codebase and single deployment artifact for both editorial admin and public website.
- Seamless end-to-end TypeScript types across content models and UI components.
- Zero licensing fees.
- Single command local development environment.

### Negative / Trade-offs
- Coupling: Next.js major upgrades may impact Payload CMS compatibility until Payload releases corresponding updates.
- Memory Consumption: Running Next.js build and Payload admin compilation inside a single instance can be memory-intensive on constrained environments.

---

## 6. Unresolved Risks & Verification Status

- **Verification Status:** This decision is an **approved planning baseline**. Technical compatibility between Next.js latest stable releases and Payload CMS 3.x dependencies will be actively verified during Milestone FS-002 (Scaffolding).
- **Resource Footprint:** We must monitor memory consumption during build and runtime to ensure compatibility with free-tier or lightweight hosting targets.
