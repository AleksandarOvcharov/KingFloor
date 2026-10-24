# Mobile App (`apps/mobile`)

> **Audience**: AI agents and developers working on the Expo/React Native app. Read the root [`AGENT.md`](../AGENT.md) (§0 and §3) first for how this app relates to `apps/web`, and [`apps/mobile/AGENTS.md`](../apps/mobile/AGENTS.md) for Expo-specific coding rules — this doc goes deeper on the mobile-specific implementation itself.

## What this is

An Expo Router app (SDK 57) that shares one Supabase backend and one deployed Next.js API with `apps/web`. It has **no backend of its own** — every screen that needs data calls `apps/web`'s existing `/api/*` routes. Business logic, types, and the i18n dictionary are shared via `@workspace/shared`; UI components are not (and cannot be — see below), so mobile has its own small native component library that mirrors web's naming.

## Why mobile can't just import web's UI

`packages/ui` (web's shadcn/Radix component library) depends on `@radix-ui/react-*` (DOM portals, ARIA, real `<div>`/`<button>` elements) and Tailwind CSS classes processed by a build step. Neither a DOM nor a CSS engine exists on React Native. This isn't an import-path problem solvable by "fixing the alias" — it's a different renderer entirely (`View`/`Text`/`Pressable` vs. HTML elements). Three things *are* shared across the wall, though:
- **Pure data/logic** — `@workspace/shared`'s types, Zod schemas, and the entire i18n dictionary.
- **Design tokens** — mobile's color palette (`lib/theme.ts`) is hand-converted from web's HSL `--variables`, so both apps render the same colors even though the components rendering them are different code.
- **API shape** — mobile's hooks call the same endpoints web's hooks call, with the same request/response shapes, just through a different HTTP client (`apiFetch` vs. relative `fetch`).
- **Literal DOM content, when truly needed** — the one case where mobile embeds the *actual* web component live inside a `WebView` instead of reimplementing it (the map — see below).

## Directory map

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root Stack. Wraps everything: SafeAreaProvider > I18nProvider > ThemeProvider
│   ├── sign-in.tsx               # Modal screen, email/password via loginSchema (@workspace/shared)
│   └── (tabs)/
│       ├── _layout.tsx           # Tab bar + shared header (ThemeToggle, LanguageToggle in headerRight)
│       ├── index.tsx             # Home (placeholder — "Welcome" / "What would you like to do today?")
│       ├── ai.tsx                # AI Chat — calls /api/ai/chat
│       ├── dashboard.tsx         # Dashboard — calls /api/analytics/stats
│       ├── map.tsx               # Map — WebView embedding apps/web's /embed/map
│       ├── profile.tsx           # Identity + sign in/out (simple; Settings has the real profile editor)
│       └── settings.tsx          # Account details, username, bio, extended info, visibility, danger zone
├── components/
│   ├── ui/                       # Native component library — see "Component library" below
│   │   ├── Button.tsx, Card.tsx, Badge.tsx, Input.tsx, Label.tsx, Separator.tsx,
│   │   │   Switch.tsx, Skeleton.tsx, Progress.tsx, Avatar.tsx, index.ts
│   ├── dashboard/
│   │   ├── StatCard.tsx, ActivityChart.tsx (react-native-svg bars), ActivityFeed.tsx
│   ├── ThemeToggle.tsx           # Sun/Moon icon button, mirrors web's ThemeToggle
│   └── LanguageToggle.tsx        # Tap-to-cycle flag+code (web uses a dropdown; only 2 locales here)
├── hooks/
│   ├── useSession.ts             # Native Supabase session, onAuthStateChange-synced
│   ├── useProfile.ts             # Ports apps/web's useProfile() logic (same /api/profile PUT shape)
│   ├── useDashboardStats.ts      # Ports apps/web's useAnalytics() logic (same /api/analytics/stats shape)
│   ├── useTheme.tsx              # Context: { theme, colors, toggle } — AsyncStorage-backed
│   └── useI18n.tsx               # Context: { t, locale, setLocale, tFormat } — AsyncStorage-backed
├── lib/
│   ├── supabase.ts               # Native Supabase client (LargeSecureStore-backed)
│   ├── supabase-storage.ts       # Chunked expo-secure-store adapter — see "Gotchas" below
│   ├── api-client.ts             # apiFetch(path, opts) — Bearer token + EXPO_PUBLIC_API_URL prefix
│   └── theme.ts                  # ColorTokens type + light/dark palettes (hex, converted from web's HSL)
└── package.json                  # Expo SDK 57 (pinned — see "Gotchas")
```

## Component library (`components/ui/`)

A from-scratch React Native component library, **not a port of `packages/ui`'s code** — it mirrors that package's component and variant *names* so the same mental model (and the same prop values) carries over between apps, even though every line of implementation is different.

| Component | Mirrors (`packages/ui/src/ui/`) | Variant/size values |
|---|---|---|
| `Button` | `button.tsx` | `variant: default\|destructive\|outline\|secondary\|ghost\|link`, `size: default\|sm\|lg\|icon` |
| `Card` (+`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`) | `card.tsx` | compound-component shape identical to web's |
| `Badge` | `badge.tsx` | `variant: default\|secondary\|destructive\|outline` |
| `Input`, `Label`, `Separator` | `input.tsx`, `label.tsx`, `separator.tsx` | — |
| `Switch` | `switch.tsx` | wraps RN's **own native** `Switch` (the one case where RN already has the real native primitive) themed to match web's on/off colors |
| `Skeleton` | `skeleton.tsx` | `Animated.loop` pulse instead of a CSS keyframe |
| `Progress` | `progress.tsx` | `value: number` (0–100) |
| `Avatar` (+`AvatarImage`/`AvatarFallback`/`AvatarWithFallback`) | `avatar.tsx` | RN has no automatic image-load-failure fallback like Radix's `Avatar` — `AvatarWithFallback` wires the `onError`-triggers-fallback pattern explicitly |

All of them read colors from `useTheme()`'s `ColorTokens`, never a hardcoded hex. When adding a new primitive, check whether `packages/ui` already has the web equivalent and copy its variant names — don't invent a parallel naming scheme.

## Theming (dark mode)

`hooks/useTheme.tsx` is a **context**, not a plain hook like web's `useTheme()` — this is deliberate: it lets the tab bar and every screen share one toggle instead of drifting independently (web gets away with a plain hook because there's only one `<ThemeToggle/>` instance per page, driving the DOM's `.dark` class globally; mobile has multiple screens that all need to react to the same toggle).

- Defaults to the system color scheme (`useColorScheme()`), then an explicit toggle overrides and persists via `AsyncStorage` (mirrors web's `localStorage` + `prefers-color-scheme` behavior, different storage).
- Color tokens (`lib/theme.ts`) are hand-converted from `apps/web/app/globals.css`'s `:root`/`.dark` HSL variables to hex — **keep these in sync** if the web tokens ever change; nothing enforces this automatically.
- `<ThemeToggle/>` lives in the tab header (`headerRight`), reachable from every tab.

## Internationalization (BG/EN)

`hooks/useI18n.tsx` reads `dictionaries`/`isLocale`/`tFormat`/`LOCALE_COOKIE` directly from `@workspace/shared` — the **exact same dictionary** `apps/web` uses, not a separate copy. Only the persistence layer differs (`AsyncStorage` here vs. a cookie + `localStorage` on web, since there's no SSR render to match on mobile).

- `<LanguageToggle/>` cycles through `LOCALES` on tap (web uses a dropdown menu — overkill here since there are only 2 locales).
- **Adding a new string**: write it in `packages/shared/src/i18n.ts`, not here and not in `apps/web`. A small number of mobile-only strings exist under the `mobile` namespace and as a few extra keys in `common`/`ai`/`dashboard`/`profile`/`auth` (e.g. `common.signIn`, `ai.signInRequired*`) for copy that had no web equivalent (mobile's stricter "no account at all" sign-in gates, vs. web's "sign in to save history" framing) — add new mobile-only copy the same way, in the most relevant existing namespace, only creating a new namespace if nothing fits.

## Settings screen — what's ported, what's not

`app/(tabs)/settings.tsx` + `hooks/useProfile.ts` port `apps/web/hooks/useProfile.ts`'s logic verbatim: same `/api/profile` PUT request shape for `updateUsername`, `updateBio`, `updateExtended`, `updateVisibility`. Account deletion calls `/api/auth/delete-account` (`DELETE`, Bearer token) exactly like `apps/web/hooks/useAuth.ts`'s `deleteAccount`.

**Not ported**: `uploadAvatar`. Web's version is `File`-based (browser file input); mobile would need `expo-image-picker` (not currently a dependency) to pick an image and convert it to a base64/blob payload. This is a deliberate, acknowledged gap — the same category as "file upload" being explicitly deferred for mobile generally, not an oversight.

## Map tab — the WebView-embed pattern

`app/(tabs)/map.tsx` is a `react-native-webview` `WebView` pointed at `${EXPO_PUBLIC_API_URL}/embed/map` — a chrome-free Next.js route (`apps/web/app/embed/map/page.tsx`) that renders the real `<MapView/>` component full-screen, no `<Header/>`, no auth required (the map has no user data).

This is the reference implementation for "mobile needs a web feature that's genuinely infeasible to reimplement natively": `react-native-maps` would need a custom dev client (not Expo Go, which this project's workflow is pinned to), and reimplementing Leaflet with RN primitives would mean maintaining two independent map engines. A `WebView` is an actual browser, so it's the one way to run the *real* component on-device.

**Theme sync is the non-obvious part.** The embedded page is a separate browser context with its own fresh `localStorage` — it has no idea what theme the native app is in. The fix:
1. `map.tsx` passes the mobile app's current theme as `?theme=dark|light` in the embed URL, and remounts the `WebView` (`key={theme}`) when it changes, so toggling theme while on the Map tab actually reloads with the new one.
2. `embed/map/page.tsx` reads that param **server-side** (it's an `async` page component receiving `searchParams`) and applies the `.dark` class to `<html>` via an early inline `<script>` — not to a wrapper `<div>`. That distinction matters: Tailwind v4's `--color-background: hsl(var(--background))` token resolves its `var(--background)` reference once, inherited from `:root`; overriding `--background` on a descendant element doesn't retroactively change an already-inherited `--color-background` value. The class has to land on the actual root for the override to take effect. (This was a real bug, fixed once — see `docs/CHANGELOG.md`.)

**Known gap**: Android's WebView won't surface the GPS "my location" permission prompt without also wiring `onGeolocationPermissionsShowPrompt` + a location permission in the native config — left unaddressed since it degrades to the same "denied" state the web app already handles gracefully, and search/click-to-reverse-geocode work regardless of GPS.

## Gotchas

- **`expo-secure-store` has a 2048-byte-per-key cap**, and a Supabase session (access + refresh JWT + metadata) routinely exceeds it. `lib/supabase-storage.ts`'s `LargeSecureStore` works around this by chunking values across `${key}_0`, `${key}_1`, ... with a `${key}_chunks` sentinel. Don't simplify this back to a naive pass-through.
- **Expo SDK is pinned to 57, not latest, on purpose** — see `apps/mobile/AGENTS.md`. Don't bump it without confirming the tester's installed Expo Go app supports the new version first.
- **`@types/react` is pinned workspace-wide** via the root `pnpm-workspace.yaml`'s `overrides` (currently `~19.2.4`, matching SDK 57). Bumping the Expo SDK without also updating this override breaks `apps/web`'s type-check with a confusing "Key symbol" mismatch in shadcn components (`cmdk`, `sonner`, `input-otp`).
- **`.npmrc` has `node-linker=hoisted`** — required for Metro to resolve packages correctly in this pnpm workspace. Don't remove it without re-verifying `expo export` still bundles cleanly.
- **`react-native-webview` works in Expo Go; `react-native-maps` does not** (needs a custom dev client / `expo prebuild`). This is why the map is a `WebView` embed, not a native map.
- **This sandbox's `pnpm` binary may be a shebang-less shell shim** that breaks when Turborepo tries to spawn it directly (`/usr/bin/pnpm`). Sandbox-specific, not a project issue — see `apps/mobile/AGENTS.md` for the workaround.

## Verifying a change actually works

`tsc` passing does **not** mean Metro can bundle the app — it only checks types, not whether every import actually resolves at the bundler level. The real check:
```bash
cd apps/mobile
pnpm exec expo export --platform android
rm -rf dist .expo   # clean up afterward — not meant to be committed
```
Run this (plus `pnpm type-check`/`pnpm lint` from the repo root) before considering any mobile change done. For anything touching the `/embed/map` route specifically, also check it from the web side with a real built page (Playwright or manual) — the dark-mode bug above would not have been caught by `tsc` or a bundle check, only by actually looking at computed styles in a browser.

## What's explicitly not built yet (don't assume it exists)

- Avatar upload (needs `expo-image-picker`).
- AI chat image attachments / voice input (web has both; mobile's AI tab is text-only).
- A native component demo/showcase screen (web's `/features` page has one; mobile doesn't — the component library is used in-place in Settings/Dashboard instead).
- EAS build/submit configuration — distribution is via Expo Go only so far.
- A public profile view, or any i18n coverage of web's marketing/landing-page content (mobile's Home tab is a placeholder, not a port of web's landing page).
