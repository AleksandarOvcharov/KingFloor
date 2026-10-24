# Hackathon Startup Template — Web App

The Next.js half of the monorepo. For the Expo mobile app, see [`../mobile/README.md`](../mobile/README.md). For how the two relate, see the [root README](../../README.md) and [root AGENT.md](../../AGENT.md).

A full-featured Next.js app: Supabase authentication, an AI chatbot (Google Gemini), OpenStreetMap geolocation, an analytics dashboard, 57 UI components, BG/EN internationalization with a colorblind-friendly mode, and Docker support.

## Features

- **Authentication**: Supabase email/password + Google OAuth + GitHub OAuth with custom hooks
- **User Profiles**: Profile management with username, bio, and avatar upload (drag-to-crop)
- **AI Chatbot, Structured Output, Vision OCR & Voice Input**: Multi-turn chat, strict JSON Schema generation (`generateStructured<T>`), multimodal vision/OCR (`analyzeImage<T>`), and universal real-time voice typing powered by Google Gemini (`gemini-3.6-flash`)
- **100% Cross-Browser Voice-to-Text (`hooks/useSpeechToText.ts`)**: Instant Web Speech API for Chrome/Edge/Safari + automated Gemini Multimodal Audio fallback for Firefox and other browsers, with live dictation feedback and language toggling (`BG`/`EN`)
- **Interactive OpenStreetMap & Geolocation (`components/map/`, `lib/geo/geocoding.ts`)**: Free OpenStreetMap Leaflet integration with configurable pins, GPS "My Location" button, instant optimistic click-to-reverse-geocode (Nominatim API), dynamic search, category chips, pulsing halo animations, layer switcher, and in-map info text box — also embedded live inside `apps/mobile`'s Map tab via a `WebView` (see `app/embed/map/`)
- **Supabase RLS Boilerplate & Cheat Sheet (`../../database/scripts/rls-boilerplate-templates.sql`)**: Ready-to-copy Row Level Security policies for newly created hackathon tables
- **Analytics Dashboard**: Real-time stats, charts (Recharts), activity feed, and event logging
- **57 UI Components**: now in `packages/ui` (`@workspace/ui`) — 25 core + 30 extended, built on Radix UI, CVA, and Tailwind CSS v4
- **Notification System (`components/notification/`)**: Floating popup notifications with 4-corner placement and swipe-to-dismiss
- **Internationalization (BG/EN)**: Cookie-based SSR-aware locale switching, zero hydration mismatch, single-source dictionary in `packages/shared` (shared with the mobile app)
- **Colorblind-Friendly Accessibility Mode**: Remaps success/error colors to a blue/amber pairing, WCAG 1.4.11 border contrast
- **Dark Mode**, **Docker Ready**, **Type-Safe**, **Real-time Sync** via Supabase channels

## Tech Stack

- **Framework**: Next.js 16.4.2 (App Router with Turbopack)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS v4 (CSS-first config, no `tailwind.config.ts`)
- **UI Components**: shadcn/ui (Radix UI + CVA), in `packages/ui`
- **Maps & Geocoding**: OpenStreetMap + Leaflet + Nominatim API (100% free, no API key required)
- **Charts**: Recharts
- **Math**: KaTeX for LaTeX rendering
- **AI & Speech**: Google Gemini (`gemini-3.6-flash`) via `@google/genai` + Web Speech API
- **Auth & Database**: Supabase (shared with `apps/mobile`)
- **Icons**: Lucide React
- **Linter**: ESLint 9 (`eslint.config.mjs`)

## Getting Started

Run from the **repo root** unless noted — this app is one package in a pnpm/Turborepo monorepo, see the [root README](../../README.md) for the full-repo install.

1. **Install** (from repo root, installs every workspace package)
   ```bash
   pnpm install
   ```

2. **Environment variables** — copy `.env.example` to `.env` **inside this directory** (`apps/web/.env`, not a root-level `.env`):
   ```bash
   cp .env.example .env
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GEMINI_API_KEY=your-gemini-api-key
   NEXT_PUBLIC_PROJECT_NAME=My Project
   NEXT_PUBLIC_AI_MODEL=gemini-3.6-flash
   ```

3. **Supabase tables** — run [`../../database/scripts/fresh-database-setup.sql`](../../database/scripts/fresh-database-setup.sql) in your Supabase SQL Editor. Full guide: [`../../docs/supabase-setup.md`](../../docs/supabase-setup.md).

4. **Run the dev server**
   ```bash
   pnpm dev          # from repo root (Turborepo), or:
   cd apps/web && pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server (no root-level alias — run from here, or `pnpm --filter web start` from root)
pnpm lint         # ESLint (eslint.config.mjs)
pnpm type-check   # TypeScript type checking
```

## Project Structure

```
apps/web/
├── app/                          # Next.js App Router (flat structure, no route groups)
│   ├── api/                      # auth/, geo/, ai/, analytics/, profile/, users/[username]/
│   ├── embed/map/                # Chrome-free MapView embed, for apps/mobile's WebView
│   ├── ai/, dashboard/, settings/, features/, about/, login/, signup/
│   └── layout.tsx, page.tsx, globals.css
├── components/                   # App-specific components — the shadcn component library
│   │                              #   moved to ../../packages/ui; a few files stayed here
│   │                              #   (copy-button.tsx, export-button.tsx, shadcn/notification.tsx)
│   │                              #   because they depend on this app's own useI18n()/useNotification()
│   ├── map/, dashboard/, modal/, notification/, toast/, upload/, markdown/
│   └── header.tsx, auth-form.tsx, user-menu.tsx, theme-toggle.tsx, language-toggle.tsx, ...
├── hooks/                         # useAuth, useProfile, useAI, useChatHistory, useAnalytics,
│                                  #   useSpeechToText, useGeolocation, useFileUpload, useTheme, etc.
├── lib/
│   ├── ai/, geo/, upload/, markdown/, supabase/, api/
│   ├── i18n/                     # Thin re-export of @workspace/shared — the real dictionary lives there
│   └── utils.ts                  # cn() helper
├── proxy.ts                      # Server-side route guard for /dashboard, /settings, /ai
├── next.config.ts                # transpilePackages: ['@workspace/shared', '@workspace/ui']
└── package.json
```

## Documentation

See the [root README](../../README.md#documentation) for the full docs index. Most relevant here: [`AGENT.md`](./AGENT.md) (this app's architecture guide), [`../../docs/components.md`](../../docs/components.md), [`../../docs/hooks.md`](../../docs/hooks.md), [`../../docs/i18n-and-accessibility.md`](../../docs/i18n-and-accessibility.md), [`../../docs/maps-and-geocoding.md`](../../docs/maps-and-geocoding.md), [`../../docs/supabase-setup.md`](../../docs/supabase-setup.md).
