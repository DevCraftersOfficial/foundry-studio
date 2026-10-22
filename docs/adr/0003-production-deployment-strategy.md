# ADR-0003: Production Deployment Strategy

- **Status:** Accepted — Single-Host Container Baseline Validated
- **Date:** 2026-10-22 (Updated: 2026-10-23)
- **Authors:** DevCrafters Architecture Team
- **Decision Owner:** CTO / Tech Lead

---

## 1. Context

Foundry Studio requires a production hosting and deployment strategy that meets the following mandatory criteria:
- **₹0 Initial Operating Cost:** The platform must be deployable and testable on free-tier services, open-source infrastructure, or DevCrafters-owned shared test infrastructure without incurring recurring monthly fees.
- **Node.js + PostgreSQL Compatibility:** Support for Next.js App Router full-stack runtime (Node.js 22 Alpine) and PostgreSQL persistence.
- **Asset / Media Upload Handling:** Ability to persist editorial image and media uploads reliably on persistent volumes.
- **Client Extensibility:** Reusable deployment model for client deployments with minimal re-engineering.

---

## 2. Decision

We establish and accept the **Single-Host Hardened Container Baseline (`docker-compose.prod.yml`)** as the authorized deployment model for Foundry Studio:
1. **Multi-Stage Node 22 Alpine Container:** Next.js standalone output with unprivileged runtime execution (`USER nextjs`, UID 1001). Measured image content size: 91.9 MB (disk usage: 363 MB).
2. **Persistent Volumes:** Named volumes for PostgreSQL (`foundry_postgres_data`) and local media uploads (`foundry_media_data` mounted at `/app/media`).
3. **Explicit Single-Run Migration Service:** Database migrations (`npm run migrate`) run as an isolated one-shot container before application traffic starts, avoiding concurrent migration conflicts.
4. **Zero-Leak Health Probes:** Built-in container health check querying `/api/health?check=live` without exposing internal credentials or telemetry.
5. **Security Headers Baseline:** Enforced CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and conditional HSTS.

---

## 3. Candidate Alternatives Under Evaluation

| Hosting Candidate | Pros | Cons / Constraints | Budget Impact |
| :--- | :--- | :--- | :--- |
| **Self-Hosted Docker on VPS** (e.g., existing DevCrafters server / Hetzner / DigitalOcean) | Complete control; zero vendor lock-in; persistent disk for media uploads; no artificial memory/timeout limits. | Requires manual server maintenance, SSL certificate renewal, backup automation, and reverse proxy setup. | ₹0 if hosted on existing shared company infrastructure. |
| **PaaS Container Platforms** (e.g., Render, Fly.io) | Automated Git-driven deployments; managed SSL; native container support; simple setup. | Free tiers may sleep or experience cold starts after inactivity; limited free disk persistence for media assets. | Free tier initially; potential paywall as resource needs scale. |
| **Hybrid Serverless** (Vercel + Neon / Supabase Free Tier) | World-class Next.js edge caching and build pipeline; excellent developer ergonomics. | Serverless execution limits (timeout, payload size) for heavy media processing; connection limits on free-tier DB; vendor lock-in risks for file storage. | Free tier initially; vendor upsell pressures. |
| **Coolify / Dokku on VPS** | Self-hosted PaaS ergonomics with Git-push deployments and managed PostgreSQL containers. | Requires server management and initial orchestration setup. | ₹0 on existing dev hardware. |

---

## 4. Evaluation Criteria & Rationale for Deferring

1. **Avoid Premature Lock-in:** Committing to a deployment platform before measuring Next.js + Payload 3.x resource usage (RAM and CPU during cold starts and build steps) risks selecting an inadequate hosting plan.
2. **Media Storage Decoupling:** Editorial media persistence must be validated (whether using local Docker volume mounts or S3-compatible free object storage such as Cloudflare R2).
3. **Budget Discipline:** Prioritizing local development and containerization guarantees ₹0 expenditure while preserving total flexibility.

---

## 5. Consequences

### Positive
- Prevents early financial commitment and architectural lock-in.
- Enforces cloud-agnostic application architecture: standard Docker containerization, 12-factor configuration via environment variables, and standard SQL connection pooling.
- Keeps focus on core product features and editorial workflows during early milestones.

### Negative / Trade-offs
- Production deployment scripts and continuous deployment pipelines cannot be finalized until hosting is selected.
- Staging environment availability is deferred until Milestone FS-006.

---

## 6. Unresolved Risks & Next Actions

- **Memory Constraints:** Payload CMS 3.x build steps may exceed 512MB RAM limits present in some free-tier PaaS plans. We must benchmark memory footprint during Milestone FS-002 and FS-006.
- **Media Persistence:** We must resolve whether to use local volume storage (suitable for single-container VPS) or S3-compatible cloud storage (Cloudflare R2 free tier).
- **Next Action:** Re-evaluate candidate platforms in Milestone FS-006 with a live benchmark build. CTO sign-off is required prior to provisioning.
