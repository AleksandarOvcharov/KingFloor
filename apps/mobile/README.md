# Hackathon Startup Template — Mobile App

The Expo/React Native half of the monorepo. For the Next.js web app, see [`../web/README.md`](../web/README.md). For how the two relate, see the [root README](../../README.md) and [root AGENT.md](../../AGENT.md).

This app has **no backend of its own** — it calls the deployed web app's `/api/*` routes against the same Supabase project, not a separate API. Business logic, types, and the i18n dictionary are shared via `@workspace/shared`; UI components are not (and cannot be — Radix/Tailwind need a DOM and a CSS build, neither of which exists on React Native), so this app has its own small native component library instead.

Full architecture deep-dive: [`../../docs/mobile.md`](../../docs/mobile.md). Expo-specific coding rules: [`AGENTS.md`](./AGENTS.md).

## Features

- **AI Chat tab** — calls the web app's `/api/ai/chat` (plain text only — no voice/image attach yet)
- **Dashboard tab** — calls `/api/analytics/stats`, native charts via `react-native-svg` (no native maps/charts dependency)
- **Settings tab** — account details, username, bio, extended info, visibility toggle, account deletion, against the same `/api/profile` / `/api/auth/delete-account` endpoints the web app uses. Avatar upload not yet ported (needs `expo-image-picker`)
- **Map tab** — a `WebView` embedding the web app's real `MapView` component live, not a `react-native-maps` reimplementation (that needs a custom dev client; this project's workflow is pinned to plain Expo Go)
- **Dark mode + BG/EN i18n**, reading the exact same color tokens and translation dictionary as the web app
- **A native UI component library** (`components/ui/`) mirroring the web app's component/variant names

## Tech Stack

- **Framework**: Expo Router, SDK **57** (pinned — see [`AGENTS.md`](./AGENTS.md) before bumping it)
- **Language**: TypeScript, React 19.2.3
- **Styling**: `StyleSheet.create()` + `lib/theme.ts`'s hand-converted color tokens (no CSS, no Tailwind)
- **Auth & Database**: the same Supabase project the web app uses, via its own native client (chunked `expo-secure-store` session storage)
- **Maps**: `react-native-webview` embedding the real web `MapView`
- **Icons**: `lucide-react-native`

## Getting Started

Run `pnpm install` from the **repo root** first (installs every workspace package, including this one).

1. **Install Expo Go** on your phone — must match the SDK version pinned in `package.json` (currently 57).
2. **Environment variables** — copy `.env.example` to `.env` in this directory:
   ```bash
   cp .env.example .env
   ```
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_API_URL=https://your-deployed-web-app.vercel.app
   ```
   `EXPO_PUBLIC_API_URL` must be reachable from your **phone** — `http://localhost:3000` will not work on a real device. Deploy `apps/web` first (even to a Vercel preview).
3. **Run the dev server**
   ```bash
   pnpm exec expo start
   ```
   Scan the QR code with Expo Go.

## Available Scripts

```bash
pnpm exec expo install <package>   # ALWAYS use instead of `pnpm add` for anything with native code
pnpm exec expo start                # Dev server
pnpm exec expo lint                 # Lint
pnpm exec tsc --noEmit              # Typecheck
pnpm exec expo-doctor                # Diagnose dependency/config issues
pnpm exec expo install --fix        # Fix incompatible package versions after an SDK change
```
**The one command that actually proves a change works** — `tsc` passing does not mean Metro can bundle it:
```bash
pnpm exec expo export --platform android
rm -rf dist .expo   # clean up afterward, not meant to be committed
```

## Project Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root Stack. ThemeProvider + I18nProvider wrap everything
│   ├── sign-in.tsx               # Modal screen
│   └── (tabs)/
│       ├── _layout.tsx           # Tab bar + shared header (ThemeToggle, LanguageToggle)
│       └── index.tsx, ai.tsx, dashboard.tsx, map.tsx, profile.tsx, settings.tsx
├── components/
│   ├── ui/                       # Native component library — Button, Card, Badge, Input, Label,
│   │                              #   Separator, Switch, Skeleton, Progress, Avatar
│   ├── dashboard/                 # StatCard, ActivityChart (react-native-svg), ActivityFeed
│   └── ThemeToggle.tsx, LanguageToggle.tsx
├── hooks/
│   └── useSession.ts, useProfile.ts, useTheme.tsx, useI18n.tsx, useDashboardStats.ts
├── lib/
│   ├── supabase.ts               # Native Supabase client
│   ├── supabase-storage.ts       # Chunked expo-secure-store adapter (2048-byte-per-key cap workaround)
│   ├── api-client.ts              # apiFetch() — Bearer token + EXPO_PUBLIC_API_URL prefix
│   └── theme.ts                   # Color tokens converted from the web app's globals.css HSL variables
└── package.json                   # Expo SDK 57 — pinned, see AGENTS.md
```

## Documentation

- [`AGENTS.md`](./AGENTS.md) — Expo/React Native-specific coding rules and gotchas (SDK pinning, the pnpm shim issue, Expo Go module limits)
- [`../../docs/mobile.md`](../../docs/mobile.md) — full architecture: the component library, theming, i18n, the WebView map-embed pattern in detail, what's explicitly not built yet
- [`../../AGENT.md`](../../AGENT.md) — the monorepo-wide guide (shared packages, the three valid web↔mobile integration patterns)
