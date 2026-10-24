# Security Architecture & RLS Guide

A comprehensive overview of the multi-layered security defenses, route guarding, API authentication, Row Level Security (RLS) policies, and prompt injection protections in the Hackathon Startup Template. RLS and API-auth sections apply equally to `apps/mobile` (same Supabase project, same API, just a different client attaching the Bearer token — see `apps/mobile/lib/api-client.ts`'s `apiFetch()`); the route-guarding section (Next.js `proxy.ts`) is `apps/web`-only, since mobile has no routing layer to guard the same way — gated tabs just render a "sign in" prompt instead.

---

## Multi-Layer Defense Architecture

```
                    ┌─────────────────────────────────────────┐
                    │            Client Request               │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
Layer 1: Edge Proxy / Middleware ────────┴─── [proxy.ts: Cookie-based Route Guarding]
                                         │
                                         ▼
Layer 2: Protected Page Hooks ───────────┴─── [useAuth(): Client-side Session Verification]
                                         │
                                         ▼
Layer 3: Backend API Validation ─────────┴─── [authenticateRequest(): Cryptographic JWT Verification]
                                         │
                                         ▼
Layer 4: Database Storage & Tables ──────┴─── [Supabase RLS: Postgres Row-Level Security Policies]
```

---

## 1. Layer 1: Edge Route Guarding (`proxy.ts`)

Before any Next.js React code runs on the client, `proxy.ts` inspects incoming HTTP requests for protected routes (`/dashboard`, `/settings`, `/ai`).

- Checks for the presence of session cookies (`sb-auth-token`).
- If unauthenticated, immediately issues a `307 Temporary Redirect` to `/login?redirect=<path>`.

---

## 2. Layer 2: API Cryptographic JWT Authentication (`lib/api/auth.ts`)

All protected backend API endpoints (`/api/ai/*`, `/api/analytics/*`, `/api/profile`, `/api/auth/delete-account`) validate the caller's JWT:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.split(' ')[1]
  // Cryptographically verifies token against Supabase Auth
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
  }

  return { user }
}
```

---

## 3. Layer 3: Supabase Row Level Security (RLS)

All database tables have Row Level Security enabled by default in [`database/scripts/fresh-database-setup.sql`](../database/scripts/fresh-database-setup.sql):

### User Profiles Policy
```sql
-- Public profiles viewable by all; private profiles viewable by owner only
CREATE POLICY "Profiles visibility policy"
    ON public.profiles FOR SELECT
    USING (is_public = true OR auth.uid() = id);

-- Users can only modify their own profile record
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

### Chat History Policy (Isolated Per-User)
```sql
CREATE POLICY "Users can view their own conversations"
    ON public.chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
        )
    );
```

---

## 4. Layer 4: AI System Guardrails & Prompt Injection Protection (`app/api/ai/config.ts`)

Server-side system instructions enforce strict AI boundaries:
- **Server-Only Prompts**: Guardrails and instructions reside in server-side configuration files and are never passed or exposed to the client bundle.
- **Strict Role Boundaries**: Explicit instructions to refuse revealing internal API credentials, database schemas, environment variables, or executing arbitrary unauthorized administrative commands.
- **Strict Structured Outputs**: `generateStructured<T>()` strictly validates AI output against typed JSON Schemas with the Gemini API to prevent malformed or unauthorized payloads.
