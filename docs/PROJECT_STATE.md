# Foundry Studio — Project State Record

- **Current Milestone:** `FS-004-V3 — Final Administrator Provisioning Boundary`
- **Milestone Status:** Completed & Ready for CTO Review
- **Last Updated:** 2026-10-23
- **Authorized Next Task:** CTO Review & Sign-Off (Pending `FS-005 — Reader Polish, SEO Validation, and Lighthouse Audits`)

---

## 1. Executive Summary: FS-004-V3 Final Administrator Provisioning Verification

During milestone `FS-004-V3`, the administrator provisioning boundaries, context isolation, and existing-account promotion governance were systematically verified and backed with automated regression tests:

### Key Actions Completed:

1. **Privileged Context Isolation (`allowExplicitRole`):**
   - **Internal Server-Side Boundary:** `allowExplicitRole` is evaluated strictly from `req.context?.allowExplicitRole`. In Payload CMS, `req.context` is internal to the server and is never populated from client-supplied HTTP request headers or JSON request bodies.
   - **Body-Injection Neutralization:** Verified through integration tests that passing `{ "context": { "allowExplicitRole": true }, "role": "admin" }` in REST JSON or Local API calls without genuine server context has zero effect on `req.context`. The `beforeChange` hook unconditionally enforces `data.role = 'author'` for unprivileged calls.
   - **Admin-Only User Creation Access:** Hardened `Users.access.create` to `({ req: { user } }) => Boolean(user) && user?.role === 'admin'`. Unauthenticated callers receive an immediate HTTP 403 Forbidden on registration attempts across REST, GraphQL, and Local API.

2. **Concurrent Seed-Admin Execution Safety:**
   - **Idempotency & Race Protection:** Enhanced [`src/scripts/seed-admin.ts`](file:///home/lokeshverma/DevCrafters/foundry-studio/src/scripts/seed-admin.ts) to handle concurrent invocations safely. If multiple provisioning processes run simultaneously, PostgreSQL's unique index on `email` prevents duplicate creation, and subsequent processes gracefully confirm the active administrator record without throwing or corrupting state.
   - **Deterministic Concurrency Test:** Proved through automated tests that 5 concurrent executions of `seedAdmin` provision exactly one administrator account in the database without creating or promoting any unintended accounts.

3. **Existing-Account Promotion Governance & Target Validation:**
   - **Explicit Opt-In Required:** `seedAdmin` strictly refuses to promote existing accounts unless `ALLOW_EXISTING_ADMIN_PROMOTION=true` is explicitly configured.
   - **Target Account Integrity Validation:** Validates the target email address format using RFC-compliant regex, trims and lowercases inputs, and asserts that the targeted user document strictly matches the target email and contains a valid ID before executing any role mutation.
   - **Isolation of Unrelated Accounts:** Verified that promoting a targeted account never alters the roles or attributes of any other user accounts in the database.

---

## 2. Updated File Inventory

| File | Status | Description |
| :--- | :--- | :--- |
| `src/collections/Users.ts` | Modified | Hardened `access.create` to require authenticated administrator (`Boolean(user) && user?.role === 'admin'`). |
| `src/scripts/seed-admin.ts` | Modified | Added email regex validation, target account integrity checks, exportable `seedAdmin` function for tests. |
| `tests/int/admin-bootstrap.int.spec.ts` | Modified | Added regression tests for context spoofing, concurrent seed execution, target account validation, and invalid email rejection. |
| `docs/PROJECT_STATE.md` | Modified | Authoritative project state update. |

---

## 3. Verification Commands & Deterministic Results

| Verification Check | Exact Command Executed | Result |
| :--- | :--- | :--- |
| **Integration Test Suite** | `npm run test:int` | **58 passed across 4 test files** (100% green in 6.08s) |
| **Type Checking** | `npx tsc --noEmit` | **0 errors** (100% type-safe) |
| **Linting** | `npm run lint` | **0 errors, 0 warnings** |
| **Production Build** | `npm run build` | **Successfully compiled all 10 routes** with Turbopack |
| **Database Migrations** | `npm run migrate:status` | **Batches 1, 2, and 3 cleanly applied** |

### Verified Test Suites Breakdown (`npm run test:int`):
- `tests/int/admin-bootstrap.int.spec.ts` (9/9 passed) — Concurrent creation race safety, anonymous registration denial, role injection defense, context spoofing defense, concurrent seedAdmin execution, target account promotion validation, invalid email rejection, admin immutability, promotion gating.
- `tests/int/editorial.int.spec.ts` (15/15 passed) — RBAC, post lifecycle transitions, author publishing gate, preview secret validation, unauthenticated secret possession rejection (401), author preview boundary (403), editor/admin preview access (307), reader route draft mode cookie authorization.
- `tests/int/publishing.int.spec.ts` (33/33 passed) — REST/GraphQL draft confidentiality, author draft isolation, read-time scheduled post disclosure, SVG upload rejection, password-change integrity.
- `tests/int/api.int.spec.ts` (1/1 passed) — REST collections endpoint discovery.

---

## 4. Remaining Production Blockers

Before Foundry Studio is ready for production deployment:
1. **Email Adapter Configuration:** Currently using default console email adapter. A production SMTP / transactional email adapter (e.g. Resend / Nodemailer) must be configured with verified domain DKIM/SPF.
2. **Object Storage Provider:** Uploaded media is currently stored on the local filesystem (`/media`). Production requires S3-compatible cloud storage adapter (ADR-004).
3. **External Monitoring & Error Tracking:** Sentry / OpenTelemetry logging and health-check alerting need to be wired.
4. **Lighthouse & Core Web Vitals Audits:** Full performance, SEO, and accessibility audit across mobile and desktop viewports (`FS-005`).
5. **Zero Git Command Boundary Preserved:** Autonomous agents have executed zero git commands. All version control operations remain manual for the human repository owner.
