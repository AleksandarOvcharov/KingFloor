# Hackathon Startup Template

A production-grade **Turborepo monorepo** for hackathons and MVPs: a Next.js web app and an Expo/React Native mobile app sharing one Supabase backend. This is the common entry point — for feature lists, tech stack, and setup specific to each app, go to:

- **[`apps/web/README.md`](apps/web/README.md)** — the Next.js app: Supabase auth, an AI chatbot (Google Gemini), OpenStreetMap geolocation, an analytics dashboard, 57 UI components, BG/EN i18n, Docker.
- **[`apps/mobile/README.md`](apps/mobile/README.md)** — the Expo app: AI chat, dashboard, settings, a live map, dark mode, BG/EN i18n — all calling the web app's existing backend, not a reimplementation.

> **Working with an AI agent on this repo?** Read [`AGENT.md`](AGENT.md) first — it's the map of how the pieces fit together and the rules for not duplicating logic across the two apps. [`CLAUDE.md`](CLAUDE.md) is the Claude-specific quick reference; both are "common source" shared by the whole repo, with the app-specific detail living in `apps/web/AGENT.md` and `apps/mobile/AGENTS.md`.

## Monorepo Layout

```
├── apps/
│   ├── web/        # Next.js app — AGENT.md + README.md inside
│   └── mobile/      # Expo Router app — AGENTS.md + README.md inside, calls apps/web's API, no backend of its own
├── packages/
│   ├── shared/       # @workspace/shared — types, Zod schemas, the i18n dictionary (both apps import it)
│   └── ui/            # @workspace/ui — apps/web's shadcn/Radix component library (web-only, see AGENT.md §0)
├── database/scripts/ # Supabase SQL migrations, shared by both apps' backend
└── AGENT.md, CLAUDE.md, README.md   # Common source for the whole repo
```

**The two apps share logic, never UI code.** Business logic, types, and the i18n dictionary live once in `packages/shared`; `apps/web`'s actual components (`packages/ui`) can't run on React Native (no DOM, no CSS engine), so mobile has its own small native component library mirroring its naming instead. Full explanation: [`AGENT.md`](AGENT.md#0-orientation).

## Getting Started

### Prerequisites
- Node.js 18.17+, pnpm 12.4.1+
- Supabase account ([supabase.com](https://supabase.com))
- Google AI API key ([aistudio.google.com](https://aistudio.google.com/apikey)) — free tier available
- For mobile: the [Expo Go](https://expo.dev/go) app on your phone (SDK 57 compatible)

### Install everything
```bash
git clone <your-repo-url>
cd hackathon-startup-template
pnpm install   # installs all 4 workspace packages
```

Then follow **[`apps/web/README.md`](apps/web/README.md)** to set up the backend and run the web app (required first — mobile calls its API), and optionally **[`apps/mobile/README.md`](apps/mobile/README.md)** for the mobile app on top of it.

## Monorepo-Wide Commands

Run from the **repo root** — Turborepo fans these out to every workspace package that defines them:
```bash
pnpm dev          # Web dev server (Turbopack)
pnpm build        # Production build (web + packages)
pnpm lint         # ESLint (web only)
pnpm type-check   # TypeScript check across all 4 packages
```
`pnpm --filter web <script>` / `pnpm --filter mobile <script>` to target one package. App-specific commands (Expo's `start`/`export`, etc.) are in each app's own README.

## Documentation

- **[AGENT.md](AGENT.md)** — monorepo-wide architecture guide for AI agents (shared packages, the API contract, RLS, the mobile↔web integration patterns)
- **[CLAUDE.md](CLAUDE.md)** — Claude-specific quick reference (same "common source" scope as AGENT.md)
- **[apps/web/AGENT.md](apps/web/AGENT.md)** / **[apps/web/README.md](apps/web/README.md)** — web app architecture & setup
- **[apps/mobile/AGENTS.md](apps/mobile/AGENTS.md)** / **[apps/mobile/README.md](apps/mobile/README.md)** — mobile app Expo-specific rules & setup
- **[docs/mobile.md](docs/mobile.md)** — mobile app deep architecture reference (component library, theming, i18n, the WebView map-embed pattern, gotchas)
- **[docs/SETUP.md](docs/SETUP.md)** — complete setup guide & troubleshooting (both apps)
- **[docs/supabase-setup.md](docs/supabase-setup.md)** — database schema SQL & RLS boilerplate cheat sheet
- **[docs/oauth-setup.md](docs/oauth-setup.md)** — Google & GitHub OAuth provider setup (web)
- **[docs/maps-and-geocoding.md](docs/maps-and-geocoding.md)** — OpenStreetMap, Leaflet, GPS, Nominatim caching, and the mobile embed
- **[docs/voice-and-audio.md](docs/voice-and-audio.md)** — voice dictation & Gemini audio transcription fallback (web)
- **[docs/mobile-responsiveness.md](docs/mobile-responsiveness.md)** — web's responsive/sub-768px layout standards (not the Expo app — see `docs/mobile.md` for that)
- **[docs/security-and-rls.md](docs/security-and-rls.md)** — multi-layer security architecture, route guards & RLS
- **[docs/smooth-scrolling.md](docs/smooth-scrolling.md)** — Lenis smooth scrolling & scroll isolation (web)
- **[docs/i18n-and-accessibility.md](docs/i18n-and-accessibility.md)** — BG/EN translation system (shared by both apps), cookie-based SSR locale, colorblind-friendly mode
- **[docs/ai-setup.md](docs/ai-setup.md)** — AI chatbot configuration & Gemini setup (web)
- **[docs/docker-setup.md](docs/docker-setup.md)** — Docker deployment guide (web only)
- **[docs/components.md](docs/components.md)** — UI component reference (`packages/ui`) + MapView
- **[docs/hooks.md](docs/hooks.md)** — custom hooks reference, both apps
- **[docs/modal.md](docs/modal.md)** — modal system guide (web)
- **[docs/file-upload.md](docs/file-upload.md)** — file upload system guide (web; not yet ported to mobile)
- **[docs/utils.md](docs/utils.md)** — utility functions (geocoding, notifications, search)
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** — version history
- **[docs/kingfloor.md](docs/kingfloor.md)** — the KingFloor product itself (etажна собственост domain): buildings/units/fees/voting/maintenance, built on top of everything above
