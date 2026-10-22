# Foundry Studio

> A content publishing platform developed under **DevCrafters**, designed for rapid deployment across client projects with an evolutionary roadmap toward a multi-tenant SaaS publishing engine.

---

## 1. Product Overview

Foundry Studio is an open-source, full-stack content publishing platform engineered for editorial speed, modularity, and zero initial capital cost (₹0 budget constraint). Built on modern web standards, it integrates a rich editorial CMS directly into a high-performance publishing application.

### Key Highlights
- **Unified TypeScript Architecture:** Full-stack TypeScript spanning database schemas, editorial admin controls, and public web pages.
- **Embedded Editorial Engine:** Native integration with Payload CMS 3.x directly inside Next.js App Router.
- **Relational Integrity:** PostgreSQL persistence with native JSONB flexibility for dynamic content blocks.
- **Strict Editorial Governance:** Drafts, multi-stage editorial review, scheduling, version history, and live preview.
- **Zero-Cost Foundation:** Designed exclusively with open-source tools and local containerization.

---

## 2. Planned Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | Server Components, dynamic streaming, on-demand revalidation |
| **CMS Core** | [Payload CMS 3.x](https://payloadcms.com/) | Native Next.js co-location, Lexical rich text, RBAC, live previews |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type safety end-to-end |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Managed locally via Docker Compose; accessed via Drizzle / Payload |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Bespoke design tokens and responsive utility styles |
| **Local Dev** | [Docker Compose](https://docs.docker.com/compose/) | Isolated local PostgreSQL database container |

---

## 3. Current Project Status

- **Active Milestone:** `FS-001 — Initialize the Foundry Studio Project Foundation` (Completed)
- **Status:** Architectural documentation, governance rules, and environment safety established. Application scaffolding will commence in `FS-002` following CTO approval.
- **Next Milestone:** `FS-002 — Core Scaffolding & Local Database Environment`

For an up-to-date log of work completed, commands run, and current state, see [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).

---

## 4. Prerequisites

Before setting up Foundry Studio, ensure your local development workstation has:

- **Node.js:** `v22.x` (matching `.nvmrc`)
- **Package Manager:** `npm` (v10+)
- **Container Runtime:** `Docker` (24+) and `Docker Compose` (v2+)

To verify your tools:
```bash
node --version
npm --version
docker --version
docker compose version
```

---

## 5. Local Setup Instructions (Current Stage)

At this foundational stage (Milestone FS-001), application dependencies have not yet been scaffolded. To prepare your local environment for upcoming milestones:

1. **Review Project Guidelines & Governance:**
   Read [AGENTS.md](AGENTS.md) and [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) before contributing.

2. **Inspect Environment Configuration Template:**
   Inspect the environment template:
   ```bash
   cat .env.example
   ```
   When application implementation begins in `FS-002`, you will copy this file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Note: Never commit `.env.local` to version control; it is automatically gitignored).*

3. **Verify Environment Safety:**
   Ensure no untracked secrets or local environment files are exposed.

---

## 6. Project Documentation Index

| Document | Description |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | Contributor conventions, security rules, verification rules, and agent instructions. |
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | Strategic vision, user personas, editorial workflows, and constraints. |
| [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) | Authoritative record of current project state, checks, and next steps. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased development plan, milestone acceptance criteria, and review gates. |
| [ADR-0001: CMS & Application Architecture](docs/adr/0001-cms-and-application-architecture.md) | Rationale for Next.js App Router + Payload CMS 3.x + TypeScript. |
| [ADR-0002: Database & Persistence](docs/adr/0002-database-and-persistence.md) | Rationale for PostgreSQL and local Docker Compose containerization. |
| [ADR-0003: Production Deployment Strategy](docs/adr/0003-production-deployment-strategy.md) | Candidate evaluation framework; production hosting kept undecided. |

---

## 7. License

Foundry Studio is developed under **DevCrafters**. Distributed under the MIT License.
