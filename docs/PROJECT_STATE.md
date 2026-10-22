# Foundry Studio — Project State Record

- **Current Milestone:** `FS-003-V4 — Final Publication Authorization Check`
- **Milestone Status:** Completed & Ready for Review
- **Last Updated:** 2026-10-22
- **Authorized Next Task:** `FS-004 — Editorial Workflow & Publishing Lifecycle` (Awaiting CTO Approval)

---

## 1. Milestones FS-003, FS-003-V, FS-003-V2, FS-003-V3 & FS-003-V4 Summary

Milestone FS-003 established foundational publishing domain models. Subsequent verification milestones hardened SVG media upload security (V), eliminated privilege escalation and enforced author ownership boundaries (V2), verified unpublished content confidentiality and native authentication mechanisms (V3), and validated publication authorization, unpublishing, rescheduling, and publication time integrity (V4).

### Key Milestones Achieved:

1. **Publication Authorization & Lifecycle Invariants Verified:**
   - **Direct Author Publishing:** In the approved FS-003 single-team baseline, authenticated authors can set a post directly to `published`. If `publishedAt` is omitted, it automatically defaults to `new Date().toISOString()`, making the article immediately accessible to public readers.
   - **Post-Publication Status Mutations:** Authors can unpublish an already-published post by changing its status to `draft` (immediately revoking public access across all query paths). Authors can also reschedule an already-published post by changing its status to `scheduled` with a future date (immediately retracting public visibility).
   - **Publication Date Invariants:** A published post cannot have a future publication date (enforcing status `scheduled` instead). A scheduled post cannot be assigned a past publication date.
   - **Publication Time Integrity:** A scheduled post cannot become publicly readable earlier than its intended publication timestamp through any supported mutation path. Public queries filter at the database level using `publishedAt <= now`.
   - **Consistent API Enforcement:** Verified that REST, GraphQL, and Local API operations (with access overrides disabled) execute identical validation hooks and access control functions.
2. **Unpublished Content Confidentiality & Privilege Boundaries:**
   - **Collaborative Draft Reading:** Authenticated team members can read drafts across authors for editorial review, but mutations (`update`, `delete`) remain strictly isolated to the post author (`{ author: { equals: req.user.id } }`).
   - **Anti-Spoofing & Self-Update:** Post creation forces `data.author = req.user.id`; author reassignment is blocked. User profile updates are constrained to `id === req.user.id`.
   - **Authentication State Protection:** Native login, password changes, and credential verification flows operate through Payload's Argon2/PBKDF2 routines; client input cannot tamper with internal tokens or inject privileged roles.
3. **Comprehensive Automated Verification:**
   - 33 integration tests across `tests/int/publishing.int.spec.ts` (32 tests) and `tests/int/api.int.spec.ts` (1 test).
   - Test suite verifies: Direct author publishing, unpublishing to draft, rescheduling to future date, publication date invariants, publication time integrity, category/tag uniqueness, post slug auto-formatting and uniqueness, relationship persistence, anonymous draft and future-scheduled post denial (both `find` and `findByID`), cross-author draft reading by authenticated users, author email privacy protection, user self-update boundary, privilege escalation stripping, legitimate login and password change flows, direct credential tampering defense, author anti-spoofing on creation, author-level mutation boundaries (non-authors cannot edit/delete other posts), anonymous mutation denial across all collections, SVG upload rejection, MIME type checking, and 10MB size limits.
   - 33 of 33 integration tests passing (100% pass rate).
4. **Type Safety & Build Verification:**
   - `npx tsc --noEmit`: 0 errors.
   - `npm run lint`: 0 errors, 0 warnings.
   - `npm run build`: Production Next.js Turbopack build succeeded in 9.9 seconds.

---

## 2. Inventory of Files Created or Modified in FS-003 Pipeline

| File | Status | Description |
| :--- | :--- | :--- |
| `src/lib/slug.ts` | Created | URL-safe slug formatting and validation utility. |
| `src/collections/Categories.ts` | Created | Categories collection configuration with unique slug and access control. |
| `src/collections/Tags.ts` | Created | Tags collection configuration with unique slug and access control. |
| `src/collections/Posts.ts` | Created | Posts collection with publishing lifecycle, publication invariants, author mutation boundaries, anti-spoofing, and security filters. |
| `src/collections/Media.ts` | Modified | Extended with 10MB limit, SVG disallowance, Sharp variants, focal point, and alt text. |
| `src/collections/Users.ts` | Modified | Added required `name`, self-update boundary, email privacy, and privilege-stripping hooks. |
| `src/payload.config.ts` | Modified | Registered `Posts`, `Categories`, and `Tags` collections. |
| `src/payload-types.ts` | Modified | Regenerated TypeScript interfaces matching new schema models. |
| `src/migrations/20261022_170247_add_publishing_domain.ts` | Created | Database migration establishing publishing domain tables, columns, and constraints. |
| `src/migrations/index.ts` | Modified | Registered new migration in Payload migration registry. |
| `tests/int/publishing.int.spec.ts` | Created | Comprehensive Vitest integration tests (32 tests) covering all publishing security, lifecycle, and authorization rules. |
| `tests/helpers/seedUser.ts` | Modified | Updated test user fixture to include required `name` field. |
| `vitest.config.mts` | Modified | Configured `environment: 'node'` for reliable buffer handling during upload integration tests. |
| `README.md` | Modified | Added Content Models & Media Architecture documentation and updated directory tree. |
| `docs/ROADMAP.md` | Modified | Updated FS-001, FS-002, and FS-003 milestone statuses and details. |
| `docs/PROJECT_STATE.md` | Modified | Authoritative project state update with FS-003-V4 verification evidence. |

---

## 3. Commands Executed & Actual Results in FS-003 Pipeline

*Note: In accordance with project instructions, no Git or GitHub commands were executed.*

| Command Executed | Exit Code | Result / Output Summary |
| :--- | :--- | :--- |
| `npm run generate:types` | 0 | Successfully compiled `src/payload-types.ts` with all 5 collections. |
| `npm run migrate` | 0 | Successfully applied Batch 2 migration `20261022_170247_add_publishing_domain`. |
| `npm run migrate:status` | 0 | Verified 2 of 2 migrations executed (`init` [Batch 1], `add_publishing_domain` [Batch 2]). |
| `npm run test:int` | 0 | 2 test files, 33/33 tests passed (100% green). |
| `npx tsc --noEmit` | 0 | 0 errors across entire codebase. |
| `npm run lint` | 0 | 0 errors, 0 warnings across all files. |
| `npm run build` | 0 | Production build compiled with Turbopack in 9.9s (all server routes and admin assets compiled). |

---

## 4. Verification Checks Performed in FS-003-V4

- [x] **Direct Author Publishing:** Verified that authors can set posts to `published`; `publishedAt` defaults to `now`; public visibility is immediate.
- [x] **Post-Publication Lifecycle Mutations:** Verified unpublishing (status `draft`) immediately revokes public access. Verified rescheduling (status `scheduled` with future date) retracts public access.
- [x] **Publication Date Invariants:** Verified that published posts cannot have future dates. Verified that scheduled posts cannot have past dates.
- [x] **Publication Time Integrity:** Verified that scheduled posts cannot be made public before their timestamp through any supported mutation path.
- [x] **API Consistency:** Confirmed that REST, GraphQL, and Local API (with access overrides disabled) execute identical validation and security rules.
- [x] **Unpublished Content Confidentiality:** Verified that authenticated users can read all drafts/scheduled posts. Anonymous queries (both `find` and direct `findByID`) are denied at the database layer.
- [x] **Authentication Protection:** Legitimate login and password updates work; direct credential tampering is blocked.
- [x] **Quality Standards:** `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm run test:int` (33/33 passing), `npm run build` (success).
- [x] **Strict Scope Discipline:** Zero Git commands executed; ₹0 budget maintained; no premature frontend pages or editorial dashboard implemented.

---

## 5. Outstanding Operational Decisions & Production Requirements

1. **Role-Based Access Control (RBAC):**
   - The verified baseline enforces author-level ownership boundaries without speculative role models.
   - *Roadmap Milestone FS-004:* Formal RBAC (`Author`, `Editor`, `Admin`) will introduce hierarchical roles allowing editors/admins to review and publish drafts authored by other contributors and preventing non-editorial roles from direct publishing.
2. **Scheduling Operational Architecture:**
   - In FS-003 / FS-003-V4, scheduled posts mature dynamically based on query-time evaluation (`publishedAt <= now`).
   - *Operational Requirement for Production:* To mutate `status` from `'scheduled'` to `'published'` directly in the database (e.g., for static site generation or webhook event triggering), an automated background worker / cron is required.
3. **Media Storage Durability:**
   - Media uploads currently persist to the local directory `media/`.
   - *Operational Requirement for Production:* Multi-instance horizontal scaling requires durable S3-compatible object storage (e.g., MinIO or AWS S3 via `@payloadcms/plugin-cloud-storage`).
4. **Lexical Rich-Text Frontend Rendering:**
   - Rich-text content is stored as structured Lexical JSON AST.
   - *Milestone Requirement for FS-005:* The public publishing website must render this AST using structured React components without `dangerouslySetInnerHTML`.

---

## 6. Next Authorized Task

- **Next Milestone:** `FS-004 — Editorial Workflow & Publishing Lifecycle`
- **Prerequisite:** Explicit sign-off and approval from the CTO on Milestone FS-003-V4.
- **Scope of FS-004:**
  - Build editorial dashboard and publishing workflow views adhering to `docs/DESIGN_SYSTEM.md`.
  - Implement full post management UI (list, filter by status/category, search, pagination).
  - Implement editorial post editing interface with Lexical editor and media selector.
  - Implement preview mechanism for drafts and scheduled posts.

