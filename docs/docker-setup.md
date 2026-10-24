# Docker Setup Guide

Builds `apps/web` only — `apps/mobile` is never part of the Docker image (Expo has no place in a server container). Run everything below from the **repo root**; the build context is the whole monorepo, not `apps/web/`.

**Note on `.env` location**: this is the one place in the project where the env file genuinely belongs at the **repo root** (`docker-compose.yml`'s `env_file: - .env` reads it from there) — different from local development, where `pnpm dev` reads `apps/web/.env` instead (see `docs/SETUP.md`). Don't confuse the two; a `.env` at the root does nothing for `pnpm dev`, and an `apps/web/.env` does nothing for `docker-compose up`.

> **Status**: the Dockerfile has never been verified with a real `docker build` in this project's history (no Docker available in the dev sandbox it was last touched from). It was updated to copy `packages/ui`'s manifest/`node_modules` alongside `packages/shared`'s when `packages/ui` was introduced (see `docs/CHANGELOG.md`), but that specific fix is also unverified. Test a real build before relying on this in production.

## Prerequisites

- **Docker Desktop** (v20.10 or higher) with Docker Compose
- Verify: `docker --version && docker compose version`

## Quick Start

```bash
# Create .env file with your credentials first, then:
docker-compose up --build
```

The app will be available at **http://localhost:3000**.

## How It Works

### Dockerfile (Multi-Stage Build)

The Dockerfile uses 4 stages for an optimized production image:

1. **base** - Node.js 20 Alpine + pnpm
2. **deps** - Copies every workspace member's `package.json` (`apps/web`, `apps/mobile` — even though mobile is never built, pnpm needs its manifest to resolve the workspace against `pnpm-lock.yaml`'s full importer set — `packages/shared`, `packages/ui`) then `pnpm install --frozen-lockfile`
3. **builder** - Copies each package's `node_modules` from `deps`, then `pnpm --filter web build` (public env vars baked in via build args)
4. **runner** - Minimal production image, runs as non-root `nextjs` user. Next's standalone output mirrors the monorepo path it was built from, so the entrypoint is `node apps/web/server.js`, not `node server.js`

### Build-Time vs Runtime Variables

**Build-time** (passed as `--build-arg`, baked into client JS):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PROJECT_NAME`
- `NEXT_PUBLIC_AI_MODEL`

**Runtime** (passed via `env_file` or `environment`, server-only):

- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### docker-compose.yml

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_PROJECT_NAME: ${NEXT_PUBLIC_PROJECT_NAME:-Hackathon Starter}
        NEXT_PUBLIC_AI_MODEL: ${NEXT_PUBLIC_AI_MODEL:-gemini-3.6-flash}
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

### Health Check

The container includes a health check that pings `http://localhost:3000/` every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1
```

## Environment Setup

Create a `.env` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GEMINI_API_KEY=your-gemini-key

# Project
NEXT_PUBLIC_PROJECT_NAME=My Project
NEXT_PUBLIC_AI_MODEL=gemini-3.6-flash
```

## Manual Build

```bash
# Build with build args
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  --build-arg NEXT_PUBLIC_PROJECT_NAME="My App" \
  -t hackathon-app .

# Run with runtime env vars
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e GEMINI_API_KEY=your-key \
  hackathon-app
```

## .dockerignore

The following are excluded from the build context:

```
node_modules, .next, .git, .env*, *.md, docs, docs-scraper, .vscode, .idea, .claude
```

## Common Commands

```bash
docker-compose up --build        # Build and run
docker-compose up -d             # Run in background
docker-compose logs -f app       # View logs
docker-compose down              # Stop
docker-compose down -v           # Stop and remove volumes
docker builder prune             # Clear build cache
```

## Troubleshooting

| Issue                     | Solution                                                   |
|---------------------------|------------------------------------------------------------|
| Port 3000 in use          | Change to `"3001:3000"` in docker-compose.yml              |
| Build fails ENOENT        | Check `.dockerignore` isn't excluding needed files         |
| Env vars not loading      | Verify `.env` exists and `env_file` points to it           |
| Supabase connection fails | Check env vars: `docker exec <container> env`              |
| Image too large           | Ensure multi-stage build is working (final stage = runner) |

## Deployment

```bash
# Tag and push to registry
docker build -t your-registry/hackathon-app:latest .
docker push your-registry/hackathon-app:latest

# Pull and run on server
docker pull your-registry/hackathon-app:latest
docker run -d -p 3000:3000 --env-file .env your-registry/hackathon-app:latest
```

Works with: Vercel, Railway, Render, DigitalOcean App Platform, AWS/GCP/Azure container services.
