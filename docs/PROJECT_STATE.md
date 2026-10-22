# Foundry Studio — Project State Record

- **Current Milestone:** `FS-006-V — Production Security and Runtime Verification`
- **Milestone Status:** Completed & Ready for CTO Review
- **Last Updated:** 2026-10-23
- **Authorized Next Task:** CTO Review & Launch Preparation (No deployment until approved)

---

## 1. Executive Summary: FS-006-V Production Security & Runtime Verification Gate

Milestone `FS-006-V` verified and resolved the CTO review findings regarding Content Security Policy tightening, health probe payload minimization, network isolation verification, automated migration failure gating, and empirical disaster recovery drills.

### Key Actions Completed:

1. **Content Security Policy Hardening ([`next.config.ts`](file:///home/lokeshverma/DevCrafters/foundry-studio/next.config.ts)):**
   - **Eliminated `'unsafe-eval'`:** Successfully removed `'unsafe-eval'` from `script-src`. Verified that Next.js standalone runtime, Payload Admin, Lexical editor, and public reader routes function cleanly without `eval`.
   - **Tightened `img-src` & `connect-src`:** Removed wildcard `https:` from `img-src` and `connect-src`. Restricted `img-src` to `'self' data: blob:` and `connect-src` to `'self'`.
   - **Documented Remaining `'unsafe-inline'`:** 
     - `script-src 'unsafe-inline'`: Required for Next.js App Router streaming RSC hydration scripts (`self.__next_f.push(...)`) and Payload initialization. Nonce injection in Next.js App Router without dynamic request middleware is incompatible with static page generation.
     - `style-src 'unsafe-inline'`: Required by Tailwind CSS font variables and Payload CMS Admin UI theme variables (`--theme-elevation-*`).
   - **Browser Audit:** Executed live browser verification on production server (`http://127.0.0.1:3000/`) and Payload Admin login (`/admin/login`). Confirmed zero CSP violation errors in the browser console.

2. **Health Endpoint Minimization ([`src/app/api/health/route.ts`](file:///home/lokeshverma/DevCrafters/foundry-studio/src/app/api/health/route.ts)):**
   - Stripped `userCount`, `timestamp`, and `services` wrapper object to eliminate unnecessary internal telemetry.
   - **Liveness Probe (`GET /api/health?check=live`):** Returns `HTTP 200 {"status":"alive"}`.
   - **Readiness Probe (`GET /api/health`):** Returns `HTTP 200 {"status":"ok","database":"connected"}` when database pool query succeeds.
   - **Failure Probe (`GET /api/health` with DB failure):** Returns `HTTP 503 {"status":"degraded","database":"disconnected"}` with zero stack trace or internal connection detail leakage.
   - Verified through automated tests that zero secrets, URIs, versions, or system internals are leaked.

3. **Network Isolation & Compose Verification ([`docker-compose.prod.yml`](file:///home/lokeshverma/DevCrafters/foundry-studio/docker-compose.prod.yml)):**
   - Proved via `docker compose config` that PostgreSQL publishes zero host ports and is restricted to the internal bridge network (`foundry_internal`).
   - Proved that the application web service binds strictly to loopback (`127.0.0.1:3000:3000`), preventing external exposure on `0.0.0.0` and requiring a host-level reverse proxy (e.g. Caddy/Nginx) for public SSL termination.
   - Documented host firewall and reverse proxy header requirements in `docs/RUNBOOK_DISASTER_RECOVERY.md`.

4. **Migration Runner Gating & Failure Behavior:**
   - Updated `docker-compose.prod.yml` to specify `depends_on: { migration: { condition: service_completed_successfully } }` on the `app` service.
   - Empirically verified on an isolated disposable test database:
     - Fresh migrations execute cleanly and sequentially from scratch.
     - Re-running migrations is 100% idempotent with zero destructive mutations.
     - Simulated database failure causes migration runner to exit with code 1, which blocks the `app` container from starting.

5. **Production Environment Contract & Single Source of Truth:**
   - Established `NEXT_PUBLIC_SITE_URL` as the single documented canonical source of truth across `.env.example`, `docker-compose.prod.yml`, `src/lib/site-url.ts`, and `src/lib/env.ts`.
   - Localhost, loopback (`127.0.0.1`, `0.0.0.0`), `*.local`, and wildcard hostnames are strictly rejected in production.

6. **Empirical Backup & Disaster Recovery Drill:**
   - Executed live drill against isolated database `foundry_disposable_drill` and temporary directory:
     - Dumped PostgreSQL via `pg_dump -Fc` (53,357 bytes).
     - Archived media assets via `tar -czf` (193 bytes).
     - Destroyed database (`DROP DATABASE`) and restored via `pg_restore`.
     - Verified restored record `SELECT id, name, slug FROM categories WHERE slug = 'drill-category'` returned row successfully.
     - Restored media archive and verified byte-for-byte identical asset content via `diff`.
     - Cleaned up disposable resources.

---

## 2. Updated File Inventory

| File | Status | Description |
| :--- | :--- | :--- |
| `src/app/api/health/route.ts` | Modified | Minimized payload: removed userCount, timestamps, and service wrappers; added 503 degraded branch. |
| `next.config.ts` | Modified | Tightened CSP: eliminated `'unsafe-eval'`, restricted `img-src` and `connect-src`. |
| `src/lib/site-url.ts` | Modified | Standardized on `NEXT_PUBLIC_SITE_URL` as single authoritative source of truth with loopback rejection. |
| `docker-compose.prod.yml` | Modified | Enforced `migration: { condition: service_completed_successfully }` dependency for `app` container. |
| `docs/RUNBOOK_DISASTER_RECOVERY.md` | Modified | Added Section 8 (Executed Recovery Drill Evidence) and Section 9 (Host Firewall Requirements). |
| `tests/int/production-hardening.int.spec.ts` | Modified | Expanded to 14 automated integration tests covering minimized health payload, 503 degraded response, and tightened CSP. |
| `docs/ROADMAP.md` | Modified | Updated Milestone FS-006-V verification status. |
| `docs/PROJECT_STATE.md` | Modified | Current authoritative project state record for FS-006-V. |

---

## 3. Verification Commands & Deterministic Results

| Verification Check | Exact Command Executed | Result |
| :--- | :--- | :--- |
| **Integration Test Suite** | `npm run test:int` | **97 passed across 6 test files** (100% green in 7.89s) |
| **Type Checking** | `npx tsc --noEmit` | **0 errors** (100% type-safe) |
| **Linting** | `npm run lint` | **0 errors, 0 warnings** |
| **Production Build** | `npm run build` | **Successfully compiled standalone output** in 1.8s |
| **Container Build** | `docker build -t foundry-studio:prod .` | **Clean build**, content size measured: 91.9 MB |
| **Compose Configuration** | `docker compose -f docker-compose.prod.yml config` | **Verified: loopback 127.0.0.1 binding, private PostgreSQL** |
| **Live Smoke: Minimized Health** | `curl -i http://127.0.0.1:3000/api/health` | **HTTP 200 `{"status":"ok","database":"connected"}`** |
| **Live Smoke: Liveness** | `curl -i http://127.0.0.1:3000/api/health?check=live` | **HTTP 200 `{"status":"alive"}`** |
| **Browser CSP & Admin Audit** | `browser_subagent` (`fs006_csp_audit`) | **Homepage & Admin Login clean; 0 CSP console errors** |
| **Recovery Drill** | Backup/Restore on `foundry_disposable_drill` | **PostgreSQL & media verified restored byte-for-byte** |

---

## 4. Remaining Risks & Operational Requirements

1. **Zero Git Command Boundary Preserved:** Autonomous agents have executed zero git commands. All version control operations remain manual for the human repository owner.
2. **Reverse Proxy Termination (Operator Action):** The application binds to `127.0.0.1:3000`. Public SSL and reverse proxying must be terminated on the host before setting `ENABLE_HSTS=true`.
3. **CSP Invariants:** `'unsafe-inline'` remains enabled for scripts (Next.js App Router streaming hydration) and styles (Tailwind / Payload theme variables).
4. **Zero Budget Preserved:** No external accounts or paid services were provisioned.
