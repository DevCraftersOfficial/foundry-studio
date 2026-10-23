# Project Context — Foundry Studio

## 1. Product Vision & Positioning

**Foundry Studio** is a proprietary, premium content publishing product engineered and developed by **DevCrafters**.

Foundry Studio is positioned as an authoritative, bespoke editorial publishing platform designed for organizations, independent newsrooms, and high-craft publications that require deep editorial governance, distinctive typography, and zero-compromise performance.

### Strategic Roadmap & Commercial Evolution
1. **Initial Strategic Phase:** Provide a distinctive, proprietary publishing platform for DevCrafters client publications and enterprise editorial hubs, establishing a distinctive design language and complete editorial experience.
2. **Evolutionary Phase:** Potential future commercial licensing and hosted service plans (SaaS). Commercial pricing, subscription billing, multi-tenant tenant isolation, and hosted cloud operations remain explicitly undecided and out of scope for current milestones.

### Positioning & Brand Copy Invariants
- **Proprietary Identity:** Public-facing product copy, mastheads, footers, and meta descriptions must **not** describe Foundry Studio as an open-source publishing platform.
- **Third-Party Dependency Transparency:** Legal notices, license files, and dependency manifests for underlying open-source frameworks (Next.js, Payload CMS, PostgreSQL) remain fully transparent and accurately disclosed without misrepresentation.
- **Budget Constraint:** Strict ₹0 initial infrastructure development budget. All runtime dependencies, tools, and libraries must be open-source or free-tier compatible.

---

## 2. Target Users & Stakeholders

| User Persona | Role & Core Needs |
| :--- | :--- |
| **Content Authors & Writers** | Fast, distraction-free rich text editing, draft auto-saving, preview generation, and intuitive asset insertion. |
| **Editors & Content Managers** | Multi-stage review workflows (Draft -> In Review -> Scheduled / Published), revision history, content scheduling, and category management. |
| **Platform Administrators** | Role-Based Access Control (RBAC), user provisioning, API security, and system configuration. |
| **DevCrafters Engineers** | Modular codebase, clear extension points, typed schemas, and low-friction multi-client adaptations. |
| **Public Readers & Consumers** | High-performance, SEO-optimized, accessible, responsive reading experiences. |

---

## 3. Initial User Workflows (Editorial Focus)

```
[ Author ]
   │
   ▼ Creates & saves
[ Draft Post ]
   │
   ▼ Submits for review
[ Editorial Review ] ──(Needs Revision)──► [ Author Revision ]
   │
   ▼ Approved
[ Scheduling / Publishing ]
   │
   ├── Published Immediately ──► [ Live Content ]
   └── Scheduled at Future Date ──► [ Automated Release ]
```

1. **Content Creation:** Author creates a post with rich text, media blocks, and SEO metadata, saving it as a `Draft`.
2. **Editorial Verification:** Content is moved to `Under Review`. Editors review formatting, editorial accuracy, and taxonomy tags.
3. **Approval & Publication:** Editor approves the document and either publishes it immediately or sets a future publication timestamp (`Scheduled`).
4. **Reader Access:** Approved and published posts are served via high-performance Next.js Server Components with optimized caching and metadata.

---

## 4. MVP Scope & Boundaries

### 4.1. Core MVP Requirements
- **Authentication & RBAC:** Native admin and editorial authentication via Payload CMS with distinct roles (`Admin`, `Editor`, `Author`).
- **Content Modeling:** Structured collections for `Posts`, `Categories`, `Tags`, and `Users`.
- **Media Asset Pipeline:** Local asset upload and management with image optimization.
- **Editorial State Machine:** Explicit status transitions (`Draft`, `In Review`, `Published`, `Archived`).
- **Live Preview:** Instant draft preview capability for authors and editors.
- **Public Rendering:** Responsive, accessible web pages displaying published content with semantic HTML and dynamic OpenGraph/SEO meta tags.
- **Local Dev Sandbox:** Single-command local environment using Docker Compose for PostgreSQL.

### 4.2. Explicitly Deferred Features (Post-MVP / SaaS Phase)
- Multi-tenant tenant-isolation routing and billing subscriptions.
- Custom domain mapping per client.
- Enterprise SSO (SAML/Okta) and advanced OAuth2 federation.
- Real-time collaborative multi-cursor canvas editing.
- AI-driven automated copywriting or translation plugins.
- Paid CDN add-ons or proprietary search clusters (e.g., Algolia).

---

## 5. Approved Architectural Direction

- **Frontend & App Framework:** **Next.js** (App Router, React Server Components).
- **Programming Language:** **TypeScript** with strict type-safety across schemas and frontend components.
- **CMS & Backend Core:** **Payload CMS 3.x** (embedded natively within Next.js App Router for single-process runtime efficiency).
- **Database Layer:** **PostgreSQL** (leveraging native JSON/relational modeling and transactions).
- **Styling Engine:** **Tailwind CSS** (configured with a bespoke design system token set).
- **Containerization for Local DB:** **Docker Compose** running official PostgreSQL images.

---

## 6. Business & Security Constraints

### 6.1. Business & Budget Constraints
- **₹0 Initial Budget:** No proprietary cloud subscriptions, paid databases, or commercial SaaS dependencies are permitted.
- **Open-Source Priority:** All libraries, frameworks, and deployment targets must be open-source or free-tier compatible.
- **Local First:** The entire system must function autonomously on a local developer workstation without internet access to external APIs.

### 6.2. Security Requirements
- **Secret Isolation:** No secrets or private keys in source control.
- **Safe Environment Templates:** `.env.example` must contain zero production or sensitive default passwords.
- **CSRF & Injection Defenses:** Enforce parameterization via Payload ORM/Drizzle layer and standard Next.js security headers.
- **Role Isolation:** Strict boundary enforcement between editorial authoring and admin administrative operations.

---

## 7. Accepted Decisions & Outstanding Questions

### Accepted Decisions
- Adoption of Next.js App Router and Payload CMS 3.x as the core platform stack ([ADR-0001](adr/0001-cms-and-application-architecture.md)).
- Selection of PostgreSQL as the primary transactional persistence engine ([ADR-0002](adr/0002-database-and-persistence.md)).
- Local-first development architecture with containerized database instances.

### Outstanding Questions
- **Production Hosting Validation:** Target production hosting infrastructure remains pending evaluation and explicit CTO approval ([ADR-0003](adr/0003-production-deployment-strategy.md)). Options under evaluation include free-tier container PaaS (Render, Fly.io), self-hosted VPS (Docker), or Vercel + Neon/Supabase free tiers.
- **Media Storage in Production:** Local filesystem vs. S3-compatible free-tier object storage (e.g., Cloudflare R2 / MinIO).
- **Publishing Webhook Triggers:** Strategy for ISR (Incremental Static Regeneration) on-demand cache revalidation vs. dynamic SSR.
