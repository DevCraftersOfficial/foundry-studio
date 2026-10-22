# Multi-stage hardened production Dockerfile for Foundry Studio
# Next.js 16 (App Router) + Payload CMS 3.x on Node 22 Alpine

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Install dependencies with clean reproducible lockfile
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2. Build the application with Next.js standalone output
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=https://foundry-studio.dev

# Run build with ephemeral placeholders in single RUN step to avoid baking secrets into Docker layers
RUN PAYLOAD_SECRET=build_time_payload_secret_placeholder_at_least_32_chars \
    PREVIEW_SECRET=build_time_preview_secret_placeholder_min_16_chars \
    DATABASE_URI=postgresql://postgres:postgres@localhost:5432/foundry_studio \
    npm run build

# 3. Minimal production runtime image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Ensure runtime directories for media uploads and cache exist with proper permissions
RUN mkdir -p /app/media /app/.next && \
    chown -R nextjs:nodejs /app/media /app/.next

# Copy static assets and standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Container Healthcheck targeting the internal health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health?check=live || exit 1

# Enforce non-root execution
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
