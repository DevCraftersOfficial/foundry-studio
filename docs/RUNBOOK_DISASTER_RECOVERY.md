# Runbook: Operations, Migrations & Disaster Recovery

Foundry Studio — Production Operational Guidance

---

## 1. Architecture Overview & Persistent State

Foundry Studio stores state in two distinct layers in single-host production deployments:
1. **Relational Database (`PostgreSQL`):** Contains schemas, users, posts, revisions, categories, and media document records.
2. **Local Media Storage (`/app/media`):** Local filesystem directory storing physical uploaded files, image variations, and binary blobs.

Because both layers must remain synchronized, **backups, restores, and rollbacks must be coordinated across both layers**.

---

## 2. Pre-Deployment Database Migrations

### 2.1. Principle: Explicit Single-Run Execution
- Foundry Studio uses Payload CMS with Drizzle / PostgreSQL migrations (`push: false` in production).
- **Never run migrations concurrently across web replicas.** Migrations must be executed exactly once as a standalone pre-deployment step before new web containers are started.

### 2.2. Standard Migration Sequence
1. **Take a snapshot backup:** Always take a fresh snapshot of PostgreSQL and media files before initiating a migration.
   ```bash
   # Run pg_dump
   docker compose -f docker-compose.prod.yml exec postgres pg_dump -U foundry_admin -d foundry_studio -Fc -f /var/lib/postgresql/data/pre_migration_backup.dump
   ```
2. **Execute migration container:**
   ```bash
   docker compose -f docker-compose.prod.yml run --rm migration
   ```
   Or on bare metal / host environment:
   ```bash
   npm run migrate
   ```
3. **Inspect Output:** Ensure all migration steps return `Migrations applied successfully`.
4. **Deploy / Restart Application:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d app
   ```

---

## 3. Backup Procedures

### 3.1. Coordinated PostgreSQL Backup
Use PostgreSQL's custom format (`-Fc`), which includes table definitions, indexes, constraints, and data with compression and flexible restore options.

```bash
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/foundry-studio/backups

mkdir -p "${BACKUP_DIR}"

# 1. Database dump
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U foundry_admin -d foundry_studio -Fc \
  > "${BACKUP_DIR}/db_${BACKUP_TIMESTAMP}.dump"
```

### 3.2. Coordinated Media Directory Backup
Back up the persistent media volume synchronously alongside the database dump:

```bash
# 2. Media archive
docker run --rm \
  -v foundry_media_data:/media:ro \
  -v "${BACKUP_DIR}":/backup \
  alpine:latest \
  tar -czf "/backup/media_${BACKUP_TIMESTAMP}.tar.gz" -C /media .
```

Verify that both `db_${BACKUP_TIMESTAMP}.dump` and `media_${BACKUP_TIMESTAMP}.tar.gz` are non-empty and have matching timestamps.

---

## 4. Disaster Recovery & Restore Procedures

### 4.1. Prerequisites & Safety Warning
> [!CAUTION]
> Restoring a database drops and recreates schema tables. All transactions and media uploaded after the snapshot timestamp will be lost. Always stop the web application before restoring to prevent write collisions.

### 4.2. Restore Step-by-Step
1. **Stop the Application Service:**
   ```bash
   docker compose -f docker-compose.prod.yml stop app
   ```
2. **Restore PostgreSQL Database:**
   ```bash
   TARGET_BACKUP="/opt/foundry-studio/backups/db_YYYYMMDD_HHMMSS.dump"

   # Drop and recreate schema / restore with clean flags
   docker compose -f docker-compose.prod.yml exec -T postgres \
     pg_restore -U foundry_admin -d foundry_studio --clean --if-exists "${TARGET_BACKUP}"
   ```
3. **Restore Media Storage:**
   ```bash
   TARGET_MEDIA="/opt/foundry-studio/backups/media_YYYYMMDD_HHMMSS.tar.gz"

   docker run --rm \
     -v foundry_media_data:/media \
     -v "$(dirname "${TARGET_MEDIA}")":/backup \
     alpine:latest \
     sh -c "rm -rf /media/* && tar -xzf /backup/$(basename "${TARGET_MEDIA}") -C /media && chown -R 1001:1001 /media"
   ```
4. **Restart Application:**
   ```bash
   docker compose -f docker-compose.prod.yml start app
   ```
5. **Verify Health Endpoint:**
   ```bash
   curl -i http://127.0.0.1:3000/api/health
   ```
   Must return `HTTP/1.1 200 OK` with `{"status":"ok","database":"connected"}`.

---

## 5. Rollback Migrations & Caveats

### 5.1. Danger of Rollback Migrations
> [!WARNING]
> Database migration `down` operations can be **destructive**. Dropping columns, removing enum values, or dropping tables causes irreversible loss of any content or metadata stored in those columns since the migration was applied.

### 5.2. Mandatory Operator Protocol for Rollbacks
1. **Do not run rollback automatically.** A rollback requires an explicit operator decision after reviewing the Drizzle migration SQL file.
2. If schema changes are destructive, prefer restoring the pre-migration snapshot rather than attempting automated down-migrations.
3. If an explicit down-migration is sanctioned by engineering:
   ```bash
   # Run migration down via Payload CLI (if supported) or restore validated backup
   docker compose -f docker-compose.prod.yml run --rm migration npm run migrate:down
   ```

---

## 6. Single-Host Media Limitations & Recovery

### 6.1. Single-Host Boundary
- Under the initial zero-cost baseline, media files are stored locally on persistent Docker volumes (`foundry_media_data`).
- Single-host storage provides local host disk durability, but **does not provide geo-redundancy, high availability, or automatic failover**.
- Disk failure on the single host will result in unrecoverable media loss unless external off-host backups are maintained.

### 6.2. Permission & Non-Root Execution
- The Next.js container executes under non-root UID 1001 (`nextjs`).
- The persistent media directory `/app/media` must have ownership `1001:1001` and permissions `755`.
- If media fails to save with `EACCES` or permission errors after host maintenance, fix volume permissions:
  ```bash
  docker run --rm -v foundry_media_data:/media alpine chown -R 1001:1001 /media
  ```

---

## 7. Connection Failures & Safe Restart Procedures

### 7.1. Database Disconnection Handling
- Payload CMS and Drizzle connect to PostgreSQL via connection pooling.
- Temporary network partitions or database restarts trigger automatic reconnect attempts.
- The `/api/health` readiness probe detects pool outages and returns `HTTP 503 Service Unavailable` with `{"status":"degraded","database":"disconnected"}` while the pool recovers.
- Docker container health check automatically monitors the web app and restarts it if unresponsive.

### 7.2. Safe Service Restart Sequence
When performing host reboots or database maintenance:
```bash
# Graceful stop
docker compose -f docker-compose.prod.yml down

# Bring up PostgreSQL first and verify health
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U foundry_admin -d foundry_studio

# Bring up App
docker compose -f docker-compose.prod.yml up -d app
```

---

## 8. Executed Recovery Drill Evidence (Milestone FS-006-V)

To verify recovery feasibility without risking production or development data, an automated end-to-end backup and restore drill was executed against an isolated disposable database (`foundry_disposable_drill`) and isolated filesystem directory:

### 8.1. Drill Verification Evidence
1. **Fresh Database Migrations:** Created clean disposable database and executed `npx payload migrate`. All 3 migrations (`20261022_155612_init`, `20261022_170247_add_publishing_domain`, `20261022_183000_add_editorial_workflow`) executed cleanly from scratch.
2. **Re-Run Idempotency:** Executed `npx payload migrate` again; completed with 0 errors and zero unexpected schema mutations.
3. **Failure Blocking Gate:** Simulated invalid database credentials; migration runner exited with code 1, which blocks `app` container startup in `docker-compose.prod.yml`.
4. **Coordinated Backup Execution:**
   - Dumped PostgreSQL database: `pg_dump -Fc` (produced 53,357 byte binary archive).
   - Dumped media directory: `tar -czf` (produced 193 byte compressed archive).
5. **Drop & Recreate Database:** Completely destroyed `foundry_disposable_drill` (`DROP DATABASE`) and recreated an empty database.
6. **Restore Verification:**
   - Restored database from dump via `pg_restore`.
   - Verified restored category record: `SELECT id, name, slug FROM categories WHERE slug = 'drill-category'` returned row successfully.
   - Restored media archive to `restored_media/` and executed `diff` against original file: verified byte-for-byte identical content.
7. **Clean Teardown:** Dropped disposable database and removed drill scratch files.

---

## 9. Host-Level Firewall & Reverse-Proxy Requirements

Because `docker-compose.prod.yml` binds the Next.js application strictly to `127.0.0.1:3000` and omits host ports for PostgreSQL:

1. **Reverse Proxy Termination:** A host-level reverse proxy (e.g. Caddy, Nginx, or Traefik) must listen on public ports `80` and `443`, terminate SSL certificates, and proxy traffic to `http://127.0.0.1:3000`.
2. **Host Firewall (UFW / iptables):**
   - Allow incoming traffic on port `80` (HTTP) and `443` (HTTPS).
   - Deny external access to all other ports. Specifically, port `5432` (PostgreSQL) and port `3000` must never be exposed to public network interfaces.
3. **Proxy Headers:** The reverse proxy must forward standard headers:
   ```nginx
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

