# AGENT.md — Web App (`apps/web`)

> This app is one package in a monorepo. Read the [root `AGENT.md`](../../AGENT.md) first — it covers the monorepo layout, the shared packages (`@workspace/shared`, `@workspace/ui`), and the rules for not duplicating logic with `apps/mobile`. This file is everything specific to the Next.js app itself.

## Tech Stack

| Layer | Technology | Details / Notes |
|---|---|---|
| **Framework** | Next.js 16.4.2 | App Router, Turbopack, standalone output, dynamically rendered (root layout reads the `locale` cookie) |
| **Runtime & Language** | React 19.2.0, TypeScript 5.7.2 | Strict TypeScript, modern React hooks, SSR safety |
| **Styling** | Tailwind CSS v4.3.3 | CSS-first config in `app/globals.css` (`@theme {}`), no `tailwind.config.ts`. `@source` directives added for `../../packages/ui/src` since v4's auto content-detection doesn't reach outside this directory on its own |
| **Design System** | shadcn/ui + Radix UI, in `../../packages/ui` | `cva`, `clsx`, `tailwind-merge` — import as `@workspace/ui/ui/<name>` / `@workspace/ui/shadcn/<name>` |
| **Database & Auth** | Supabase (`@supabase/supabase-js` 2.45.4) | PostgreSQL, Row Level Security, Auth, Storage — shared with `apps/mobile` |
| **AI SDK** | `@google/genai` (1.45.0) | Google Gemini API (default: `gemini-3.6-flash`) |
| **Maps & Geocoding** | Leaflet + OpenStreetMap + Nominatim | 100% free, zero API keys |
| **Charts** | Recharts 3.8.0 | Responsive BarChart, PieChart, AreaChart |
| **Math & Markdown** | KaTeX 0.16.38 + custom parser | Block & inline parsing, LaTeX math, styled Markdown tables |
| **Toasts** | Sonner 2.0.7 | Toast engine, customizable positioning |
| **Smooth Scrolling** | Lenis 1.3.26 | `data-lenis-prevent` scroll isolation for nested panels |
| **i18n & Accessibility** | `../../packages/shared`'s dictionary + this app's own provider | BG/EN, cookie-based SSR locale, colorblind-friendly mode |
| **Linter** | ESLint 9 (`eslint.config.mjs`) | Flat Config, `eslint-config-next/core-web-vitals` |
| **Icons** | Lucide React 0.468.0 | |

## Directory Structure

```
apps/web/
├── app/                          # Next.js App Router (flat structure, NO route groups)
│   ├── embed/
│   │   └── map/                  # Chrome-free MapView embed for apps/mobile's WebView (/embed/map)
│   ├── api/                      # Backend API Route Handlers — see §2 below
│   ├── auth/callback/            # OAuth callback handler
│   ├── ai/, dashboard/, settings/, features/, about/, login/, signup/, users/[username]/
│   ├── globals.css               # Tailwind v4 theme, HSL CSS variables, @source directives
│   ├── layout.tsx                # Root layout (reads locale cookie, Providers, Header)
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── map/                      # MapView (Leaflet) — the component apps/mobile embeds via WebView
│   ├── dashboard/, modal/, notification/, toast/, upload/, markdown/
│   ├── ui/                       # Only copy-button.tsx, export-button.tsx — stayed here (not packages/ui)
│   │                              #   because they depend on this app's own useI18n() context
│   ├── shadcn/                   # Only notification.tsx — stayed here, re-exports this app's stateful useNotification
│   └── header.tsx, auth-form.tsx, user-menu.tsx, theme-toggle.tsx, language-toggle.tsx,
│       accessibility-toggle.tsx, smooth-scroll-provider.tsx, image-crop-modal.tsx, etc.
│
├── hooks/                        # useAuth, useProfile, useAI, useChatHistory, useAnalytics,
│                                  # useSpeechToText, useGeolocation, useFileUpload, useTheme,
│                                  # useI18n (re-exports from packages/shared), etc. — see §5
├── lib/
│   ├── ai/, geo/, upload/, markdown/, supabase/, api/
│   ├── i18n/
│   │   ├── dictionaries.ts       # THIN RE-EXPORT of @workspace/shared — the real dictionary lives there
│   │   └── provider.tsx          # I18nProvider, useI18n(), tFormat() re-export
│   └── utils.ts                  # cn() helper (duplicated in packages/ui/src/lib/utils.ts, not imported —
│                                  #   this app can't be a dependency of a package it depends on)
├── proxy.ts                      # Server-side route guard for /dashboard, /settings, /ai
└── next.config.ts                # transpilePackages: ['@workspace/shared', '@workspace/ui']
```

## Key Subsystems & Architecture Rules

### 1. Authentication & Route Guarding
- **Dual-layer protection**:
  1. **Server-side proxy (`proxy.ts`)**: redirects unauthenticated requests to `/dashboard`, `/settings`, `/ai` to `/login?redirect=...` before any page JS runs.
  2. **Client-side guard**: pages consume `useAuth()` and redirect when `!loading && !user`.
- **API authentication**: all protected routes (`/api/ai/*`, `/api/analytics/*`, `/api/profile`, `/api/auth/delete-account`) require a Bearer token.
  - Server-side: `authenticateRequest(request)` from `lib/api/auth.ts` — returns `{ user }` or `{ error: NextResponse }`.
  - Client-side: `getAuthHeaders()` from `lib/api/client.ts` to attach the token automatically.
  - **Never trust a client-supplied `user_id`** — always derive it from the verified Bearer token. (`apps/mobile` calls these same endpoints the same way, via its own `apiFetch()`.)

### 2. API Reference

The full endpoint table — the shared contract both `apps/web` and `apps/mobile` rely on — lives in the root [`AGENT.md`](../../AGENT.md), not here, so it has exactly one copy. Implementation lives entirely in this app's `app/api/` tree, route-handler-per-folder, matching that table's paths exactly.

Plus `app/embed/map` — a non-API, chrome-free, unauthenticated route that exists purely for `apps/mobile`'s `WebView` to load (see §4).

### 3. AI Chat & Processing Engine
- `app/api/ai/config.ts`: server-only `PROJECT_NAME`, `PERSONALITY`, `FEATURES`, `RULES`, `GUARDRAILS` — assembled server-side, never exposed to any client. Guardrails mitigate prompt injection, persona manipulation, prompt-leaking.
- Markdown/math: `lib/markdown/` decomposes AI output into structured blocks; code blocks get language detection, copy buttons, diff highlighting (`[!code highlight]`, `[!code ++]`, `[!code --]`); LaTeX via KaTeX.
- `apps/mobile`'s AI Chat tab sends plain text to this exact `/api/ai/chat` endpoint and renders plain-text bubbles — no voice, no image attach, no markdown/LaTeX rendering there. Don't assume mobile parity when changing this engine's input/output shape.

### 4. UI Components & Styling Standards
- Foundational and extended shadcn components both live in `../../packages/ui` — always import from `@workspace/ui/...`, never recreate a component that's already there. A new component goes in `packages/ui/src/{ui,shadcn}/`, not here, unless it has a genuine app-only dependency that would break if moved (the precedent: `copy-button.tsx`, `export-button.tsx`, `shadcn/notification.tsx` — all depend on this app's `useI18n()`/`useNotification()` context).
- Use `React.forwardRef`, `cva` for variants, `cn()` for class merging, `displayName`, and forward `className`.
- Tailwind v4 is CSS-first (`@theme {}` in `globals.css`) — **never create `tailwind.config.js`/`.ts`**. Dark mode is class-based (`.dark` on `<html>`).
- **Tailwind v4 gotcha**: `--color-background: hsl(var(--background))` (what `bg-background` etc. resolve to) is computed *once*, inherited from `:root`. Putting `.dark` on a descendant element does **not** retroactively change an already-inherited `--color-background` value — the class has to land on `<html>` (or wherever the component declaring `--background`'s override needs to be read from) for a dark-mode override to take effect. This bit `app/embed/map/page.tsx` once — read its comments before touching dark-mode logic on any route.
- **Reusing a component on mobile instead of porting it**: if `apps/mobile` needs something from this app that's genuinely infeasible to reimplement with React Native primitives (Leaflet maps, anything needing a real DOM/CSS engine), add a chrome-free route under `app/embed/*` rendering the real component, and have mobile load it in a `WebView`. See `app/embed/map/page.tsx` as the reference, including how it threads the mobile app's theme into the embedded page via a `?theme=` query param.

### 5. Hooks Cheat Sheet (`hooks/`, plus `lib/i18n/provider.tsx`)

| Hook | Key Returns | Purpose |
|---|---|---|
| `useAuth()` | `user`, `loading`, `login`, `signup`, `signInWithGoogle`, `signInWithGitHub`, `logout` | Supabase Auth lifecycle |
| `useProfile(user)` | `profile`, `loading`, `error`, `updateUsername`, `updateVisibility`, `updateExtended`, `updateBio`, `uploadAvatar`, `refetch` | Profile CRUD + real-time sync |
| `useAI()` | `generateText`, `sendMessage`, `messages`, `setMessages`, `clearChat`, `loading`, `error` | AI completion & chat |
| `useChatHistory(user)` | `conversations`, `activeConversationId`, `createConversation`, `selectConversation`, `deleteConversation`, `saveMessage`, `loading` | Per-user chat persistence |
| `useSpeechToText(opts)` | `transcript`, `isListening`, `isTranscribing`, `isSupported`, `engine`, `startListening`, `stopListening`, `error` | Universal voice input |
| `useGeolocation(opts)` | `coordinates`, `address`, `loading`, `error`, `getCurrentLocation` | GPS + reverse geocoding |
| `useAnalytics(user)` | `stats`, `trackEvent`, `refreshStats`, `loading` | Dashboard metrics & event logging |
| `useFileUpload(opts)` | `file`, `preview`, `uploading`, `progress`, `selectFile`, `upload`, `reset` | Upload presets & lifecycle |
| `useTheme()` | `theme`, `toggle` | Dark/light, localStorage-backed |
| `useAccessibility()` | `colorblindMode`, `toggleColorblindMode` | Colorblind-friendly mode |
| `useI18n()` | `t`, `locale`, `setLocale` | BG/EN strings from `@workspace/shared`, cookie-backed for SSR |

### 6. Internationalization & Accessibility (web implementation detail)
Source of truth is `packages/shared/src/i18n.ts` — this app's `lib/i18n/dictionaries.ts` is a thin re-export. See the root `AGENT.md` and [`../../docs/i18n-and-accessibility.md`](../../docs/i18n-and-accessibility.md) for the shared dictionary; the web-specific parts worth knowing here:
- **Locale as a cookie is load-bearing**: `app/layout.tsx` reads it via `cookies()` and renders `<html lang={locale}>` + `I18nProvider initialLocale={locale}` directly — reverting to a client-only `localStorage` read reintroduces a full-tree hydration mismatch on every translated string (happened once, see `docs/CHANGELOG.md`). Consequence: every route here is server-rendered on demand, not statically prerendered.
- **`useAccessibility()`** toggles colorblind-friendly mode (`.colorblind` on `<html>`), remapping `--success`/`--destructive` to blue/amber and darkening `--border` for WCAG 1.4.11. **New status colors MUST use the `success`/`destructive` tokens**, never hardcoded `emerald-500`/`red-500`.

### 7. Database & Row Level Security
One Supabase project, shared with `apps/mobile`. Full detail in the root `AGENT.md` and [`../../docs/security-and-rls.md`](../../docs/security-and-rls.md) — the short version: a new table gets RLS enabled with **0 policies** by default, so queries silently return `[]`. Apply a policy immediately from [`../../database/scripts/rls-boilerplate-templates.sql`](../../database/scripts/rls-boilerplate-templates.sql).

## Development Workflow

```bash
pnpm dev          # Dev server with Turbopack
pnpm type-check   # TypeScript check
pnpm lint         # ESLint (eslint.config.mjs)
pnpm build        # Production build
pnpm start        # Production server (no root-level alias for this one)
```
Run from this directory, or prefix with `pnpm --filter web` from the repo root.

### Database Migration Order
From `../../database/scripts/`, in order: `user-profiles-table.sql` → `ai-chat-history-tables.sql` → `analytics-events-table.sql` → `avatar-storage-bucket.sql` → `add-profile-visibility.sql` → `add-profile-extended-fields.sql` → `fix-profile-rls-policy.sql` → `rls-boilerplate-templates.sql` → *(optional)* `seed-demo-data.sql`. Or run `fresh-database-setup.sql` once instead of all of them individually.

### Deployment
Deployed to Vercel. Vercel's "Root Directory" project setting must point at `apps/web`. The root `turbo.json`'s `globalEnv` must list every server-only env var this app reads at build time (`NEXT_PUBLIC_*` vars are auto-passed-through by Turbo's Next.js detection; plain secrets like `SUPABASE_SERVICE_ROLE_KEY`/`GEMINI_API_KEY` are not — a missing one fails the build with a cryptic "X is required" error deep in module evaluation).

## Agent Coding Guidelines

1. **Component placement**: new shadcn/Radix primitives go in `../../packages/ui/src/{ui,shadcn}/`, not here — unless they have a genuine app-only dependency (see §4's precedent).
2. **No route groups**: flat routes in `app/` (`app/dashboard/page.tsx`, not `app/(dashboard)/...`).
3. **No barrel exports** for components — explicit imports to the exact file.
4. **`@/` is this app's own alias** (`tsconfig.json`'s `@/*` → `./*`), not monorepo-wide. Cross-package imports use the package name (`@workspace/shared`, `@workspace/ui/...`).
5. **Hydration safety**: never read `localStorage` synchronously inside a `useState` initializer for a value rendered directly in JSX — the server's default and the client's real value will disagree. SSR-correct values (locale) go through a cookie read server-side instead; everything else starts at the server-matched default and syncs from `localStorage` in a post-mount `useEffect` (one frame of accepted flash — see `hooks/useAccessibility.ts`).
6. **Security**: always verify authentication server-side with `authenticateRequest(request)` for private API routes. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Validate user inputs (URLs, MIME types, size limits) server-side.
7. **Verify before calling it done**: `pnpm type-check` + `pnpm lint` from here (or the repo root), and for anything involving Tailwind dark-mode classes, Radix portals, or a `packages/ui` import path, a Playwright check against a real built page catches what the compiler won't.
