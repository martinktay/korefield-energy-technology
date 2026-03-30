# KoreField Academy — TypeScript SQS Workers
# Multi-stage production build using pnpm on node:20-alpine.
# Each worker is started via a different entrypoint (e.g., node dist/email-delivery.js).
# Stages: deps → build → production
# Default CMD: cert-generation worker. Runs as non-root user.

# ──────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────
# Stage 2: Build application
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src

RUN pnpm build

# Prune dev dependencies for production
RUN pnpm prune --prod

# ──────────────────────────────────────────────
# Stage 3: Production image
# ──────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 kfgroup && \
    adduser --system --uid 1001 kfuser

COPY --from=build --chown=kfuser:kfgroup /app/dist ./dist
COPY --from=build --chown=kfuser:kfgroup /app/node_modules ./node_modules
COPY --from=build --chown=kfuser:kfgroup /app/package.json ./

USER kfuser

# Default worker — override via docker-compose or ECS task definition:
#   node dist/email-delivery.js
#   node dist/ai-workflow.js
#   node dist/analytics.js
#   node dist/notifications.js
#   node dist/payment-events.js
CMD ["dumb-init", "node", "dist/cert-generation.js"]
