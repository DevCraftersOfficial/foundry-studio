# AGENTS.md — Engineering Guide for Autonomous & Human Contributors

Welcome to **Foundry Studio**. This document outlines mandatory engineering conventions, security standards, operational boundaries, and verification rules for all contributors and automated agents.

---

## 1. Project Overview & Scope Boundaries

Foundry Studio is an open-source, content publishing platform developed under **DevCrafters**.
- **Approved Planning Baseline:** Next.js (App Router), TypeScript, Payload CMS, PostgreSQL, and Tailwind CSS.
- **Budget Constraint:** Strict ₹0 initial budget. All tools, libraries, and runtime dependencies must be open-source and free for development and self-hosting.
- **Phase Boundary (FS-001):** This milestone establishes project foundation, governance, and documentation only.
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

## 3. Security & Secret-Handling Rules

1. **Zero Secret Leakage:**
   - Real passwords, cryptographic secrets, API tokens, database connection strings with real credentials, and private keys must **NEVER** be committed or written into source files.
   - Any `.env` or `.env.local` file must remain strictly gitignored.
2. **Template Hygiene (`.env.example`):**
   - `.env.example` must contain **placeholders only** (e.g., `your-secure-payload-secret-at-least-32-chars`, `postgresql://postgres:postgres@localhost:5432/foundry_studio`).
   - Never populate `.env.example` with production secrets or active local credentials.
3. **Least Privilege & Safe Defaults:**
   - Local database containers must not expose insecure open ports to the public internet.
   - Default configurations must assume an untrusted environment.

---

## 4. Coding Conventions & Code Quality

When application implementation begins in authorized milestones:

- **Language:** TypeScript with strict type checking enabled (`strict: true` in `tsconfig.json`).
- **Framework Conventions:** Next.js App Router paradigm. Prefer Server Components where feasible, utilizing Client Components (`'use client'`) only when interactive state or browser APIs are required.
- **CMS Layer:** Payload CMS 3.x integration adhering to official architectural guidelines.
- **Styling:** Tailwind CSS. Use semantic class naming and consistent design tokens.
- **File Structure:**
  - `docs/`: Architectural specifications, ADRs, project context, roadmap, and state records.
  - `src/app/`: Next.js App Router pages, layouts, and route handlers.
  - `src/collections/`: Payload CMS collection configurations.
  - `src/components/`: Reusable UI components.
  - `src/lib/`: Shared utilities, database helpers, and client configurations.

---

## 5. Documentation Maintenance Rules

Documentation is a living asset and must remain strictly aligned with the codebase:

1. **Keep `docs/PROJECT_STATE.md` Current:**
   - Every completed milestone must record the exact work done, verification results, commands executed, and known risks.
   - Never declare a milestone completed until all acceptance criteria are verified.
2. **Preserve Truth in Documentation:**
   - Do not claim features exist if they have only been planned or designed.
   - Distinguish clearly between *Planning Baselines* and *Technically Verified Implementations*.
3. **Architecture Decision Records (ADRs):**
   - Any architectural shift, database change, or hosting decision requires a new ADR in `docs/adr/`.
   - ADRs must document Context, Decision, Alternatives, Rationale, Consequences, and Unresolved Risks.

---

## 6. Testing & Verification Requirements

- **Verification Before Sign-Off:** Every milestone must be validated using deterministic commands (e.g., type checks, linter checks, test suites, or schema validation).
- **Documented Results:** Commands executed and their actual outputs must be logged in `docs/PROJECT_STATE.md`.
- **Honest Reporting:** If a test or check cannot be run (e.g., dependencies not yet installed), explicitly state the reason rather than fabricating results.

---

## 7. Instructions for Future Implementation Tasks

When assigned a new milestone (e.g., FS-002, FS-003):
1. Review `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, and `docs/PROJECT_STATE.md` before making any modifications.
2. Verify that the task matches the **Next Authorized Task** specified in `docs/PROJECT_STATE.md`.
3. Adhere strictly to the ₹0 budget and open-source tooling constraints.
4. Stop execution and obtain CTO sign-off upon completing the assigned milestone before proceeding to subsequent tasks.
