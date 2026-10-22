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

- **Frontend Publication:** [http://localhost:3000](http://localhost:3000)
- **Editorial Admin Studio:** [http://localhost:3000/admin](http://localhost:3000/admin)

Upon first visiting `/admin`, follow the on-screen prompt to create the initial administrative user.

---

## 7. Verification, Quality & Build Commands

| Command | Purpose | Verification Standard |
|---|---|---|
| `npx tsc --noEmit` | TypeScript type-check | 0 errors |
| `npm run lint` | ESLint checks | 0 errors, 0 warnings |
| `npm run test:int` | Vitest integration tests (database/ORM/security) | All 97 tests pass |
| `npm run build` | Next.js standalone production build | Successful compilation |
| `docker build -t foundry-studio:prod .` | Multi-stage Node 22 Alpine container | Clean build, non-root user (UID 1001), 91.9 MB content size |

---

## 8. Production Operations & Hardened Container Deployment

Foundry Studio includes a single-host, production-hardened baseline in `docker-compose.prod.yml`:

### 8.1. Required Production Environment Variables
- `DATABASE_URI`: PostgreSQL connection string (postgresql://...).
- `PAYLOAD_SECRET`: Cryptographic secret for session cookies (minimum 32 characters).
- `PREVIEW_SECRET`: Secret token securing editorial draft previews (minimum 16 characters).
- `NEXT_PUBLIC_SITE_URL`: Canonical public site URL (must use http/https; localhost, loopback, or wildcard domains are strictly rejected in production).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME`: Optional email configuration. In production, unconfigured email delivery visibly fails rather than pretending delivery succeeded.
- `ENABLE_HSTS`: Set to `'true'` only on deployments with guaranteed HTTPS.

### 8.2. Pre-Deployment Single-Run Migration
Never run migrations automatically across multiple web replicas. Run the migration service once before starting the app:
```bash
docker compose -f docker-compose.prod.yml run --rm migration
```

### 8.3. Start Production Stack
```bash
docker compose -f docker-compose.prod.yml up -d
```

### 8.4. Health Endpoints
- **Liveness probe:** `GET /api/health?check=live` (confirms Node process responds).
- **Readiness probe:** `GET /api/health` (verifies database pool connectivity). Zero secrets, connection strings, or system versions are exposed.

For coordinated PostgreSQL and media backups, restore procedures, and rollback rules, consult the [Operations & Disaster Recovery Runbook](file:///home/lokeshverma/DevCrafters/foundry-studio/docs/RUNBOOK_DISASTER_RECOVERY.md).

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
│   ├── collections/          # Payload CMS collections (Posts, Categories, Tags, Media, Users)
│   ├── lib/                  # Shared utilities (slug formatting and validation)
│   ├── migrations/           # Version-controlled database migrations
│   ├── payload-types.ts      # Auto-generated TypeScript types for collections
│   └── payload.config.ts     # Central Payload CMS configuration
└── tests/                    # Integration and end-to-end test suites
    ├── helpers/              # Test seeding and client utilities
    └── int/                  # Integration test specs (users, publishing)
```

---

## 9. Content Models & Media Architecture

Foundry Studio provides a structured content publishing engine:

### 9.1. Collections

- **`Posts`**: Core editorial publishing model.
  - `title`: Required title string.
  - `slug`: URL-safe, unique, indexed identifier (auto-formatted from title if omitted).
  - `excerpt`: Optional summary text (maximum 300 characters).
  - `content`: Payload Lexical rich-text AST (structured JSON, no raw or un-sanitized HTML).
  - `featuredImage`: Relationship to `Media` collection.
  - `categories`: Relationship to `Categories` (has-many).
  - `tags`: Relationship to `Tags` (has-many).
  - `author`: Relationship to `Users` (defaults to authenticated creator).
  - `publishedAt`: Publication date and time.
  - `status`: Editorial state (`draft`, `scheduled`, `published`).
- **`Categories`**: Topical taxonomy model (`name`, `slug`, `description`).
- **`Tags`**: Free-form indexing tags (`name`, `slug`).
- **`Media`**: Curated assets storage with Sharp image transformation:
  - 10MB server-side file size limit.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif` (SVG uploads are strictly disallowed for XSS and XML entity security).
  - Focal point selection and required `alt` accessibility text.
  - Automatic variant generation: `thumbnail` (400x300), `card` (768x512), `feature` (1200x675).
  - Local filesystem storage in `media/` (gitignored, see production durability note below).
- **`Users`**: Editorial accounts with required `name`, self-update constraints, and field-level privacy protection on `email`.

### 9.2. Publishing Lifecycle & Security Rules

- **Draft Isolation:** Draft posts (`status === 'draft'`) are private by default and readable only by authenticated editorial users.
- **Scheduled Visibility:** Scheduled posts (`status === 'scheduled'`) are hidden from anonymous queries (including direct `findByID` requests) until `publishedAt <= now`. Once publication time has passed, they become publicly readable.
- **Publication Invariants:** Scheduled posts require future dates; published posts cannot have future publication dates.
- **Database-Layer Filtering:** Public read access controls apply directly as PostgreSQL `WHERE` clauses during database querying, preventing unpublished content from being retrieved into server memory or leaked via APIs.
- **Author Privacy Protection:** User `email` fields have field-level access control restricting read access to authenticated sessions. Anonymous users fetching posts with populated author relationships receive the author `name` while `email` is sanitized and excluded.
- **Local Media Storage Note:** Uploaded assets are saved to the local filesystem under `media/`. Production multi-instance deployments require external durable object storage (e.g., S3-compatible bucket via `@payloadcms/plugin-cloud-storage`).

---

## 10. Engineering Governance

All automated agents and human contributors must adhere to [AGENTS.md](file:///home/lokeshverma/DevCrafters/foundry-studio/AGENTS.md):
- Zero Git execution by autonomous agents.
- Zero secret leakage in source code or templates.
- Strict ₹0 budget constraint.
- Continuous maintenance of `docs/PROJECT_STATE.md`.
