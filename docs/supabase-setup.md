# Supabase Database Setup

Complete, step-by-step guide to set up a brand new Supabase project for the Hackathon Startup Template. One Supabase project serves both `apps/web` and `apps/mobile` — nothing here is web-specific, mobile just reads the credentials into `apps/mobile/.env` as `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` instead of `NEXT_PUBLIC_*`.

---

## Fast Track: One-Click SQL Setup (Recommended)

You can set up all tables, relations, triggers, indexes, and storage rules in **one single step**:

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** (left sidebar) $\rightarrow$ click **New query**.
3. Copy and paste the entire content of [`database/scripts/fresh-database-setup.sql`](../database/scripts/fresh-database-setup.sql).
4. Click **Run** (or press `Ctrl+Enter`).

---

## Step-by-Step Manual Setup

If you prefer executing scripts individually or understanding the structure:

### 1. User Profiles Table & Automatic Signup Trigger
Run [`database/scripts/user-profiles-table.sql`](../database/scripts/user-profiles-table.sql):
- Creates `public.profiles` with `username`, `display_name`, `bio`, `avatar_url`, `is_public`, `website`, `github`, `twitter`, and `location`.
- Sets Row Level Security (RLS) so public profiles are readable by anyone, and users can only update/insert their own profile.
- Adds `handle_new_user()` trigger on `auth.users` to automatically create a profile entry whenever a new user signs up or logs in via OAuth.
- Adds `handle_updated_at()` trigger to auto-refresh timestamps.

### 2. AI Chat History Tables
Run [`database/scripts/ai-chat-history-tables.sql`](../database/scripts/ai-chat-history-tables.sql):
- Creates `public.chat_conversations` (isolated per user with RLS).
- Creates `public.chat_messages` (roles: `'user'` / `'model'`, tied to conversation ID).
- Adds foreign keys with `ON DELETE CASCADE` and index optimizations.

### 3. Analytics Events Table
Run [`database/scripts/analytics-events-table.sql`](../database/scripts/analytics-events-table.sql):
- Creates `public.analytics_events` for real-time dashboard activity tracking.
- Secures data with RLS so authenticated users can insert and view their own analytics.
- Adds indexes for `user_id`, `event_type`, and `created_at DESC`.

### 4. Avatar Storage Bucket Setup
1. Go to **Storage** in your Supabase Dashboard.
2. If not already created, create a bucket named `avatars`.
3. Check the **Public bucket** toggle.
4. Run [`database/scripts/avatar-storage-bucket.sql`](../database/scripts/avatar-storage-bucket.sql) in SQL Editor to apply storage access policies (public read, authenticated user upload/update/delete restricted to their folder).

---

## Step 5: Configure Authentication & Redirect URLs

### 1. URL Configuration (Crucial for Vercel / Production & OAuth)
1. Go to **Authentication** (left sidebar) $\rightarrow$ **URL Configuration**.
2. **Site URL**:
   - For local development: `http://localhost:3000`
   - For production: `https://your-domain.vercel.app`
3. **Redirect URLs (Allow list)** — Click **Add URL** and add:
   - `http://localhost:3000/**`
   - `https://your-domain.vercel.app/**`
   - `https://*.vercel.app/**` *(optional: allows branch/preview deployments)*

### 2. Social OAuth Providers (Optional)

#### Google OAuth:
1. Enable Google under **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Google**.
2. Go to [Google Cloud Console $\rightarrow$ Credentials](https://console.cloud.google.com/apis/credentials).
3. Create an OAuth 2.0 Web Application client:
   - **Authorized JavaScript origins**: `http://localhost:3000`, `https://your-domain.vercel.app`
   - **Authorized redirect URIs**: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** into the Supabase Google provider settings.

#### GitHub OAuth:
1. Enable GitHub under **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **GitHub**.
2. Go to [GitHub Developer Settings $\rightarrow$ OAuth Apps](https://github.com/settings/developers) $\rightarrow$ **New OAuth App**.
   - **Homepage URL**: `https://your-domain.vercel.app` (or `http://localhost:3000`)
   - **Authorization callback URL**: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret** into Supabase.

---

## Step 6: Environment Variables Setup

In your project root, create or update `.env.local` (or `.env`):

```env
# Supabase Configuration (From Supabase Dashboard > Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google AI Gemini API Key (From https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key

# App Configuration
NEXT_PUBLIC_PROJECT_NAME="Hackathon Startup"
NEXT_PUBLIC_AI_MODEL="gemini-3.6-flash"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## Step 7: Optional Demo Data Seeding

To quickly populate sample AI conversations and analytics events for demoing:
- Run [`database/scripts/seed-demo-data.sql`](../database/scripts/seed-demo-data.sql) in your SQL Editor.

---

## Step 8: Row Level Security (RLS) Cheat Sheet for New Tables

> **Why does `supabase.from('my_table').select('*')` return `[]` without error?**  
> Supabase enables RLS by default. Any newly created table without an explicit policy returns empty results.

Use these quick templates from [`database/scripts/rls-boilerplate-templates.sql`](../database/scripts/rls-boilerplate-templates.sql):

### Pattern A: Full Open Access (Fast Hackathon Prototyping)
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access"
    ON my_table
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

### Pattern B: User-Owned Data (Isolated Per-User CRUD)
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rows"
    ON my_table
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### Pattern C: Public Read + Authenticated Write
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON my_table FOR SELECT USING (true);
CREATE POLICY "Authenticated insert" ON my_table FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON my_table FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON my_table FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

---

## Verification Checklist

1. [x] Run `database/scripts/fresh-database-setup.sql` in SQL Editor.
2. [x] Sign up a test user on `/signup` — check that a profile is automatically created in `profiles` table.
3. [x] Upload an avatar in `/settings` — verify it uploads to `avatars` bucket and renders.
4. [x] Send a message on `/ai` — verify conversation and messages persist in `chat_conversations` and `chat_messages`.
5. [x] View `/dashboard` — verify activity cards and chart metrics render.
