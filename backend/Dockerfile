# KoreField Academy — NestJS Backend
# Multi-stage production build using pnpm on node:20-alpine.
# Stages: deps → build → production
# Exposes port 3001, runs as non-root user.

# ──────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────
# Stage 2: Build application
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json pnpm-lock.yaml tsconfig.json nest-cli.json ./
COPY src ./src

RUN pnpm prisma generate
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
COPY --from=build --chown=kfuser:kfgroup /app/prisma ./prisma
COPY --from=build --chown=kfuser:kfgroup /app/package.json ./

USER kfuser

EXPOSE 3001

CMD ["dumb-init", "node", "dist/main.js"]
