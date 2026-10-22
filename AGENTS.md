# AGENTS.md — Engineering Guide for Autonomous & Human Contributors

Welcome to **Foundry Studio**. This document outlines mandatory engineering conventions, security standards, operational boundaries, and verification rules for all contributors and automated agents.

---

## 1. Project Overview & Scope Boundaries

Foundry Studio is an open-source, content publishing platform developed under **DevCrafters**.
- **Approved Planning Baseline:** Next.js (App Router), TypeScript, Payload CMS, PostgreSQL, and Tailwind CSS.
- **Budget Constraint:** Strict ₹0 initial budget. All tools, libraries, and runtime dependencies must be open-source and free for development and self-hosting.
- **Phase Boundary:** Features are executed strictly within authorized milestone boundaries.
- **Strict Limitation:** No application code, database migrations, API routes, or external services are to be created without explicit authorization in a designated milestone.

---

## 2. Strict Restrictions for AI / Autonomous Agents

### 2.1. Git & GitHub Operations (Strictly Forbidden)
- **Do NOT execute any Git commands** (`git init`, `git add`, `git commit`, `git push`, `git checkout`, `git branch`, `git status`, etc.).
- **Do NOT interact with GitHub** (no PR creation, remote management, issue management, or secret configuration).
- The human repository owner manages all Git version control and remote synchronization manually.

### 2.2. Feature Creep & Out-of-Scope Code
- Do not implement Next.js pages/components, Payload collections, or database schemas until authorized by the respective milestone task.
- Do not purchase paid services, configure billing, or provision external cloud infrastructure.

---

## 3. Security & Secret-Handling Standards

1. **Zero Secret Leakage:**
   - Real passwords, cryptographic secrets, API tokens, database connection strings with real credentials, and private keys must **NEVER** be committed or written into source files.
   - Any `.env` or `.env.local` file must remain strictly gitignored.
2. **Template Hygiene (`.env.example`):**
   - `.env.example` must contain **placeholders only** (e.g., `your-secure-payload-secret-at-least-32-chars`, `postgresql://postgres:postgres@localhost:5432/foundry_studio`).
   - Never populate `.env.example` with production secrets or active local credentials.
3. **Server-Side Authorization & Draft Isolation:**
   - Enforce authorization strictly on the server (in Payload access control hooks, Next.js Server Actions, or Route Handlers). Client-side checks are cosmetic only.
   - Drafts, revisions, and scheduled posts are private by default. Public queries and route handlers must never expose unpublished content.
4. **Input Validation & Safe Media Handling:**
   - Validate all user input server-side using schema validation.
   - Validate file uploads against strict MIME-type allowlists and size limits before saving to storage.
   - Render Lexical rich text safely using structured React components. Never use `dangerouslySetInnerHTML` with un-sanitized content.
5. **Least Privilege & Safe Database Access:**
   - Local database containers and database roles must adhere to least privilege and never expose insecure open ports to the public internet.
   - Avoid raw or concatenated SQL queries; rely on Payload's typed ORM / Drizzle database adapter.

---

## 4. Architecture & Coding Conventions

### 4.1. Architecture Standards
- **Modular Monolith:** Maintain co-location of Payload CMS 3.x and Next.js App Router within the unified single-process architecture.
- **Supported Payload APIs:** Rely on official Payload APIs, hooks, and collection configurations. Do not bypass the CMS layer with custom database mutations unless an ADR explicitly authorizes it.
- **Layered Responsibilities:** Keep business logic, access control, and data validation in the appropriate server-side layers (`src/collections/`, `src/lib/`, route handlers).
- **Zero Unnecessary Abstractions:** Avoid premature generic frameworks or redundant utility wrappers. Depend on the existing stack and standard Node/TypeScript capabilities.

### 4.2. Code Quality & Styling
- **Language:** TypeScript with strict type checking enabled (`strict: true` in `tsconfig.json`). No implicit `any`.
- **Framework Conventions:** Next.js App Router paradigm. Prefer React Server Components (`RSC`). Restrict Client Components (`'use client'`) to interactive leaves requiring browser APIs or state.
- **Design System Alignment:** Follow `docs/DESIGN_SYSTEM.md`. Use semantic design tokens and Tailwind CSS classes. No ad-hoc hex colors, inline styles, or arbitrary utility classes.
- **Iconography:** Use pure SVG icons (Lucide or Heroicons). Strictly **no emojis as UI icons**.
- **File Structure:**
  - `docs/`: Architectural specifications, ADRs, design system, and project state records.
  - `src/app/`: Next.js App Router pages, layouts, and route handlers.
  - `src/collections/`: Payload CMS collection configurations.
  - `src/components/`: Reusable UI components (`ui/` for primitives, `editorial/` for publication domain).
  - `src/lib/`: Shared utilities, database helpers, and client configurations.
  - `.agents/skills/`: Workspace-scoped agent skills and design intelligence.

---

## 5. Quality, Testing & Verification Requirements

- **TypeScript & Lint Verification:** Every milestone must pass `npx tsc --noEmit` and `npm run lint` with zero errors and zero warnings.
- **Deterministic Verification:** Every implementation milestone must be validated using deterministic commands (unit tests, integration checks, schema validation, or production build tests).
- **UI State Rigor:** Every UI view must provide explicit implementations for all standard states: **Ideal, Loading (skeleton loaders), Empty, Error, Success, and Permission Denied**.
- **Accessibility Invariant:** Interfaces must meet WCAG 2.2 AA standards (minimum 4.5:1 text contrast, visible `:focus-visible` rings, screen reader landmarks/labels, and `@media (prefers-reduced-motion)` support).
- **Migration Reviews:** Database migrations must be reviewed before execution. Rollback (`down`) operations must be inspected for destructive data loss potential.
- **Documented Results:** Commands executed and actual outputs must be logged in `docs/PROJECT_STATE.md`. If a check cannot be run, report the exact blocker honestly.

---

## 6. Delivery Workflow for Autonomous Agents

When assigned any milestone task:
1. **Inspect Before Modifying:** Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/PROJECT_STATE.md`, and relevant ADRs before modifying files. Confirm the task matches the **Next Authorized Task** in `docs/PROJECT_STATE.md`.
2. **Define Acceptance Criteria First:** Establish explicit verification criteria before writing code.
3. **Execute Incrementally:** Make minimal, deliberate edits matching the authorized milestone scope. Avoid feature creep.
4. **Run Verification Commands:** Validate changes deterministically (`tsc`, `lint`, test suites, builds).
5. **Update Living Documentation:** Update `docs/PROJECT_STATE.md` with work completed, verification evidence, and outstanding risks.
6. **Stop for Approval:** Do not declare a milestone completed when acceptance criteria fail. Stop and wait for human CTO review before proceeding to subsequent tasks.

---

## 7. Installed Agent Skills & Usage Guidelines

Foundry Studio provides two project-scoped skills installed in `.agents/skills/`:

### 7.1. `design-taste-frontend`
- **Location:** `.agents/skills/design-taste-frontend/SKILL.md`
- **Purpose:** Art direction, anti-slop frontend principles, and layout logic for editorial publications and app screens.
- **Invocation:** Read the skill file and execute the local draw script when seeking art direction:
  ```bash
  node .agents/skills/design-taste-frontend/scripts/draw.mjs --sector agency --brief "<brief>" --options 3
  ```

### 7.2. `ui-ux-pro-max`
- **Location:** `.agents/skills/ui-ux-pro-max/SKILL.md`
- **Purpose:** Design system intelligence, WCAG 2.2 AA checklists, semantic token generation, UX guidelines, and responsive rules.
- **Invocation:** Read the skill file and execute the local search script:
  ```bash
  python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
  ```
