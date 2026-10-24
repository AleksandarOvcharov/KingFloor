# Setup Guide

Complete setup instructions for the Hackathon Startup Template monorepo. This covers getting `apps/web` running; for the Expo mobile app on top of the same backend, see [Mobile App Setup](#mobile-app-setup) near the end, or the full guide at [`docs/mobile.md`](./mobile.md).

## Prerequisites

- **Node.js** 18.17 or later ([Download](https://nodejs.org/))
- **pnpm** 12.4.1 or later
- **Supabase account** ([Sign up](https://supabase.com))
- **Google AI API key** ([Get one free](https://aistudio.google.com/apikey))

### Installing pnpm

```bash
corepack enable
corepack prepare pnpm@12.4.1 --activate
```

Or: `npm install -g pnpm@12.4.1`

## Step 1: Install Dependencies

Installs all 4 workspace packages (`apps/web`, `apps/mobile`, `packages/shared`, `packages/ui`) in one pass:

```bash
cd hackathon-startup-template
pnpm install
```

## Step 2: Supabase Setup

### 1. Create a Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in project name, database password, and region
4. Wait for setup to complete

### 2. Get Your Credentials
1. Go to **Project Settings** > **API**
2. Copy: **Project URL**, **anon public** key, and **service_role** key

### 3. Create All Database Tables & Triggers (One-Click Setup)
Open your Supabase **SQL Editor** and run [`database/scripts/fresh-database-setup.sql`](../database/scripts/fresh-database-setup.sql).

This instantly creates and configures:
- **`profiles` table** — User profiles with username, avatar, bio, display name, location, website, social handles, public/private visibility, and auto-signup trigger.
- **`avatars` storage bucket & RLS policies** — Secure public avatar images and authenticated user upload rules.
- **`chat_conversations` & `chat_messages` tables** — Per-user persistent AI chat history.
- **`analytics_events` table** — Real-time event logging and dashboard statistics.

> **Hackathon Tip (RLS Boilerplate)**: When creating your own tables (e.g., `orders`, `tasks`), apply policies from [`database/scripts/rls-boilerplate-templates.sql`](../database/scripts/rls-boilerplate-templates.sql) to prevent queries returning empty arrays `[]`.

### 4. URL & Authentication Configuration
1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to `http://localhost:3000` (or your production Vercel domain)
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `https://your-domain.vercel.app/**`
4. *(Optional)* Enable **Google** and **GitHub** OAuth (see [`docs/oauth-setup.md`](oauth-setup.md))

## Step 3: Google Gemini Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in and click **"Create API key"**
3. Copy the key

## Step 4: Environment Configuration

Copy `apps/web/.env.example` to `apps/web/.env` — **not** a root-level `.env`, the web app's env file lives inside `apps/web/`:

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# App Config
NEXT_PUBLIC_PROJECT_NAME=My Project
NEXT_PUBLIC_AI_MODEL=gemini-3.6-flash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Important Notes:
- Never commit `.env` to version control
- `NEXT_PUBLIC_` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are server-only

## Step 5: Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Verify Everything Works

1. Sign up with email and password
2. Check your profile is auto-created (username = email prefix)
3. Upload an avatar in `/settings`
4. Try the AI chatbot at `/ai` (with voice dictation & attachments)
5. Explore the interactive OpenStreetMap with GPS & reverse geocoding at `/features`
6. Check the analytics dashboard at `/dashboard`
7. Toggle dark/light mode

## Step 6: Customize

### Project Name
Set `NEXT_PUBLIC_PROJECT_NAME` in `apps/web/.env` — used in the header and AI instructions.

### AI Behavior
Edit `apps/web/app/api/ai/config.ts` to customize the AI's personality, features list, rules, and page references.

### Theme Colors
Edit `apps/web/app/globals.css` — HSL CSS variables in `:root` (light) and `.dark` (dark). If you change these, also update `apps/mobile/lib/theme.ts`'s hex palette by hand — nothing keeps the two in sync automatically; see [`docs/mobile.md`](./mobile.md).

### Add New Pages
Create files in `apps/web/app/`. For protected routes, use `useAuth()` + `useEffect` redirect.

## Step 7: Build for Production

### Local build
```bash
pnpm build
pnpm --filter web start   # 'start' has no root script
```

### Docker
```bash
docker-compose up --build
```

### Vercel
1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables in project settings (including `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_VERCEL_URL`)
4. Deploy

## Mobile App Setup

The Expo app in `apps/mobile` shares the same Supabase project and calls the deployed web app's API — it doesn't need its own database or AI key.

1. Install Expo Go on your phone (must match the SDK version pinned in `apps/mobile/package.json` — currently **57**; see `apps/mobile/AGENTS.md` if the dev-build QR code hangs on a loading spinner, that's usually an SDK mismatch, not a network issue).
2. `cp apps/mobile/.env.example apps/mobile/.env` and fill in:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   EXPO_PUBLIC_API_URL=https://your-deployed-web-app.vercel.app
   ```
   `EXPO_PUBLIC_API_URL` must be a URL your **phone** can actually reach — `http://localhost:3000` will not work on a real device; deploy `apps/web` first (even to a Vercel preview) or use your machine's LAN IP if testing against a local dev server on the same network.
3. ```bash
   cd apps/mobile
   pnpm exec expo start
   ```
   Scan the QR code with Expo Go.

Full architecture, the native component library, the WebView map-embed pattern, and known gaps: [`docs/mobile.md`](./mobile.md).

## Troubleshooting

| Issue | Solution |
|---|---|
| Port 3000 in use | `PORT=3001 pnpm dev` |
| TypeScript errors | `pnpm type-check` (checks all 4 workspace packages) |
| Supabase connection fails | Verify `apps/web/.env` credentials, check project isn't paused |
| Supabase query returns `[]` (empty) | Table is locked by RLS. Run [`database/scripts/rls-boilerplate-templates.sql`](../database/scripts/rls-boilerplate-templates.sql) |
| OAuth redirects to localhost on phone/prod | Add `https://your-domain.vercel.app/**` to Supabase **Redirect URLs allow list** |
| Build errors | `rm -rf apps/web/.next && pnpm build` |
| Lock file issues | `rm -rf node_modules pnpm-lock.yaml && pnpm install` (from repo root) |
| AI not responding | Check `GEMINI_API_KEY` in `apps/web/.env` |
| Chat history not saving | Run SQL from `database/scripts/fresh-database-setup.sql` |
| Dashboard empty | Run SQL from `database/scripts/fresh-database-setup.sql` |
| Mobile Map tab shows 404 | `EXPO_PUBLIC_API_URL` points at a deployment that doesn't have the `/embed/map` route yet — redeploy `apps/web`, then reload the app in Expo Go |
| Mobile dev build QR hangs on a spinner | Usually an Expo SDK mismatch between `apps/mobile/package.json` and the installed Expo Go app, not a network issue |
| Mobile `tsc` passes but the app won't run | `tsc` doesn't prove Metro can bundle it — run `cd apps/mobile && pnpm exec expo export --platform android` instead |

## Useful Commands

```bash
# From the repo root (Turborepo fans out to every workspace package that defines the script)
pnpm dev                    # Web dev server (Turbopack)
pnpm build                  # Production build (web + packages)
pnpm lint                   # ESLint (web only)
pnpm type-check             # TypeScript checks across all 4 packages
docker-compose up --build   # Docker build & run (web only)

# Web-only (no root script)
pnpm --filter web start

# From apps/mobile/
pnpm exec expo start
pnpm exec expo export --platform android   # the real "does this actually bundle" check
```
