# ADR-0003: Production Deployment Strategy

- **Status:** Proposed / Under Evaluation (Production Hosting Undecided)
- **Date:** 2026-10-22
- **Authors:** DevCrafters Architecture Team
- **Decision Owner:** CTO / Tech Lead

---

## 1. Context

Foundry Studio requires a production hosting and deployment strategy that meets the following mandatory criteria:
- **₹0 Initial Operating Cost:** The platform must be deployable and testable on free-tier services, open-source infrastructure, or DevCrafters-owned shared test infrastructure without incurring recurring monthly fees.
- **Node.js + PostgreSQL Compatibility:** Support for Next.js App Router full-stack runtime (Node.js 20+) and PostgreSQL persistence.
- **Asset / Media Upload Handling:** Ability to persist editorial image and media uploads reliably.
- **Client Extensibility:** Reusable deployment model for client deployments with minimal re-engineering.

---

## 2. Decision

**Production hosting remains explicitly UNDECIDED at this stage.**

We establish a **deployment evaluation framework** to assess production candidates during early development milestones. We mandate that the application be built strictly as an environment-agnostic, container-ready application (via standard Next.js standalone output and standard PostgreSQL connection strings), ensuring that no code is tied to a specific vendor-proprietary runtime.

Final production hosting selection will be made based on hands-on benchmarking during Milestone FS-006 (Deployment Validation & Production Hardening) and requires explicit CTO approval.

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
