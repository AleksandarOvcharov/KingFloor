# Handoff 01 — Mobile app (Expo) buildout on the Turborepo monorepo

**Date:** 2026-10-17
**Repo:** `AleksandarOvcharov/hackathon-startup-template`
**main @ `f64a968`** · current work branch: **`feat/mobile-ai-chat` @ `cff1acd`** (1 commit ahead of main, not merged/pushed)

## Read this first

- `main` is healthy and deployed. Every commit on it in this log was verified with `pnpm type-check`, `pnpm lint`, `pnpm build` (via root Turborepo), the Playwright smoke suite, and — for anything touching `apps/mobile` — a real `expo export --platform android` to confirm Metro actually bundles it, not just that `tsc` is happy. Keep doing all of that before merging anything new.
- Everything here is a Bulgarian-speaking user giving plans (often pasted from another AI/collaborator) that I execute, verify, and push back on when something's wrong or missing. Read a plan before implementing it — twice now a pasted plan had a real gap (a naive `expo-secure-store` adapter that would've thrown on large sessions; a sign-in screen with no way to sign back out) that needed fixing, not just copying.
- Git workflow convention established all session: new work → feature branch → commit with a thorough message → **wait for explicit "merge it" / exact git commands before merging to `main`**, except direct bug-fix responses to a reported runtime error, which went straight to `main`. Don't assume; if unclear, ask or wait.

## Architecture

Turborepo + pnpm workspace (`pnpm-workspace.yaml`, `turbo.json` at root):

- **`apps/web/`** — the original Next.js 16 app, moved here wholesale from the repo root during the monorepo migration. Supabase auth, Gemini AI chat, Leaflet maps, i18n (BG/EN), full shadcn/ui component set. This is the "real" backend — `apps/mobile` has no backend of its own, it calls `apps/web`'s `/api/*` routes directly.
- **`apps/mobile/`** — Expo Router app (**SDK 57**, deliberately not latest — see "SDK version" below). Bottom tabs: Home (placeholder), AI Chat (real, wired to the backend), Profile (real, wired to Supabase).
- **`packages/shared/`** — `@workspace/shared`. Real types moved here from `apps/web` (not invented): `Locale`/`LOCALES`, `UserProfile`, `ChatMessage`. Zod schemas (new to this project — web never used Zod before): `loginSchema`, `signupSchema`, `profileUpdateSchema`, `aiGenerateSchema`. **Web's live API routes still use their own hand-written validation, not these schemas** — that swap was deliberately not made (separate, riskier refactor of working code, nobody asked for it).

## What's done (chronological, newest last)

1. Removed an earlier PWA/Capacitor-wrapped mobile web shell entirely (`app/mobile/*` on the old single-app layout) per explicit user request — see `revert/remove-mobile-module` branch/commit if you need the history, but there's nothing left of it to maintain.
2. Migrated the whole repo to the Turborepo monorepo layout described above (`apps/web`, `apps/mobile`, `packages/shared`).
3. Fixed a real Vercel build failure: Turborepo's strict env mode hides env vars from the build unless listed in `turbo.json`'s `globalEnv` — `SUPABASE_SERVICE_ROLE_KEY`/`GEMINI_API_KEY` were missing from it. Also added a build-time-safe fallback for `supabaseAdmin` in `apps/web/lib/supabase/server.ts` since that module gets evaluated eagerly while Next collects page data, even for fully-dynamic routes.
4. Deleted 4 stale, fully-merged feature branches from GitHub that were causing broken Vercel "preview" builds (pre-fix snapshots). If you see Vercel preview build failures again, check whether it's building a stale branch before assuming it's a real bug — check the branch/commit in the build log header.
5. Scaffolded `apps/mobile` with Expo Router (bottom tabs), wired to `@workspace/shared` types.
6. Added a native Supabase client (`apps/mobile/lib/supabase.ts`) with a **chunked** `expo-secure-store` adapter (`apps/mobile/lib/supabase-storage.ts`) — `expo-secure-store` hard-caps values at 2048 bytes and throws past it; a Supabase session routinely exceeds that. Don't simplify this back to a naive pass-through.
7. Added a real sign-in modal (`apps/mobile/app/sign-in.tsx`), validated with `loginSchema` from shared, plus Sign In/Sign Out buttons in `profile.tsx`.
8. Downgraded Expo from SDK 58 → **SDK 57** because the user's installed Expo Go app only supports 57 (manifested as the dev-build QR code hanging on a loading spinner, not an explicit version error). Every `expo-*`/`react-native-*` package version was aligned via `expo install --fix`, not guessed.
9. **(Current branch, not merged)** Wired the AI Chat tab to `apps/web`'s real `/api/ai/chat` endpoint — no native Gemini integration, no duplicated system instructions. `apps/mobile/lib/api-client.ts` attaches the mobile session's JWT as a Bearer token and calls `EXPO_PUBLIC_API_URL` + the route path. Also fixed a leftover duplicate `ChatMessage` interface in `apps/web/lib/ai/client.ts` that the shared-types migration missed.

## What remains to do

### Immediate — finish the current branch
- **`feat/mobile-ai-chat` is committed but not merged.** The user needs to test the actual authenticated chat flow on their device (sign in → send a message → confirm a real Gemini reply) before this merges — I verified the endpoint is live and auth-gated (curled it, got 401 without a token) but can't exercise the authenticated path myself.
- Once confirmed working: `git checkout main && git merge --no-ff feat/mobile-ai-chat -m "..." && git push origin main` (run the full verification suite first, per every prior merge in this history).

### Explicitly requested, not started
The user asked to "implement features from the web app" in mobile, emphasizing they must share the same backend (not reimplemented natively) — same pattern as the AI chat. Candidates mentioned directly to the user as next options, no commitment yet on which:
- **Dashboard** (analytics/activity) — `apps/web/app/dashboard/`, `apps/web/hooks/useAnalytics.ts`, `/api/analytics/*` routes.
- **Map** — `apps/web/components/map/`, `/api/geo/*` routes. Note: `react-native-maps` or a WebView-wrapped Leaflet would be needed; the web `MapView` component (Leaflet/DOM-based) can't be reused directly on native.
- **File upload** — `apps/web/lib/upload/`, Supabase Storage. Mobile would need `expo-image-picker`/`expo-document-picker` instead of the web `<input type="file">` flow.

### Explicitly scoped out (not oversights)
- **AI chat image attachments** (camera → `/api/ai/vision`) — real feature, deliberately deferred, needs camera permission wiring + base64 encoding on the native side.
- **Web API routes using the new Zod schemas** — schemas exist and are correct, but swapping web's working hand-written validation for them wasn't asked for.

### Needs the user, not an agent
- **Vercel "Root Directory" setting** → `apps/web`. I flagged this as needed right after the monorepo migration; I don't have evidence it was ever actually set (builds have been succeeding, so either it's set or Vercel auto-detected it — worth confirming in the dashboard rather than assuming).
- **Dockerfile** was updated for the new monorepo layout (standalone output now nests at `apps/web/server.js`) but never tested with a real `docker build` — this sandbox doesn't have Docker installed. Needs verification on a machine that does before relying on it.
- **iOS build** — genuinely impossible from this sandbox (Linux, no Xcode). The `ios/` native project was scaffolded once during the earlier (now-reverted) Capacitor phase; under the current Expo setup, `npx expo prebuild` would regenerate it fresh whenever someone with a Mac needs it. Nothing to do here except note it can't be verified from this environment.

### Housekeeping, low priority
- Several local-only branches exist that are already merged into `main` and can be deleted for tidiness: `feat/shared-types-migration`, `feat/mobile-expo-router`, `feat/mobile-supabase-auth`, `feat/mobile-auth-screen`, `fix/expo-sdk-57-downgrade`. They were never pushed to origin, so this is purely local cleanup (`git branch -d <name>`), not urgent.
- `feature/mobile-module` is a very old local branch from the pre-monorepo PWA/Capacitor shell that got fully reverted — safe to delete, it's dead history.

## Gotchas worth knowing before you touch things

- **`@types/react` is pinned workspace-wide** via `pnpm-workspace.yaml`'s `overrides` (currently `~19.2.4`, matching SDK 57). If you ever bump the Expo SDK again, you *must* update this override to match whatever `expo install --fix` sets `apps/mobile`'s `@types/react` to, or `apps/web`'s type-check breaks with a confusing "Key symbol" mismatch in shadcn components (cmdk, sonner, input-otp) — this already happened once.
- **`turbo.json`'s `globalEnv`** needs every env var `apps/web` actually reads at build time (`NEXT_PUBLIC_*` vars are auto-passed-through by Turbo's Next.js framework detection; plain secrets like `SUPABASE_SERVICE_ROLE_KEY`/`GEMINI_API_KEY` are not). If you add a new required server-only env var to web, add it here too or Vercel builds will fail with a cryptic "X is required" error deep in module evaluation, not an obviously-env-related one.
- **`.npmrc` has `node-linker=hoisted`** — required for Metro to resolve packages correctly in this pnpm workspace. Don't remove it without re-verifying `expo export` still bundles cleanly.
- **Expo SDK is pinned to 57, not latest, on purpose.** Don't "upgrade" it without first confirming what SDK the tester's actual installed Expo Go app supports — that's literally why it got downgraded from 58 in the first place.
- **This sandbox's `pnpm` binary is a shebang-less shell shim** (`/usr/bin/pnpm`), which breaks when Turborepo (a Rust binary) tries to spawn it directly — works fine from an interactive shell (bash silently falls back to `sh`) but fails with "Exec format error" from Turbo. Worked around locally with a wrapper at `~/.local/bin/pnpm` prepended to `PATH`. **This is almost certainly specific to this one sandbox/container image, not a real project issue** — if a fresh environment hits this, recreate the wrapper (`exec /usr/bin/node /usr/lib/node_modules/pnpm/bin/pnpm.mjs "$@"`) rather than assuming it's a repo bug.
- **Android SDK is set up locally** at `~/Android/Sdk` (command-line tools only, platform 35, build-tools 35.0.0) with a separate JDK 21 at `~/jdks/jdk-21.0.12.1+1` (the system's default JDK 25 is too new for the Gradle/AGP versions Capacitor/RN tooling uses). This was from the earlier Capacitor phase and may not be needed anymore under pure-Expo development (Expo Go doesn't need a local Android SDK at all — only a real `expo prebuild` + native Gradle build would). Environment-specific, not part of repo state.

## Quick verification commands

From repo root (prepend `PATH="$HOME/.local/bin:$PATH"` if you hit the pnpm shim issue above):

```bash
pnpm install
pnpm type-check   # turbo, fans out to web + mobile + shared
pnpm lint
pnpm build
pnpm --filter web exec playwright test   # smoke suite, needs port 3000 free

# Mobile-specific — this is the one that actually proves something, not just tsc:
cd apps/mobile && pnpm exec expo export --platform android
rm -rf apps/mobile/dist apps/mobile/.expo   # clean up after
```
