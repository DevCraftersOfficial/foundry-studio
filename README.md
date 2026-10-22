# Foundry Studio

**Foundry Studio** is an open-source, modern content publishing platform developed by **DevCrafters**. It combines the developer ergonomics of **Next.js (App Router)** with the content modeling and editorial capabilities of **Payload CMS 3.x**, backed by **PostgreSQL** and styled with **Tailwind CSS**.

---

## 1. Architecture & Stack Overview

- **Frontend & App Framework:** Next.js 16 (App Router, Server Components)
- **CMS Engine:** Payload CMS 3.x (natively embedded route handlers)
- **Database:** PostgreSQL 18 (via `@payloadcms/db-postgres` and Drizzle ORM)
- **Language:** TypeScript (strict mode enabled)
- **Local Persistence:** Containerized PostgreSQL via Docker Compose
- **Cost & Licensing:** Strict ₹0 initial budget; 100% open-source and free for development and self-hosting

---

## 2. Prerequisites

Ensure your development workstation meets these minimum runtime requirements:

- **Node.js:** `>= 22.0.0` (LTS recommended, verified on `v22.22.2`)
- **npm:** `10.x+` (verified on `10.9.7`)
- **Docker & Docker Compose:** Docker Engine `24+` / Compose `v2+` (verified on Docker `29.8.2` and Compose `v5.6.0`)

---

## 3. Local Environment Setup

### 3.1. Clone and Configure Environment Variables

Create your local `.env` from the provided safe template:

```bash
cp .env.example .env
```

Ensure the variables are set in `.env`:

```env
# Database connection string (PostgreSQL)
DATABASE_URI=postgresql://foundry_app:<your-password>@localhost:5432/foundry_studio
DATABASE_URL=postgresql://foundry_app:<your-password>@localhost:5432/foundry_studio

# Payload CMS secret key (at least 32 characters)
PAYLOAD_SECRET=your-secure-payload-secret-at-least-32-chars
```

> [!IMPORTANT]
> Never commit `.env` or any real secrets to version control. The repository `.gitignore` strictly protects `.env` files.

### 3.2. Install Dependencies

Install all project dependencies using `npm`:

```bash
npm install
```

---

## 4. Starting and Checking PostgreSQL

Foundry Studio uses a containerized PostgreSQL instance for local development:

### Start PostgreSQL
```bash
docker compose up -d postgres
```

### Check Container Status and Health
```bash
docker ps --filter "name=foundry-postgres"
```

### Verify Database Connectivity
```bash
docker exec foundry-postgres pg_isready -U foundry_app -d foundry_studio
```

---

## 5. Database Migrations Workflow

Foundry Studio uses Payload CMS's native Drizzle-backed PostgreSQL migration workflow:

### Check Migration Status
```bash
npm run migrate:status
```

### Create a New Migration
```bash
npm run migrate:create <migration-name>
```

### Run Pending Migrations
```bash
npm run migrate
```

### Revert the Last Migration Batch
```bash
npm run migrate:down
```

---

## 6. Development Server

Start the local development server:

```bash
npm run dev
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Custom Route Example:** [http://localhost:3000/my-route](http://localhost:3000/my-route)

Upon first visiting `/admin`, follow the on-screen prompt to create the initial administrative user.

---

## 7. Verification, Quality & Build Commands

| Command | Purpose | Verification Standard |
|---|---|---|
| `npx tsc --noEmit` | TypeScript type-check | 0 errors |
| `npm run lint` | ESLint checks | 0 errors, 0 warnings |
| `npm run test:int` | Vitest integration tests (database/ORM) | All tests pass |
| `npm run build` | Next.js production build | Successful static and dynamic compilation |
| `npm run start` | Start production server | Serves optimized build |

---

## 8. Project Structure

```
├── .env.example              # Sanitized environment variable template
├── AGENTS.md                 # Autonomous & human contributor engineering guide
├── docker-compose.yml        # Local PostgreSQL container configuration
├── Dockerfile                # Multi-stage production container build
├── docs/                     # Architectural specifications and project state
│   ├── PROJECT_CONTEXT.md    # Product vision, personas, and MVP scope
│   ├── PROJECT_STATE.md      # Authoritative project state and verification log
│   ├── ROADMAP.md            # Phased development roadmap
│   └── adr/                  # Architectural Decision Records (ADRs)
├── src/
│   ├── app/                  # Next.js App Router (Frontend & Payload admin routes)
│   ├── collections/          # Payload CMS collections (Users, Media)
│   ├── migrations/           # Version-controlled database migrations
│   ├── payload-types.ts      # Auto-generated TypeScript types for collections
│   └── payload.config.ts     # Central Payload CMS configuration
└── tests/                    # Integration and end-to-end test suites
```

---

## 9. Engineering Governance

All automated agents and human contributors must adhere to [AGENTS.md](file:///home/lokeshverma/DevCrafters/foundry-studio/AGENTS.md):
- Zero Git execution by autonomous agents.
- Zero secret leakage in source code or templates.
- Strict ₹0 budget constraint.
- Continuous maintenance of `docs/PROJECT_STATE.md`.
