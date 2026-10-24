# Utility Functions

`apps/web`-only utilities (paths below relative to `apps/web/`). `cn()` has a duplicate in `packages/ui/src/lib/utils.ts` (import as `@workspace/ui/lib/utils` from inside that package) — not imported from here, since `apps/web` can't be a dependency of a package it itself depends on; the two are kept manually in sync (it's a 3-line function, low risk). None of this is used by `apps/mobile`.

## cn() - ClassName Utility

Located in `lib/utils.ts`. Merges Tailwind CSS classes with conflict resolution using `clsx` + `tailwind-merge`.

```tsx
import { cn } from '@/lib/utils'

// Conditional classes
export function Example({ isActive, className }: { isActive?: boolean; className?: string }) {
  return <div className={cn('p-4', isActive && 'bg-primary', className)} />
}

// Later classes override earlier ones
const merged = cn('p-4', 'p-8') // => 'p-8'
```

---

## Geocoding Utilities (`lib/geo/geocoding.ts`)

Free OpenStreetMap Nominatim helper functions with built-in in-memory coordinate caching and structured address parsing.

```typescript
import { reverseGeocode, forwardGeocode, formatConciseAddress } from '@/lib/geo/geocoding'

// 1. Reverse Geocode: Convert coordinates to street address & city
const location = await reverseGeocode(37.7749, -122.4194, { lang: 'en', zoom: 18 })
console.log(location.displayName)
// "San Francisco City Hall, 1, Dr. Carlton B. Goodlett Place, Civic Center, San Francisco, California, 94102, United States"

console.log(formatConciseAddress(location))
// "Dr. Carlton B. Goodlett Place, San Francisco, United States"

// 2. Forward Geocode: Search coordinates by query string
const results = await forwardGeocode('Berlin Brandenburg Airport', { limit: 1 })
console.log(results[0].lat, results[0].lng)
```

---

## notify() - One-Line Notifications

Located in `lib/notify.ts`. Triggers customizable toast notifications with variant styling.

```typescript
import { notify } from '@/lib/notify'

notify('Operation completed successfully!')
notify.success('Saved changes!')
notify.error('Failed to update settings')
notify.destructive('Account deleted')
```

---

## copyToClipboard() - Async Clipboard Helper

Located in `lib/copy-to-clipboard.ts`. Copies text to the system clipboard with legacy fallback.

```typescript
import { copyToClipboard } from '@/lib/copy-to-clipboard'

async function handleShare() {
  const success = await copyToClipboard('https://example.com/share')
  if (success) {
    console.log('Copied to clipboard!')
  }
}
```

---

## createStore() & createSimpleStore() - State Management

Located in `lib/store.ts`. Zero-dependency, type-safe React context stores.

```typescript
import { createSimpleStore } from '@/lib/store'

export const { StoreProvider, useStore } = createSimpleStore({
  count: 0,
  theme: 'dark',
})
```

---

## Supabase Clients

### Client-Side (`lib/supabase/client.ts`)

For use in `'use client'` components:

```typescript
import { supabase } from '@/lib/supabase/client'

async function getProfiles() {
  const { data, error } = await supabase.from('profiles').select('*')
  return { data, error }
}
```

### Server-Side (`lib/supabase/server.ts`)

For use in API routes. Disables auto-refresh and session persistence:

```typescript
import { supabaseServer } from '@/lib/supabase/server'

async function getProfilesServer() {
  const { data, error } = await supabaseServer.from('profiles').select('*')
  return { data, error }
}
```

### Admin Client (`lib/supabase/admin.ts`)

Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. For server-side operations that need full access (e.g., analytics aggregation):

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAnalytics() {
  const { data } = await supabaseAdmin.from('analytics_events').select('*')
  return data
}
```

---

## AI Client (`lib/ai/client.ts`)

Server-side wrapper around the Google Gemini SDK (`@google/genai`). Exports `Type`, `Schema`, `generateText`, `generateStructured`, `analyzeImage`, `transcribeAudio`, `fileToBase64`, and `DEFAULT_MODEL`.

```typescript
import {
  createAIClient,
  generateText,
  generateStructured,
  analyzeImage,
  transcribeAudio,
  fileToBase64,
  Type,
  type Schema,
  DEFAULT_MODEL,
} from '@/lib/ai/client'

// 1. One-shot text generation
async function askAI() {
  return await generateText('Explain React hooks', {
    systemInstruction: 'You are an expert tutor.',
  })
}

// 2. Structured JSON generation (Schema-validated, zero hallucinations)
interface EventVenue {
  name: string
  capacity: number
  hasWifi: boolean
}

async function getVenues(): Promise<EventVenue[]> {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        capacity: { type: Type.INTEGER },
        hasWifi: { type: Type.BOOLEAN },
      },
      required: ['name', 'capacity', 'hasWifi'],
    },
  }

  return await generateStructured<EventVenue[]>('Suggest 3 tech hubs in Tokyo', schema)
}

// 3. Multimodal Image Analysis / OCR
async function inspectPart(imageFile: File) {
  return await analyzeImage(imageFile, 'Identify if this mechanical component has visible surface defects.')
}

// 4. Audio Dictation Transcription (Multimodal Speech-to-Text)
async function transcribeMicAudio(audioBase64: string, mimeType: string, lang = 'en-US') {
  return await transcribeAudio(audioBase64, mimeType, { lang })
}
```
