# ADR-0002: Database and Persistence Strategy

- **Status:** Accepted (Planning Baseline)
- **Date:** 2026-10-22
- **Authors:** DevCrafters Architecture Team
- **Decision Owner:** CTO / Tech Lead

---

## 1. Context

Foundry Studio requires a reliable, performant, and extensible database engine to store relational publishing data (users, roles, permissions, categories, tags) alongside semi-structured editorial documents (rich text ASTs, dynamic content layout blocks, revision history).

Criteria for selection:
- Native support within Payload CMS 3.x.
- Transactional integrity (ACID) for multi-author editorial state transitions.
- Rich querying, indexing, and JSON document storage capabilities.
- Local reproducibility at ₹0 cost without proprietary vendor dependencies.
- Plentiful free-tier and self-hosting production deployment options.

---

## 2. Decision

We adopt **PostgreSQL** as the primary persistence engine, accessed through the official Payload CMS PostgreSQL adapter (`@payloadcms/db-postgres` backed by Drizzle ORM).

For local development, PostgreSQL will be run locally via **Docker Compose**, providing a sandboxed, reproducible environment matching production-like behavior without local host OS pollution.

---

## 3. Alternatives Considered

| Alternative | Evaluation & Trade-offs | Why Rejected / Deferred |
| :--- | :--- | :--- |
| **SQLite / libSQL** | Ultra-lightweight; zero container dependencies; simple single-file backups. | Limited concurrency under high-frequency editorial writes; lack of native horizontal scalability; potential file locking issues in multi-instance or serverless container deployments. |
| **MongoDB** | Historic default for Payload CMS v1/v2; excellent document flexibility. | Weaker relational constraints for complex organizational structures, taxonomies, and multi-tenant schema isolation; declining preference in enterprise relational environments; fewer free-tier hosting alternatives with predictable schemas. |
| **MySQL / MariaDB** | Established open-source relational engine. | Payload CMS 3.x has first-class native adapters for PostgreSQL and SQLite via Drizzle; MySQL support in Payload is less idiomatic and lacks the advanced JSONB indexing capabilities of Postgres. |

---

## 4. Rationale

1. **Relational + Semi-Structured Hybrid:** PostgreSQL's robust `JSONB` data type combined with strict foreign-key relations perfectly accommodates structured metadata (authors, categories, publication dates) and dynamic content blocks (custom layout components, rich text nodes).
2. **First-Class Payload 3.x Support:** Payload’s `@payloadcms/db-postgres` adapter provides type-safe migrations and high-performance querying via Drizzle ORM.
3. **Local Development Parity:** Running official PostgreSQL Docker images guarantees that developers test against the identical database engine and dialect used in staging/production.
4. **Ecosystem & Cloud Portability:** PostgreSQL is supported by every major cloud and hosting platform (e.g., Supabase, Neon, Railway, Render, Fly.io, AWS RDS, self-hosted Docker), preventing cloud lock-in.

---

## 5. Consequences

### Positive
- Strict data integrity, referential constraints, and ACID transactions.
- Flexible schema migrations managed via Payload CLI / Drizzle.
- Wide variety of hosting targets with generous free tiers or self-hosted options.
- Clear isolation in local development via containerized volumes.

### Negative / Trade-offs
- Requires Docker / Docker Compose running on local developer machines.
- Database connection limits in serverless or serverless-like environments require connection pooling (e.g., PgBouncer or connection pool managers).

---

## 6. Unresolved Risks & Verification Status

- **Verification Status:** Planning baseline accepted. Docker Compose definition and Payload PostgreSQL adapter connectivity will be implemented and validated in Milestone FS-002.
- **Connection Pooling:** In serverless or multi-replica container environments, connection exhaustion is a known risk. We will test and validate connection pool settings prior to production deployment.
