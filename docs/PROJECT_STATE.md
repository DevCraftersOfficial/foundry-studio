# Foundry Studio — Project State Record

- **Current Milestone:** `FS-005-V — Final Reader Verification Gate`
- **Milestone Status:** Completed & Ready for Formal CTO Acceptance
- **Last Updated:** 2026-10-23
- **Authorized Next Task:** CTO Acceptance & Milestone Sign-Off (Pending `FS-006 — Production Hardening & Deployment Validation`)

---

## 1. Executive Summary: FS-005-V Final Reader Verification Gate

Milestone `FS-005-V` verified and resolved the final three reader verification items before authorizing production hardening:

### Key Actions Completed:

1. **Scheduled-Publication Consistency & Unified Public Eligibility:**
   - **Unified Eligibility Module ([`src/lib/publishing.ts`](file:///home/lokeshverma/DevCrafters/foundry-studio/src/lib/publishing.ts)):** Established canonical `getPublicPostWhere(now)` and `isPostPubliclyEligible(post, now)` helpers.
   - **Eliminated Access Inconsistency in `Posts.ts`:** Previously, `Posts.access.read` permitted anonymous retrieval of posts with `status: 'scheduled'` whose publication timestamp had passed. However, all public reader routes (`page.tsx`, `posts/[slug]/page.tsx`, `category/[slug]/page.tsx`, and `sitemap.ts`) strictly required `status === 'published'`. This created an architectural discrepancy where the REST API exposed posts that returned 404 on the website.
   - **Strict Invariant Enforced Platform-Wide:** Public content is eligible **ONLY** when `status === 'published'` and `publishedAt <= now`. Drafts, in-review, archived, and scheduled posts (whether future-scheduled or past-scheduled) are strictly excluded from all public entry points, routes, APIs, feeds, metadata, and sitemaps.
   - **Regression Tested:** Updated integration tests in `publishing.int.spec.ts` and `reader-seo.int.spec.ts` proving that scheduled posts never leak to anonymous visitors across REST queries, `findByID`, direct slug lookups, or sitemaps.

2. **Production Canonical URL Configuration & Zero-Localhost Guarantee:**
   - **Strict Production Enforcement ([`src/lib/site-url.ts`](file:///home/lokeshverma/DevCrafters/foundry-studio/src/lib/site-url.ts)):**
     - In development and test (`NODE_ENV !== 'production'`), falls back safely to `http://localhost:3000` when environment variables are absent.
     - In production (`NODE_ENV === 'production'`), **MUST NOT** silently generate canonical URLs or sitemap entries pointing to `localhost`, `127.0.0.1`, or `0.0.0.0`.
     - Missing production configuration throws a visible error: `[Site URL Error]: Missing production site URL. Please configure NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_SERVER_URL in production environment variables.`
     - Localhost or loopback domains in production throw a visible error: `[Site URL Error]: Production site URL cannot point to localhost or loopback address...`
     - Invalid protocols (e.g. `ftp:`) and malformed URLs throw descriptive errors.
   - **Configured `.env` and `.env.example`:** Added `NEXT_PUBLIC_SITE_URL=https://foundry-studio.dev` in local `.env` and `NEXT_PUBLIC_SITE_URL=https://your-domain.example.com` placeholder in `.env.example`.

3. **Preview Mode Indexing & Content Boundaries:**
   - **Header-Level Session Verification:** Proved through automated tests that draft mode requires an authenticated editorial session with proper role/ownership boundaries. Unauthenticated callers attempting to use draft mode receive 404 Not Found.
   - **Author Ownership Isolation:** Authors can only preview their own drafts; attempting to preview another author's draft returns 404. Editors and Admins can preview any draft.
   - **Robots Noindex & Suppressed Structured Data:** Preview pages and metadata strictly output `robots: { index: false, follow: false }`, and Schema.org `NewsArticle` JSON-LD is suppressed during preview sessions.

4. **Live Browser-Level Audits (Recorded):**
   - Live automated browser audit executed on production server (`http://localhost:3000`) via `browser_subagent` (recording artifact: `fs005_reader_audit`):
     - **Homepage (Desktop 1280x800):** Masthead, category navigation, single semantic `<h1>` on lead story, visible high-contrast `.skip-link` activating on Tab key.
     - **Article Detail Page:** Single `<h1>` title, Lexical headings safely mapped to `<h2>`, author attribution, publication date, responsive image rendering, tags.
     - **Category Archive Page:** Category title (`<h1>`), dynamic story cards, correct empty/loading states.
     - **Missing Slug / 404:** Clean editorial 404 template ("The Dispatch Cannot Be Located") with "Return to Front Page" link.
     - **Mobile Viewport (375x667):** Responsive reflow, zero horizontal scrollbar overflow (`scrollWidth <= clientWidth`), readable typography.

---

## 2. Updated File Inventory

| File | Status | Description |
| :--- | :--- | :--- |
| `src/lib/publishing.ts` | Created | Unified public eligibility helper (`getPublicPostWhere`, `isPostPubliclyEligible`). |
| `src/lib/site-url.ts` | Modified | Hardened production site URL resolution; fails visibly on missing or localhost URLs in production. |
| `src/collections/Posts.ts` | Modified | Updated `access.read` to use `getPublicPostWhere` so scheduled posts never leak through API. |
| `src/app/(frontend)/page.tsx` | Modified | Uses `getPublicPostWhere` for homepage post querying. |
| `src/app/(frontend)/posts/[slug]/page.tsx` | Modified | Uses `getPublicPostWhere` and `isPostPubliclyEligible` for article resolution and preview checks. |
| `src/app/(frontend)/category/[slug]/page.tsx` | Modified | Uses `getPublicPostWhere` for category archive filtering. |
| `src/app/sitemap.ts` | Modified | Uses `getPublicPostWhere` to strictly index published content. |
| `.env` | Modified | Added `NEXT_PUBLIC_SITE_URL=https://foundry-studio.dev`. |
| `.env.example` | Modified | Added `NEXT_PUBLIC_SITE_URL` placeholder. |
| `tests/int/publishing.int.spec.ts` | Modified | Updated test assertions to confirm scheduled posts are private even if publication timestamp is past. |
| `tests/int/reader-seo.int.spec.ts` | Modified | Expanded to 25 integration tests covering scheduled post isolation, site URL production validation, and preview boundaries. |
| `docs/PROJECT_STATE.md` | Modified | Authoritative project state update for FS-005-V. |
| `docs/ROADMAP.md` | Modified | Updated milestone status and acceptance records. |

---

## 3. Verification Commands & Deterministic Results

| Verification Check | Exact Command Executed | Result |
| :--- | :--- | :--- |
| **Integration Test Suite** | `npm run test:int` | **83 passed across 5 test files** (100% green in 7.17s) |
| **Type Checking** | `npx tsc --noEmit` | **0 errors** (100% type-safe) |
| **Linting** | `npm run lint` | **0 errors, 0 warnings** |
| **Production Build** | `npm run build` | **Successfully compiled all 10 routes** with Turbopack |
| **Browser Audit** | Browser Subagent (`fs005_reader_audit`) | **Verified desktop, mobile, skip-link, 404, single-h1** |

### Verified Test Suites Breakdown (`npm run test:int`):
- `tests/int/reader-seo.int.spec.ts` (25/25 passed) — Anonymous access isolation across publishing states (published, future-scheduled, past-scheduled, draft, in-review, archived, missing slug), SEO canonical & metadata generation, robots noindex on 404/draft, dynamic sitemap inclusion/exclusion, robots.txt rules, base URL normalization, site URL dev fallback and production rejection of localhost/missing URLs, RichText link protocol sanitization (`javascript:` neutralization), heading hierarchy demotion, author preview boundaries, and editor preview access.
- `tests/int/publishing.int.spec.ts` (33/33 passed) — REST/GraphQL draft confidentiality, author draft isolation, scheduled post privacy (future and past-scheduled), SVG upload rejection, password-change integrity.
- `tests/int/editorial.int.spec.ts` (15/15 passed) — RBAC, post lifecycle transitions, author publishing gate, preview secret validation, unauthenticated preview rejection, author preview boundary, editor/admin preview access, reader route draft mode cookie authorization.
- `tests/int/admin-bootstrap.int.spec.ts` (9/9 passed) — Concurrent creation race safety, anonymous registration denial, role injection defense, context spoofing defense, concurrent seedAdmin execution, target account promotion validation, invalid email rejection, admin immutability, promotion gating.
- `tests/int/api.int.spec.ts` (1/1 passed) — REST collections endpoint discovery.

---

## 4. Remaining Production Blockers (Reserved for FS-006)

The following items are out of scope for FS-005 and explicitly reserved for **FS-006: Production Hardening & Deployment Validation**:
1. **Production Hosting Candidate & Dockerfile (FS-006):** Multi-stage production `Dockerfile` with standalone Next.js output, non-root user execution, and container hardening.
2. **Object Storage Provider (FS-006 / ADR-004):** Uploads currently reside on local volume (`/media`). Cloud S3-compatible storage must be wired for production.
3. **Transactional Email Adapter (FS-006):** Payload currently uses the default console email adapter. A production SMTP / Resend adapter is required before public launch.
4. **External Monitoring & Observability (FS-006):** Structured logging, error tracking, and health checks.
5. **Zero Git Command Boundary Preserved:** Autonomous agents have executed zero git commands. All version control operations remain manual for the human repository owner.
