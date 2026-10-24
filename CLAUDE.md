# CLAUDE.md

This file provides project-specific commands, conventions, and architectural context for Claude.

## Monorepo Layout

This is a Turborepo-managed pnpm workspace (`pnpm-workspace.yaml` + `turbo.json` at the root):

- **`apps/web/`** — the Next.js app (everything described below). Its own `package.json`, `next.config.ts`, `tsconfig.json`, etc. live here, not at the repo root.
- **`apps/mobile/`** — the Expo Router app (SDK 57, pinned to match the tester's Expo Go install — don't bump it without checking first). No backend of its own: every screen calls `apps/web`'s deployed `/api/*` routes through `apps/mobile/lib/api-client.ts`'s `apiFetch()`, which attaches the native Supabase session as a Bearer token. Full guide: [`docs/mobile.md`](docs/mobile.md).
- **`packages/shared/`** (`@workspace/shared`) — the single source of truth both apps import from: `UserProfile`/`ChatMessage`/`DashboardStats`/etc. types, Zod schemas, and the *entire* i18n system (`dictionaries`, `pickLocale`, `tFormat`, `LANGUAGE_META`, `isLocale` — moved verbatim from `apps/web/lib/i18n/dictionaries.ts`, which now just re-exports from here). Add a new translated string here, not in `apps/web`, so both apps see it.
- **`packages/ui/`** (`@workspace/ui`) — `apps/web`'s shadcn/ui + Radix component library (57 components, moved verbatim from `apps/web/components/{ui,shadcn}/`). **Cannot be used by `apps/mobile`** — Radix needs DOM portals and shadcn needs a Tailwind CSS build, neither of which exists on React Native. That's a hard platform wall, not an import-path problem; `apps/mobile/components/ui/` is a separate, from-scratch RN component library that mirrors this package's component/variant *names* for API parity, not its code.

## Quick Commands

Run from the **repo root** — Turborepo fans these out to whichever workspace packages define the script (`dev`, `build`, `lint`, `type-check` — see root `package.json`).

To target just the web app directly (e.g. for `start`, which has no root script): `pnpm --filter web <script>`, or `cd apps/web && pnpm <script>`.

Mobile has its own commands, run from `apps/mobile/` — see [`docs/mobile.md`](docs/mobile.md) for the full list and the pnpm-shim/SDK-pinning gotchas. The one that actually proves mobile code compiles (not just `tsc`) is:
```bash
cd apps/mobile && pnpm exec expo export --platform android   # real Metro bundle, not just a type-check
```

## Where app-specific instructions live

This file is the **common source** — shared by both apps. It intentionally does not contain Next.js route lists, hook signatures, or Tailwind/shadcn conventions anymore; those live in each app's own doc, so there's exactly one copy of each:

- **Web** (Next.js, API routes, hooks, Tailwind/shadcn conventions, auth guarding): [`apps/web/AGENT.md`](apps/web/AGENT.md)
- **Mobile** (Expo/React Native conventions, SDK pinning, the WebView embed pattern): [`apps/mobile/AGENTS.md`](apps/mobile/AGENTS.md), full architecture in [`docs/mobile.md`](docs/mobile.md)
- **Full monorepo guide** (the API contract both apps share, RLS, the three mobile↔web integration patterns, deployment): [`AGENT.md`](AGENT.md)

## Cross-cutting rules (apply to both apps)

- **RLS**: any new Supabase table needs a policy immediately or queries silently return `[]` — see [`AGENT.md`](AGENT.md#4-database--row-level-security-rls).
- **i18n**: the dictionary lives in `packages/shared/src/i18n.ts`, not in either app — add a string once (`myKey: {en: '...', bg: '...'}`), both apps see it.
- **Never trust a client-supplied `user_id`** — always derive it server-side from the verified Bearer token, for routes either app calls.
- **Don't duplicate logic across apps** — see [`AGENT.md`](AGENT.md#3-mobile--web-integration-patterns) for the three valid ways to share a feature between web and mobile.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
