# KoreField Academy — Next.js 14 Frontend
# Multi-stage production build using pnpm on node:20-alpine.
# Uses Next.js standalone output for minimal image size.
# Stages: deps → build → production
# Exposes port 3000, runs as non-root user.

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
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json next.config.js tailwind.config.ts postcss.config.js ./
COPY src ./src
COPY public ./public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# ──────────────────────────────────────────────
# Stage 3: Production image
# ──────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 kfgroup && \
    adduser --system --uid 1001 kfuser

# Copy Next.js standalone output
COPY --from=build --chown=kfuser:kfgroup /app/.next/standalone ./
COPY --from=build --chown=kfuser:kfgroup /app/.next/static ./.next/static
COPY --from=build --chown=kfuser:kfgroup /app/public ./public

USER kfuser

EXPOSE 3000

CMD ["dumb-init", "node", "server.js"]
