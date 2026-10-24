# OAuth Authentication Setup (Google & GitHub)

Complete guide for configuring social OAuth login with Google and GitHub in the Hackathon Startup Template. This is `apps/web`-only — `apps/mobile` only supports email/password sign-in against the same Supabase project, no OAuth flow yet. All paths below are relative to `apps/web/`.

---

## How OAuth Works in this Template

The template uses the **PKCE (Proof Key for Code Exchange)** authentication flow via Supabase Auth:

```
[User clicks "Google" / "GitHub"]
           │
           ▼
[Supabase redirects to Provider Consent Screen]
           │
           ▼
[User approves login]
           │
           ▼
[Provider redirects back to Supabase Auth Callback]
           │ (https://<project-ref>.supabase.co/auth/v1/callback)
           ▼
[Supabase redirects back to App Callback with Session]
           │ (https://your-domain.vercel.app/auth/callback)
           ▼
[App handles session & redirects to /dashboard]
```

---

## Step 1: Configure Supabase URL Configuration (Critical)

> **Important**: If your production Vercel URL is not in the Supabase Redirect URLs allowlist, Supabase will reject the redirect and fallback to `http://localhost:3000`, causing mobile and production logins to fail.

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** (left sidebar) $\rightarrow$ **URL Configuration**.
3. Set **Site URL**:
   - For local development: `http://localhost:3000`
   - For production: `https://your-project.vercel.app` (or your custom domain)
4. Under **Redirect URLs** (Allow list), click **Add URL** and add the following entries:
   - `http://localhost:3000/**` *(enables all local development callbacks)*
   - `https://your-project.vercel.app/**` *(enables all production callbacks)*
   - `https://*.vercel.app/**` *(optional: allows branch and preview deployments)*
5. Click **Save**.

---

## Step 2: Google OAuth Setup

### 1. Configure Google Cloud Console
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create a new project (e.g. `My Hackathon App`) or select an existing project.
3. If you haven't configured the **OAuth consent screen**:
   - Go to **APIs & Services** $\rightarrow$ **OAuth consent screen**.
   - Select **External** $\rightarrow$ Click **Create**.
   - Fill in **App name**, **User support email**, and **Developer contact email**.
   - Under **Scopes**, keep default (`email`, `profile`, `openid`).
   - Click **Save and Continue** until finished.

### 2. Create OAuth 2.0 Client ID
1. Go to **APIs & Services** $\rightarrow$ **Credentials**.
2. Click **+ CREATE CREDENTIALS** $\rightarrow$ **OAuth client ID**.
3. Select **Application type**: `Web application`.
4. Set **Name**: `Hackathon Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `https://your-project.vercel.app` (your production URL)
6. Under **Authorized redirect URIs**, add your Supabase Auth Callback URL:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
   *(Find this in Supabase Dashboard > Authentication > Providers > Google > Callback URL)*
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

### 3. Enable Google in Supabase
1. Go to Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Google**.
2. Toggle **Enable Google provider** to ON.
3. Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console.
4. Click **Save**.

---

## Step 3: GitHub OAuth Setup

### 1. Register GitHub OAuth Application
1. Go to [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App** (or **Register a new application**).
3. Fill in:
   - **Application name**: `Hackathon Startup App`
   - **Homepage URL**: `https://your-project.vercel.app` (or `http://localhost:3000` for development)
   - **Application description**: `OAuth for Hackathon Startup`
   - **Authorization callback URL**:
     ```
     https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
     ```
     *(Find this in Supabase Dashboard > Authentication > Providers > GitHub > Callback URL)*
4. Click **Register application**.
5. Copy the **Client ID**.
6. Click **Generate a new client secret** and copy the generated secret.

### 2. Enable GitHub in Supabase
1. Go to Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **GitHub**.
2. Toggle **Enable GitHub provider** to ON.
3. Paste your GitHub **Client ID** and **Client Secret**.
4. Click **Save**.

---

## Step 4: Environment Variables Setup

Ensure your local `.env` and Vercel project environment variables contain the required credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: explicitly set site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

On Vercel, set `NEXT_PUBLIC_SITE_URL` to `https://your-project.vercel.app`.

---

## Step 5: Code Architecture & Hooks

### Auth Hook (`hooks/useAuth.ts`)
The `useAuth()` hook provides `signInWithGoogle` and `signInWithGitHub` methods that dynamically resolve the current origin:

```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error }
}

const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error }
}
```

### Callback Handler (`app/auth/callback/page.tsx`)
Listens for the OAuth exchange to complete, then redirects to `/dashboard` on success or `/login?error=auth-callback-error` on failure.

### Automatic Profile Creation Trigger
When a user signs in with Google or GitHub for the first time, Supabase creates a user record in `auth.users`. The PostgreSQL trigger `handle_new_user()` (included in `fresh-database-setup.sql`) automatically populates a profile row in `public.profiles`.

---

## Troubleshooting Guide

### 1. Redirecting to `localhost:3000` when logging in on mobile or production
- **Root Cause**: Your production Vercel URL is missing from the Supabase **Redirect URLs** allowlist. Supabase falls back to `Site URL` for safety.
- **Fix**: In Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration** $\rightarrow$ **Redirect URLs**, add `https://your-domain.vercel.app/**` and `https://*.vercel.app/**`.

### 2. "redirect_uri_mismatch" (Google Error 400)
- **Root Cause**: The redirect URI in Google Cloud Console does not match your Supabase project callback.
- **Fix**: In Google Cloud Console $\rightarrow$ Credentials $\rightarrow$ your OAuth Client $\rightarrow$ ensure **Authorized redirect URIs** contains exactly `https://<your-project-ref>.supabase.co/auth/v1/callback` (no trailing spaces).

### 3. "The redirect URI is not associated with this application" (GitHub)
- **Root Cause**: The callback URL in GitHub OAuth App settings is wrong.
- **Fix**: Ensure GitHub **Authorization callback URL** is set to `https://<your-project-ref>.supabase.co/auth/v1/callback`.

### 4. User logs in but profile is empty
- **Fix**: Ensure you ran [`database/scripts/fresh-database-setup.sql`](../database/scripts/fresh-database-setup.sql) in Supabase SQL Editor so the `on_auth_user_created` trigger is active.
