# Changelog

## Version 5.0.0 - Turborepo Monorepo Migration & Mobile App (Expo)

### Breaking Change

- **Repo restructured into a Turborepo-managed pnpm monorepo.** Everything that used to live at the repo root (`app/`, `components/`, `hooks/`, `lib/`, `next.config.ts`, etc.) now lives in `apps/web/`. Any doc, script, or mental model referencing a bare `app/`/`components/`/`hooks/`/`lib/` path predates this migration and is wrong — see `AGENT.md` §0.

### New Features

- **`apps/mobile/` — a new Expo Router app (SDK 57)**, sharing the same Supabase backend and calling the same deployed `/api/*` routes as the website (no separate backend). Ships with:
  - **AI Chat tab**: calls `/api/ai/chat` with a Bearer-token-authenticated `apiFetch()` (plain text only — no voice/image attach yet).
  - **Dashboard tab**: calls `/api/analytics/stats`, renders stat cards + a 14-day activity chart (`react-native-svg`, no native maps/charts dependency) + an activity feed.
  - **Settings tab**: ports `apps/web`'s `useProfile()` logic verbatim (same `/api/profile` PUT shape) for username/bio/extended-info/visibility, plus account deletion via `/api/auth/delete-account`. Avatar upload deliberately not ported (needs `expo-image-picker`).
  - **Map tab**: a `WebView` embedding a new chrome-free `apps/web/app/embed/map` route that renders the *real* `<MapView/>` component — the only viable way to run the actual Leaflet map on-device without `react-native-maps` (needs a custom dev client, incompatible with this project's Expo-Go-pinned workflow).
  - **Dark mode + BG/EN i18n**, matching web's design tokens and translations exactly (see below).
  - **A native component library** (`apps/mobile/components/ui/`): `Button`, `Card`, `Badge`, `Input`, `Label`, `Separator`, `Switch`, `Skeleton`, `Progress`, `Avatar` — built from scratch with RN primitives (Radix/Tailwind can't run on React Native), but matching `packages/ui`'s component/variant *names* for API parity across apps.
- **`packages/shared` (`@workspace/shared`) is now a real package**, not an empty scaffold: `UserProfile`/`ChatMessage`/`DashboardStats`/`DailyMessageStat`/`AnalyticsEvent` types, Zod schemas, and — most significantly — **the entire i18n system** (`dictionaries`, `pickLocale`, `tFormat`, `isLocale`, `LANGUAGE_META`) moved verbatim from `apps/web/lib/i18n/dictionaries.ts`, which is now a thin re-export. `apps/mobile` reads the exact same dictionary, not a reimplementation.
- **`packages/ui` (`@workspace/ui`) — a new package** holding all 57 of `apps/web`'s shadcn/Radix components, moved verbatim from `apps/web/components/{ui,shadcn}/` (git recorded them as renames, 96–100% similarity — only import paths changed). 3 files stayed in `apps/web` (`copy-button.tsx`, `export-button.tsx`, `shadcn/notification.tsx`) since they depend on `apps/web`-only context (the i18n hook, the stateful notification provider) that would need rewriting, not moving, to relocate.

### Fixes

- **Mobile Map tab rendered light-mode UI regardless of the app's theme setting.** The embedded `WebView` page is a separate browser context with its own fresh `localStorage` — it had no way to know what theme the native app was in, so it always rendered its own default (light). Fixed by passing the mobile theme as `?theme=dark|light` in the embed URL and applying `.dark` to `<html>` server-side via an early inline script.
  - First attempt (applying `.dark` to a wrapper `<div>` instead of `<html>`) did **not** work and revealed a real Tailwind v4 subtlety worth remembering: `--color-background: hsl(var(--background))` (the `@theme` token `bg-background` etc. resolve to) is computed once and inherited from `:root` — overriding `--background` on a descendant doesn't retroactively change an already-inherited `--color-background` value. The class has to land on the actual root.
- **`Dockerfile` updated for `packages/ui`**: the `deps`/`builder` stages now also copy `packages/ui/package.json` + its `node_modules` (previously only `packages/shared`'s were copied, which would have broken the image the moment `apps/web` started depending on `@workspace/ui`). Also now copies `apps/mobile/package.json` so pnpm's workspace resolution has every importer `pnpm-lock.yaml` expects, even though mobile is never built into the image. **Still never verified with a real `docker build`** (no Docker in this project's dev sandbox) — verify before relying on it.

---

## Version 4.1.0 - Internationalization (BG/EN), Colorblind-Friendly Mode & Next.js 16.4.2

### New Features

- **Internationalization (`lib/i18n/`)**:
  - Full BG/EN translation coverage across every page (home, dashboard, settings, AI chat, about, public profiles, the features showcase) and shared components (modals, uploads, toasts, the app-wide error boundary, speech-to-text errors).
  - Single-source dictionary format: every string is written once as `myKey: {en: '...', bg: '...'}` in `lib/i18n/dictionaries.ts` — TypeScript's `satisfies StringTree` check flags a missing language immediately at that line, replacing the old two-parallel-objects format that was easy to let drift.
  - `LanguageToggle` dropdown (flag + native name, checkmark on the active locale) replaces the previous plain EN/BG button pair, in the header and Settings.
- **Colorblind-Friendly Accessibility Mode (`hooks/useAccessibility.ts`)**:
  - Remaps `--success`/`--destructive` from the default red/green to a colorblind-safe blue/amber pairing, and darkens `--border`/`--input` to clear the WCAG 1.4.11 non-text contrast minimum (WebAIM).
  - Migrated existing hardcoded `emerald-500`/`red-500` status colors across toasts, upload progress, dashboard stats, the activity feed, and modal templates onto the new `text-success`/`text-destructive` tokens so the mode actually affects them.
  - Toggle icon uses lucide's `Glasses` (color-vision correction/assistance) instead of the generic `Accessibility` (wheelchair) icon.

### Fixes

- **i18n Hydration Mismatch (critical)**: locale was read from `localStorage` synchronously during the client's first render, while the server always rendered the default locale — any visitor with a saved non-default locale got a full-tree hydration mismatch on every translated string, on every page. Fixed by moving the locale preference to a cookie: `app/layout.tsx` (Server Component) reads it via `cookies()` and renders `<html lang={locale}>` + `I18nProvider initialLocale={locale}` directly, so server and client agree from the first byte. Existing visitors with only the old `localStorage` value are migrated to the cookie automatically. The identical latent bug in colorblind mode (read directly in rendered `className`/`aria-pressed`/`checked` props) was fixed the same way it's handled for theme flashing: start at the server-matched default, sync from `localStorage` in a post-mount effect. See `docs/i18n-and-accessibility.md` for the full write-up.
  - Trade-off: reading `cookies()` in the root layout forces every route to be dynamically server-rendered instead of statically prerendered (an App Router constraint). Acceptable here since every page was already client-side/auth-gated.
- Fixed a stray literal `\n` string embedded in JSX (features page's smooth-scroll status card) instead of an actual line break.

### Upgrades

- Next.js `16.3.5` → `16.4.2` (latest stable).
- Tailwind CSS `4.1.18` → `4.3.3` (fixes a Node `module.register()` deprecation warning from its Jiti-based config loader).
- `pnpm` `10.32.1` → `12.4.1` (docs now match the version actually pinned in `package.json`).

---

## Version 4.0.0 - Production Hardening, React 19 / Next.js 16 SSR & Hydration Resilience

### Improvements & Fixes

- **React 19 & Next.js 16 Hydration Resilience**:
  - Upgraded `Button` component with `@radix-ui/react-slot` (`Slot` / `asChild`), eliminating invalid `<button>` in `<a>` DOM nesting across the entire application.
  - Added `suppressHydrationWarning` on dynamic timestamps and localized date displays across Dashboard, Settings, Activity Feeds, and User Profiles to eliminate SSR/client timezone mismatch warnings.
  - Hardened `useProfile` with `typeof window === 'undefined'` guards and initialized state to `null` on SSR to ensure seamless initial client mount.
  - Verified `Lenis` smooth scroll lifecycle executes strictly in `useEffect` and properly invokes `lenis.destroy()` on unmount.

- **AI Layer Robustness & JSON Sanitization**:
  - Implemented regex-based Markdown code fence cleaning (`cleanAndParseJson`) in `lib/ai/client.ts` to guarantee safe JSON parsing even when models wrap outputs in Markdown blocks.
  - Enforced 4.5MB payload size validation on `/api/ai/vision` and `/api/ai/transcribe` routes to prevent Vercel body-size overflow errors.
  - Added `stop()` abort capability (`AbortController`) and a 30-second defensive timeout in `useAI` to prevent hanging chat states.

- **Microphone & Speech-to-Text Safety**:
  - Added `window.isSecureContext` check before calling Web Speech API or `getUserMedia` to provide clear warnings on non-HTTPS environments.
  - Implemented graceful error recovery for microphone permission denial (`NotAllowedError`), resetting `isListening` and `isTranscribing` immediately.
  - Enforced mandatory `MediaStreamTrack.stop()` upon recording completion to eliminate audio hardware memory leaks.
  - Added short-circuit for micro audio chunks (< 200 bytes) in `/api/ai/transcribe` returning empty transcript without unnecessary AI calls.

- **Input Sanitization & Double-Submit Protection**:
  - Enforced `.trim().toLowerCase()` on authentication emails and `.trim()` on profile usernames to eliminate whitespace issues from mobile keyboards.
  - Added comprehensive `disabled={loading}` and `isAnyLoading` guards with visual spinner feedback across all form submissions and OAuth buttons.
  - Added <kbd>Enter</kbd> (send) vs <kbd>Shift</kbd> + <kbd>Enter</kbd> (newline) handling in AI chat with instant double-submission prevention (`isSendingRef`).
  - Added query validation (`query.trim()`) to map search and geocoding proxy routes.

- **Supabase Authentication & Empty Data Safety**:
  - Hardened `useAuth` with `isMounted` flags and defensive `try/catch/finally` blocks.
  - Added defensive optional chaining and empty array guards in export buttons and dashboard charts.

---

## Version 3.9.3 - Universal Mobile & Sub-768px Viewport Optimizations

### Improvements & Fixes

- **Header & Navigation Drawer (`components/header.tsx`, `components/user-menu.tsx`)**:
  - Refactored mobile drawer to use absolute full-width dropdown with smooth backdrop blur overlay and body scroll locking (`document.body.style.overflow = 'hidden'`).
  - Switched from nested `<Link><Button>` structures to direct `buttonVariants(...)` applied on `<Link>` elements, eliminating HTML5 nesting violations and preserving clean keyboard navigation.
  - Added user authentication card with avatar, username, and email directly inside the mobile navigation drawer.
- **Component Library & Showcase Viewport Defenses (`components/shadcn/`, `components/ui/`, `app/features/page.tsx`)**:
  - Enforced `max-w-full overflow-hidden` by default on `Card` primitives, preventing child elements or code blocks from blowing out card containers on viewports from 320px up.
  - Sized `CodeBlock` header tabs with horizontal touch panning (`overflow-x-auto no-scrollbar touch-pan-x`) and pinned copy action buttons to the right.
  - Sized `Carousel` previous/next navigation buttons within container bounds (`left-1 sm:-left-6 md:-left-10` and `right-1 sm:-right-6 md:-right-10`) to eliminate horizontal document scroll on mobile.
  - Added auto-wrapping to `ToggleGroup` and `Pagination` to prevent clipping on 320px–375px screens.
  - Set responsive slot dimensions and scroll wrappers on `InputOTP`.
  - Constrained all dialogs, sheets, and popovers to `calc(100vw-2rem)` / `w-[85vw]` and `max-h-[90vh] overflow-y-auto`.

---

## Version 3.9.2 - Animated Loading Screen & Next.js Upgrade

### Improvements & Fixes

- **Next.js & Tooling Upgrade**:
  - Upgraded Next.js to latest `16.3.5` (Turbopack engine & compiler updates) alongside `eslint-config-next@16.3.5`.
- **Animated Loading Screen (`components/ui/global-loading.tsx`, `app/loading.tsx`)**:
  - Replaced plain text `"Loading..."` blank page fallback across all pages (`app/page.tsx`, `app/about/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/features/page.tsx`) with the `<LoadingScreen />` component featuring a rotating CSS spinner animation (`border-t-primary animate-spin`) and subtle pulsing status text.
  - Added Next.js App Router root `app/loading.tsx` boundary ensuring smooth instant visual feedback with rotating spinner animation during initial route transitions and SSR streaming.
  - Enhanced `AuthForm` submit buttons with inline rotating spinners (`InlineLoader`) during authentication and registration.

---

## Version 3.9.1 - Optimistic Instant Pin Rendering, Map Zoom Fix & Supabase RLS Boilerplate

### Improvements & Fixes

- **OpenStreetMap Optimistic Instant Pin Drop**:
  - Implemented 0ms instant UI pin placement on map click with automatic waterbody detection (`getOceanOrWaterbody`) and asynchronous reverse-geocoding enrichment via Nominatim.
- **Supabase RLS Starter Boilerplate (`database/scripts/rls-boilerplate-templates.sql`)**:
  - Created ready-to-copy Row Level Security templates for hackathons (Open Access, User-Owned Data, Public Read + Authenticated Write).
