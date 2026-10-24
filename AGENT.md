# AGENT.md — Monorepo Guide for AI Agents

> **Audience**: AI agents (Claude, Gemini, GPT, Copilot, etc.) and developers.
> **Repository**: `hackathon-startup-template` — a Turborepo-managed pnpm monorepo.
> **This file covers what's common to the whole repo.** For anything specific to one app, go to that app's own doc — don't expect to find web or mobile implementation detail here:
> - **Web** (`apps/web`): [`apps/web/AGENT.md`](apps/web/AGENT.md) · [`apps/web/README.md`](apps/web/README.md)
> - **Mobile** (`apps/mobile`): [`apps/mobile/AGENTS.md`](apps/mobile/AGENTS.md) · [`apps/mobile/README.md`](apps/mobile/README.md) · [`docs/mobile.md`](docs/mobile.md) (deep architecture reference)
>
> This root `AGENT.md` and [`CLAUDE.md`](CLAUDE.md) are the common source both apps' agents should already have loaded — read this one first regardless of which app you're about to touch.

---

## 0. Orientation

This started as a single Next.js app and was migrated into a monorepo. **Nothing lives at the repo root except config and genuinely shared code** — if you're about to write `app/`, `components/`, `hooks/`, or `lib/` as a path, stop: that's the pre-migration layout, and it's wrong now.

```
hackathon-startup-template/
├── apps/
│   ├── web/              # The Next.js app — AGENT.md + README.md inside
│   └── mobile/            # The Expo Router app — AGENTS.md + README.md inside
├── packages/
│   ├── shared/             # @workspace/shared — types, Zod schemas, the i18n system (§2)
│   └── ui/                 # @workspace/ui — apps/web's shadcn/Radix component library (§2)
├── database/scripts/      # Supabase SQL migrations (shared by concept, not by app)
├── docs/                  # Topic-by-topic deep docs
├── Dockerfile, docker-compose.yml, turbo.json, pnpm-workspace.yaml
└── AGENT.md, CLAUDE.md, README.md   # ← you are here
```

**The two apps share logic, never UI code.** `apps/mobile` has no backend of its own — every mobile screen that needs data calls `apps/web`'s deployed `/api/*` routes (same backend, not a reimplementation) via `apps/mobile/lib/api-client.ts`'s `apiFetch()`. Business logic, types, and the i18n dictionary live once in `packages/shared` and both apps import it. But `apps/web`'s actual UI components (`packages/ui`, built on Radix + a Tailwind CSS build) **cannot run on React Native** — there's no DOM, no CSS engine. That's a hard platform wall, not an oversight: `apps/mobile/components/ui/` is a separate, from-scratch RN component library that mirrors `packages/ui`'s component and variant *names* (same `Button` variants: `default|destructive|outline|secondary|ghost|link`) so the mental model carries over, even though the code doesn't. The one exception is anything DOM-rendered that mobile genuinely needs pixel-identical (the Leaflet map) — that gets embedded live via a `WebView` pointed at a chrome-free `apps/web/app/embed/*` route, reusing the real component instead of porting it.

See §3 for the full decision tree on which of these patterns applies when you're asked to add a web feature to mobile (or vice versa).

---

## 1. What this repo is

A production-grade, highly modular **hackathon and MVP starter template**: a Next.js web app plus an Expo mobile app sharing one Supabase backend, engineered to let teams build and ship full-stack products (web + native) within 24–48 hours without sacrificing production-level architecture.

- **`apps/web`** is the template's infrastructure layer: Supabase auth (email/password + Google/GitHub OAuth), user profiles, 57 UI components, BG/EN i18n with a colorblind-friendly mode, Docker support. Its generic marketing pages and the AI-chat/analytics-dashboard *pages* were removed once KingFloor became the actual product (see below) — the AI chat and analytics **API routes** (`/api/ai/*`, `/api/analytics/*`) are still there and still used by `apps/mobile`, just with no web page consuming them anymore.
- **KingFloor** (`apps/web/app/building/*`, `apps/web/app/api/building/*`) is the actual product, and `/building` is the web app's home screen post-login: a платформа за етажна собственост (condo/HOA management). Buildings → units, fees & payments, expenses, announcements, voting (with document attachments), maintenance issues. Full detail: [`docs/kingfloor.md`](docs/kingfloor.md).
- **`apps/mobile`** calls that same backend: AI chat, a dashboard, account settings, a live map (via `WebView`), dark mode, and BG/EN i18n — all against `apps/web`'s existing API, not reimplemented. Full detail: [`docs/mobile.md`](docs/mobile.md).

---

## 2. Shared Packages

### `packages/shared/` (`@workspace/shared`)
```
packages/shared/src/
├── types.ts       # Locale, UserProfile, ChatMessage, DashboardStats, DailyMessageStat, AnalyticsEvent
├── schemas.ts      # Zod validation schemas (loginSchema, signupSchema, etc.)
├── i18n.ts         # The ENTIRE i18n system: the strings dictionary, pickLocale(), tFormat(), isLocale(),
│                   #   LANGUAGE_META, LOCALES — moved verbatim from apps/web's original dictionaries.ts.
│                   #   Add new strings here. Not in apps/web, not in apps/mobile.
└── index.ts        # Barrel: export * from './types' / './schemas' / './i18n'
```
No build step — ships raw `.ts`, consumed directly (`transpilePackages` in `apps/web/next.config.ts`; Metro transpiles mobile's TS automatically). This package is the actual "common source" at the *code* level — if you're adding a type, schema, or translated string that both apps need (or even might need later), it goes here, not duplicated in each app.

### `packages/ui/` (`@workspace/ui`)
```
packages/ui/src/
├── ui/        # 25 of apps/web's components/ui/* files, moved verbatim
├── shadcn/    # 29 of apps/web's components/shadcn/* files, moved verbatim
└── lib/utils.ts  # cn() — duplicated from apps/web/lib/utils.ts, not imported (apps/web can't depend
                   #   on a package that depends on apps/web)
```
Import as `@workspace/ui/ui/<name>` / `@workspace/ui/shadcn/<name>` / `@workspace/ui/lib/utils`. **`apps/mobile` cannot import from this package at all** — see §0. This is `apps/web`-only infrastructure that happens to live in `packages/` for build-tooling reasons (Tailwind/Next need it as a separate workspace package to transpile correctly), not because it's shared with mobile.

### `database/scripts/`
Still at the repo root, unchanged by the migration — Supabase SQL migrations & seed data, conceptually backend infrastructure rather than part of either app. Run order and full guide: [`docs/supabase-setup.md`](docs/supabase-setup.md).

---

## 3. Mobile ↔ Web Integration Patterns

When asked to add a web feature to mobile (or the reverse), there are exactly three valid patterns — pick based on what the feature actually needs, not habit:

1. **Call the same backend** (AI chat, dashboard, settings): port the *logic* (hook shape, API calls) to a plain RN hook in `apps/mobile/hooks/`, reusing `apiFetch()`. Never reimplement a Next.js API route on-device.
2. **Share pure data/logic** (types, the i18n dictionary, Zod schemas, color token *values*): put it in `packages/shared`, have both apps import it. Never let one app's copy drift from the other's.
3. **Embed the real DOM component via `WebView`** (maps, anything genuinely infeasible to reimplement natively): add a chrome-free `apps/web/app/embed/*` route, load it from a `WebView`. Never duplicate Leaflet/Radix/Tailwind-dependent rendering logic natively.

What you should never do: hand-roll a second implementation of logic that already exists on web "because it's mobile." The platform differs at the *rendering* layer (RN primitives vs. DOM), essentially never at the *logic* layer (what API to call, what shape the data is, what the dictionary string says). That drift — two copies of the same logic quietly diverging — is exactly what this architecture exists to prevent.

---

## 4. Database & Row Level Security (RLS)

One Supabase project, used identically by both apps' native clients.
- `public.profiles`: auto-created on signup via `handle_new_user()` trigger. Public profiles readable by anyone; private ones only by the owner.
- `public.chat_conversations` / `chat_messages`: restricted to the owner (`auth.uid() = user_id`, or a relational `EXISTS` check for messages).
- `public.analytics_events`: insert/select restricted to the event's creator.
- `avatars` bucket: public read, write restricted to the owning user's path.

> **⚠️ Critical Hackathon Rule**: a newly created Supabase table gets RLS enabled with **0 policies** by default, so `supabase.from('your_table').select('*')` silently returns `[]` — not an error, just empty. **Always apply a policy immediately** from [`database/scripts/rls-boilerplate-templates.sql`](database/scripts/rls-boilerplate-templates.sql):
> ```sql
> ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Public full access" ON your_table FOR ALL USING (true) WITH CHECK (true);
> ```
> Full cheat sheet (user-isolated, public-read, emergency-disable variants): [`docs/security-and-rls.md`](docs/security-and-rls.md).

---

## 5. The API Contract

All routes live in `apps/web/app/api/` (implementation detail: [`apps/web/AGENT.md`](apps/web/AGENT.md)). Both apps call the exact same deployed instance — mobile never talks to a separate backend. This table is the authoritative shared contract; don't duplicate it elsewhere.

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/auth/signup` | `POST` | No | Creates user + auto-creates profile via DB trigger |
| `/api/auth/login` | `POST` | No | Authenticates credentials, returns session |
| `/api/auth/logout` | `POST` | Yes | Terminates current session |
| `/api/auth/delete-account` | `DELETE` | Yes (Bearer) | Deletes the authenticated user's account & all data |
| `/api/profile` | `GET`/`PUT` | Yes (Bearer) | Fetch / update profile (bio, username, visibility, social handles, display name, location) |
| `/api/users/[username]` | `GET` | No | Public profile lookup (403 if private, 404 if not found) |
| `/api/ai/generate` | `POST` | Yes (Bearer) | One-shot text completion via Gemini |
| `/api/ai/structured` | `POST` | Yes (Bearer) | Strict typed JSON Schema output |
| `/api/ai/vision` | `POST` | Yes (Bearer) | Multimodal image analysis & OCR |
| `/api/ai/transcribe` | `POST` | Yes (Bearer) | Audio transcription via Gemini |
| `/api/ai/chat` | `POST` | Yes (Bearer) | Multi-turn chat with conversation history — called by both apps |
| `/api/ai/history` | `GET`/`POST`/`DELETE` | Yes (Bearer) | Conversation list / create / delete (`?id=`) |
| `/api/ai/history/messages` | `GET`/`POST` | Yes (Bearer) | Messages for `?conversation_id=` / save a message |
| `/api/geo/reverse` | `GET` | No | OSM reverse geocode proxy, cached |
| `/api/geo/search` | `GET` | No | OSM address search proxy, cached |
| `/api/analytics/stats` | `GET` | Yes (Bearer) | Aggregated metrics & 14-day activity — called by both apps |
| `/api/analytics/events` | `GET`/`POST` | Yes (Bearer) | Recent event log (capped at 100) / record a new event |

Non-API route of note: `apps/web/app/embed/map` — chrome-free, no auth, exists purely for `apps/mobile`'s `WebView` to load (§3, pattern 3).

**Never trust a client-supplied `user_id`** from either app — always derive it server-side from the verified Bearer token (`authenticateRequest()` in `apps/web/lib/api/auth.ts`).

---

## 6. Monorepo-Wide Commands & Environment

```bash
pnpm install      # installs all 4 workspace packages
pnpm dev          # web dev server (Turbopack), http://localhost:3000
pnpm type-check   # tsc --noEmit across apps/web, apps/mobile, packages/shared, packages/ui
pnpm lint         # ESLint (web only — mobile/packages have no lint script yet)
pnpm build        # production build (web + packages)
```
`pnpm --filter web <script>` / `pnpm --filter mobile <script>` to target one package directly. App-specific commands (mobile's `expo start`/`expo export`, web's `start`) are in each app's own doc.

**Env files live per-app, not at the root** (except Docker's, which genuinely is root-level — see [`docs/docker-setup.md`](docs/docker-setup.md)):
- `apps/web/.env` — Supabase + Gemini credentials. Template: `apps/web/.env.example`.
- `apps/mobile/.env` — same Supabase project's credentials, plus `EXPO_PUBLIC_API_URL` pointing at a *deployed, phone-reachable* `apps/web` instance (never `localhost`). Template: `apps/mobile/.env.example`.

### Deployment
- **Web**: Vercel, "Root Directory" = `apps/web`. `turbo.json`'s `globalEnv` must list every server-only env var the web app reads at build time.
- **Mobile**: Expo Go only so far (no EAS build/submit configured).
- **Docker**: builds `apps/web` only, from the repo root. Never verified with a real `docker build` in this project's history (no Docker in the dev sandbox) — see [`docs/docker-setup.md`](docs/docker-setup.md).

---

## 7. Agent Coding Guidelines (repo-wide)

1. **Know your package before you write a path.** `apps/web/...`, `apps/mobile/...` (no `src/` wrapper — routes live directly in `app/`), `packages/shared/src/...`, `packages/ui/src/...`. A bare `app/`/`components/`/`hooks/`/`lib/` path with no app prefix is stale muscle memory from before the migration.
2. **Don't duplicate logic across apps — share it or call it.** See §3. The single most common mistake to avoid: reimplementing a web feature's business logic from scratch on mobile "because it's a different platform."
3. **Never trust a client-supplied `user_id`** — derive it from the verified Bearer token, server-side, in every protected route, from either app.
4. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to any client, web or mobile.
5. **Respect RLS** — never bypass it except for a deliberate, server-side administrative operation via the admin client.
6. **Verify before calling anything done**: `pnpm type-check` and `pnpm lint` from the repo root, **and** for any mobile change, `cd apps/mobile && pnpm exec expo export --platform android` — `tsc` passing does not mean Metro can bundle it. For a web UI change, a Playwright check against a real built page catches what the compiler won't (Tailwind dark-mode classes, Radix portals, `packages/ui` import paths).
7. **Keep this file and the per-app docs honest.** An agent reading a stale `AGENT.md` will confidently write code for a repository that no longer exists — update whichever doc actually owns the thing you just changed.
