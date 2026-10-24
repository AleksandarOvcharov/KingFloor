FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

ENV NEXT_TELEMETRY_DISABLED=1

# --- Dependencies ---
# pnpm needs every workspace member's package.json present to resolve the
# workspace before installing, not just the root one.
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
# apps/mobile isn't built or run here (Expo has no place in this image),
# but its package.json still has to exist for pnpm to resolve the
# workspace against pnpm-lock.yaml's full set of importers.
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN pnpm install --frozen-lockfile

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

# Public env vars must be available at build time (baked into client JS)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_PROJECT_NAME
ARG NEXT_PUBLIC_AI_MODEL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_PROJECT_NAME=$NEXT_PUBLIC_PROJECT_NAME
ENV NEXT_PUBLIC_AI_MODEL=$NEXT_PUBLIC_AI_MODEL

RUN pnpm --filter web build

# --- Runner ---
# Next.js standalone output mirrors the monorepo path it was built from, so
# the server entrypoint lands at ./apps/web/server.js, not ./server.js.
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Server-only env vars are provided at runtime via docker-compose or docker run
# SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
