This is the Expo/React Native half of a monorepo whose other half is `apps/web` (a Next.js app) — read [`../../AGENT.md`](../../AGENT.md) first (especially §0 and §3) for how the two apps relate, and [`../../docs/mobile.md`](../../docs/mobile.md) for the full architecture. This file covers Expo/React Native-specific coding rules only.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` — currently **SDK 57**, pinned on purpose (see below).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## This app has no backend of its own

Every screen that needs data calls `apps/web`'s deployed `/api/*` routes — the same backend the website uses, not a separate API. `lib/api-client.ts`'s `apiFetch()` attaches the native Supabase session as a Bearer token and prefixes the path with `EXPO_PUBLIC_API_URL`. Never write a new backend endpoint here; if a feature needs server logic that doesn't exist yet, it belongs in `apps/web/app/api/`.

## Routes live in `app/`, not `src/app/`

This project has no `src/` wrapper. Every file in `app/` is a screen (Expo Router convention); `_layout.tsx` files define navigators. Non-route code (`components/`, `hooks/`, `lib/`) lives as siblings of `app/`, not inside it.

```
app/
├── _layout.tsx         # Root Stack — wraps everything in ThemeProvider + I18nProvider
├── sign-in.tsx          # Modal screen
└── (tabs)/
    ├── _layout.tsx      # Tab bar: Home, AI Chat, Dashboard, Map, Profile, Settings
    ├── index.tsx, ai.tsx, dashboard.tsx, map.tsx, profile.tsx, settings.tsx
```

## Expo SDK is pinned to 57 — do not bump without checking first

It was downgraded from 58 to 57 once already because the tester's installed **Expo Go app** only supported 57 (this manifested as the dev-build QR code hanging on a loading spinner, not an explicit version error — don't assume a silent hang is unrelated to SDK version). Before ever bumping the SDK: confirm what version the actual Expo Go app in use supports. After bumping: run `pnpm exec expo install --fix` to realign every `expo-*`/`react-native-*` package version, and update `@types/react`'s override in the **root** `pnpm-workspace.yaml` to match whatever that leaves `@types/react` at here — otherwise `apps/web`'s type-check breaks with a confusing "Key symbol" mismatch in shadcn components (`cmdk`, `sonner`, `input-otp`). This already happened once.

## Reusing a web component you can't port natively

If a feature needs a web component that's genuinely infeasible to reimplement with RN primitives (Leaflet maps, anything DOM/CSS-dependent), don't port it — embed the real thing. Add a chrome-free route under `apps/web/app/embed/*` rendering the actual component, then load it here in a `react-native-webview` `WebView`. See `app/(tabs)/map.tsx` + `apps/web/app/embed/map/page.tsx` as the reference, including how the embedded page's theme is synced via a `?theme=` query param — a WebView is a separate browser context with its own storage, it has no idea what theme the native app is in otherwise.

`react-native-maps` is NOT an option here: it needs a custom dev client (`expo prebuild` + native build), and this project's whole workflow is pinned to plain Expo Go.

## Commands

```bash
pnpm exec expo install <package>   # ALWAYS use instead of pnpm add for anything with native code —
                                     #   resolves SDK-compatible versions; plain pnpm add does not
pnpm exec expo start                # dev server, scan the QR with Expo Go
pnpm exec expo lint                 # lint
pnpm exec tsc --noEmit              # typecheck
pnpm exec expo-doctor                # diagnose dependency/config issues
pnpm exec expo install --fix        # fix incompatible package versions after any SDK change
```

**The one command that actually proves a change works** — `tsc` passing does not mean Metro can bundle it:
```bash
pnpm exec expo export --platform android
rm -rf dist .expo   # clean up the export artifacts afterward, they're not meant to be committed
```

Run this (not just lint/typecheck) before declaring any mobile task done.

If `pnpm` itself fails with "Exec format error" when Turborepo tries to spawn it from the repo root (this sandbox's `/usr/bin/pnpm` is a shebang-less shell shim) — that's sandbox-specific, not a project bug. Prepend `PATH="$HOME/.local/bin:$PATH"` if a working wrapper is already there, or recreate one: `exec /usr/bin/node /usr/lib/node_modules/pnpm/bin/pnpm.mjs "$@"`.

## Navigation & Routing

- Expo Router for all navigation. Import `Link`, `router`, `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Rules

- If `ios/` and `android/` directories don't exist, they're generated via Continuous Native Generation — never create or hand-edit them; configure native behavior in `app.json` / config plugins. (They don't exist in this project; nobody has run `expo prebuild` yet, since Expo Go doesn't need them.)
- Expo Go only includes its bundled native modules (`react-native-webview` is one of them — confirmed working; `react-native-maps` is not). After adding a library with native code that *isn't* in that bundled set, the app needs a custom dev build (`expo run:ios|android` or `eas build --profile development`) — which this project currently has no setup for, so avoid such a dependency unless you're prepared to also set that up.
- Prefer modules already used elsewhere in this app (check `package.json`) or Expo's own recommended modules over a new third-party library.
