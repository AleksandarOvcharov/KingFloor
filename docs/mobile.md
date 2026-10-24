# Mobile App (`apps/mobile`)

> **Audience**: AI agents and developers working on the Expo/React Native app. Read the root [`AGENT.md`](../AGENT.md) (§0 and §3) first for how this app relates to `apps/web`, and [`apps/mobile/AGENTS.md`](../apps/mobile/AGENTS.md) for Expo-specific coding rules — this doc goes deeper on the mobile-specific implementation itself.

## What this is

An Expo Router app (SDK 57) that shares one Supabase backend and one deployed Next.js API with `apps/web`. It has **no backend of its own** — every screen that needs data calls `apps/web`'s existing `/api/*` routes. Business logic, types, and the i18n dictionary are shared via `@workspace/shared`; UI components are not (and cannot be — see below), so mobile has its own small native component library that mirrors web's naming.

## Why mobile can't just import web's UI

`packages/ui` (web's shadcn/Radix component library) depends on `@radix-ui/react-*` (DOM portals, ARIA, real `<div>`/`<button>` elements) and Tailwind CSS classes processed by a build step. Neither a DOM nor a CSS engine exists on React Native. This isn't an import-path problem solvable by "fixing the alias" — it's a different renderer entirely (`View`/`Text`/`Pressable` vs. HTML elements). Three things *are* shared across the wall, though:
- **Pure data/logic** — `@workspace/shared`'s types, Zod schemas, and the entire i18n dictionary.
- **Design tokens** — mobile's color palette (`lib/theme.ts`) is hand-converted from web's HSL `--variables`, so both apps render the same colors even though the components rendering them are different code.
- **API shape** — mobile's hooks call the same endpoints web's hooks call, with the same request/response shapes, just through a different HTTP client (`apiFetch` vs. relative `fetch`).
- **Literal DOM content, when truly needed** — mobile can still embed the *actual* web component live inside a `WebView` instead of reimplementing it, when a feature is genuinely infeasible to build natively (no current screen does this — the template's old map-embed tab was removed once `apps/web` dropped its own map/AI/analytics template pages).

## Directory map

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root Stack. Wraps everything: SafeAreaProvider > I18nProvider > ThemeProvider
│   ├── sign-in.tsx               # Modal screen, email/password + Google/GitHub OAuth (lib/oauth.ts)
│   └── (tabs)/
│       ├── _layout.tsx           # Tab bar + shared header (ThemeToggle, LanguageToggle in headerRight)
│       ├── index.tsx             # Home = the Building screen: join flow, fees, announcements, votes
│       └── settings.tsx          # Account details + sign out, username, bio, extended info, visibility, danger zone
├── components/
│   ├── ui/                       # Native component library — see "Component library" below
│   │   ├── Button.tsx, Card.tsx, Badge.tsx, Input.tsx, Label.tsx, Separator.tsx,
│   │   │   Switch.tsx, Skeleton.tsx, Progress.tsx, Avatar.tsx, index.ts
│   ├── ThemeToggle.tsx           # Sun/Moon icon button, mirrors web's ThemeToggle
│   └── LanguageToggle.tsx        # Tap-to-cycle flag+code (web uses a dropdown; only 2 locales here)
├── hooks/
│   ├── useSession.ts             # Native Supabase session, onAuthStateChange-synced
│   ├── useProfile.ts             # Ports apps/web's useProfile() logic (same /api/profile PUT shape)
│   ├── useBuilding.ts            # GET /api/building — current user's membership, or null
│   ├── useJoinBuilding.ts        # GET /api/building/lookup + POST /api/building/join (resident join only)
│   ├── useFees.ts                # GET /api/building/fees — read-only on mobile
│   ├── useAnnouncements.ts       # GET /api/building/announcements — read-only on mobile
│   ├── usePolls.ts               # GET /api/building/polls + POST .../vote — the one write action on mobile
│   ├── useTheme.tsx              # Context: { theme, colors, toggle } — AsyncStorage-backed
│   └── useI18n.tsx               # Context: { t, locale, setLocale, tFormat } — AsyncStorage-backed
├── lib/
│   ├── supabase.ts               # Native Supabase client (LargeSecureStore-backed)
│   ├── supabase-storage.ts       # Chunked expo-secure-store adapter — see "Gotchas" below
│   ├── oauth.ts                  # signInWithOAuth() — expo-web-browser auth session + setSession()
│   ├── api-client.ts             # apiFetch(path, opts) — Bearer token + EXPO_PUBLIC_API_URL prefix
│   └── theme.ts                  # ColorTokens type + light/dark palettes (hex, converted from web's HSL)
└── package.json                  # Expo SDK 57 (pinned — see "Gotchas")
```

Mobile deliberately has only two tabs, mirroring `apps/web`'s own nav: the website's header has exactly one real link (`/building`) plus a user-menu dropdown (Building / Settings / Logout) — there's no separate "Dashboard"/"AI"/"Map" page there either, those were hackathon-template leftovers already deleted on web. The old mobile tabs with the same names were orphans with zero web equivalent and have been removed rather than redesigned.

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

A "Sign out" button lives in Settings' Account card (not in the Building tab) — mobile has no header user-menu dropdown the way web does, so this is where that action had to land instead.

## OAuth (Google/GitHub) sign-in

`lib/oauth.ts`'s `signInWithOAuth(provider)` is the native equivalent of `apps/web/hooks/useAuth.ts`'s `signInWithGoogle`/`signInWithGitHub`, but a native app has no server to receive Supabase's HTTP redirect, so the flow is different in shape even though it ends at the same providers:
1. Call `supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })` to get the provider's consent URL without letting supabase-js try to navigate anywhere itself.
2. Open that URL with `expo-web-browser`'s `openAuthSessionAsync`, which runs an in-app browser tab (`ASWebAuthenticationSession`/Custom Tabs) and resolves once it's redirected back to this app's own `hacktemplate://auth/callback` deep link (`redirectTo`, built with `expo-linking`'s `createURL`).
3. Pull `access_token`/`refresh_token` out of that returned URL with `expo-auth-session`'s `QueryParams.getQueryParams`, and hand them to `supabase.auth.setSession()` directly — the mobile Supabase client has `detectSessionInUrl: false`, so nothing parses the redirect automatically the way a browser tab would.

**Requires a one-time Supabase Dashboard change, not just code**: the redirect URL `hacktemplate://auth/callback` must be added to Authentication → URL Configuration → Redirect URLs, or step 2 above will complete with an error instead of a session. The OAuth providers themselves don't need separate native setup — this reuses the same Google/GitHub apps already enabled for `apps/web`, since it's Supabase's hosted OAuth flow, not a native provider SDK.

## Gotchas

- **`expo-secure-store` has a 2048-byte-per-key cap**, and a Supabase session (access + refresh JWT + metadata) routinely exceeds it. `lib/supabase-storage.ts`'s `LargeSecureStore` works around this by chunking values across `${key}_0`, `${key}_1`, ... with a `${key}_chunks` sentinel. Don't simplify this back to a naive pass-through.
- **Expo SDK is pinned to 57, not latest, on purpose** — see `apps/mobile/AGENTS.md`. Don't bump it without confirming the tester's installed Expo Go app supports the new version first.
- **`@types/react` is pinned workspace-wide** via the root `pnpm-workspace.yaml`'s `overrides` (currently `~19.2.4`, matching SDK 57). Bumping the Expo SDK without also updating this override breaks `apps/web`'s type-check with a confusing "Key symbol" mismatch in shadcn components (`cmdk`, `sonner`, `input-otp`).
- **`.npmrc` has `node-linker=hoisted`** — required for Metro to resolve packages correctly in this pnpm workspace. Don't remove it without re-verifying `expo export` still bundles cleanly.
- **This sandbox's `pnpm` binary may be a shebang-less shell shim** that breaks when Turborepo tries to spawn it directly (`/usr/bin/pnpm`). Sandbox-specific, not a project issue — see `apps/mobile/AGENTS.md` for the workaround.

## Verifying a change actually works

`tsc` passing does **not** mean Metro can bundle the app — it only checks types, not whether every import actually resolves at the bundler level. The real check:
```bash
cd apps/mobile
pnpm exec expo export --platform android
rm -rf dist .expo   # clean up afterward — not meant to be committed
```
Run this (plus `pnpm type-check`/`pnpm lint` from the repo root) before considering any mobile change done.

## What's explicitly not built yet (don't assume it exists)

- Avatar upload (needs `expo-image-picker`).
- Admin-only building actions on mobile: marking a fee paid, generating fees, posting/editing announcements, creating/closing polls, maintenance issues & comments, units/expenses management, building settings (IBAN). All of these stay web-only for now — mobile is read-only on `/api/building/*` except for casting a poll vote (see `usePolls.ts`). Creating a building (the admin "I manage this building" setup flow) is also web-only; mobile only ever joins as a resident via invite code.
- EAS build/submit configuration — distribution is via Expo Go only so far.
- A public profile view, or any i18n coverage of web's marketing/landing-page content.
