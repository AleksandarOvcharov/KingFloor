# Custom React Hooks

This document covers `apps/web`'s custom React hooks — their APIs, parameters, return values, and usage examples. All paths below are relative to `apps/web/`. For `apps/mobile`'s hooks (which port several of these web hooks' *logic* to call the same backend, not reimplement it), see [Mobile Hooks](#mobile-hooks) at the end, or the fuller writeup in [`docs/mobile.md`](./mobile.md).

---

## Table of Contents

- [useAuth](#useauth)
- [useProfile](#useprofile)
- [useSpeechToText](#usespeechtotext)
- [useGeolocation](#usegeolocation)
- [useAI](#useai)
- [useChatHistory](#usechathistory)
- [useAnalytics](#useanalytics)
- [useFileUpload](#usefileupload)
- [useNotification](#usenotification)
- [useToast](#usetoast)
- [useSmoothScroll](#usesmoothscroll)
- [useModal](#usemodal)
- [useSearch](#usesearch)
- [useFormValidation](#useformvalidation)
- [useMediaQuery & Breakpoint Hooks](#usemediaquery--breakpoint-hooks)
- [useTheme](#usetheme)
- [useAccessibility](#useaccessibility)
- [useI18n](#usei18n)
- [Mobile Hooks](#mobile-hooks)

---

## useAuth

Located in `hooks/useAuth.ts`

Manages user authentication state and methods with Supabase. Automatically trims and lowercases email credentials, listens for token refresh events, and manages SSR auth cookies safely.

### Return Values

```typescript
type UseAuthReturn = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null; data?: any }>;
  signup: (email: string, password: string) => Promise<{ error: Error | null; data?: any }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithGitHub: () => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}
```

### Usage Example

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'

export function UserNav() {
  const { user, loading, logout } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <a href="/login">Sign In</a>

  return (
    <div>
      <span>{user.email}</span>
      <button onClick={logout}>Sign Out</button>
    </div>
  )
}
```

---

## useProfile

Located in `hooks/useProfile.ts`

Loads and updates the extended profile for a user from the `profiles` table. Provides client caching with localStorage, SSR-safe mounting, and helper functions for updating profile information.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | `User \| null` | Yes | The Supabase user object from `useAuth()` |

### Return Values

```typescript
type UseProfileReturn = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  updateBio: (bio: string) => Promise<{ success: boolean; error?: string }>;
  updateExtended: (fields: {
    display_name?: string | null;
    location?: string | null;
    website?: string | null;
    twitter_handle?: string | null;
    github_handle?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  updateVisibility: (isPublic: boolean) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}
```

---

## useSpeechToText

Located in `hooks/useSpeechToText.ts`

Universal Real-Time Speech-to-Text hook supporting **100% of browsers**:
- **Chrome / Edge / Safari**: Uses instant browser-native Web Speech API (`webkitSpeechRecognition`) with sub-second real-time typing.
- **Firefox / Opera / Mobile**: Automatically falls back to mic capture via `MediaRecorder` and transcribes using Gemini Multimodal Audio (`POST /api/ai/transcribe`).
- **Security & Hardware Safety**: Verifies `isSecureContext` (HTTPS / localhost), cleanly releases microphone tracks upon stop to prevent hardware memory leaks, and handles browser permission denials gracefully.

### Parameters

```typescript
interface UseSpeechToTextOptions {
  /** Language code (BCP 47 tag), e.g. 'en-US', 'bg-BG', 'es-ES', 'de-DE'. Default: auto-detect from navigator.language or 'en-US' */
  lang?: string
  /** Whether to continuously listen without stopping after pauses. Default: true */
  continuous?: boolean
  /** Whether to emit interim (in-progress) partial transcripts. Default: true */
  interimResults?: boolean
  /** Callback fired when speech is transcribed in real-time. */
  onTranscript?: (sessionTranscript: string, isFinal: boolean) => void
  /** Callback fired when an error occurs */
  onError?: (error: string) => void
  /** Preferred engine mode: 'auto' | 'web-speech' | 'gemini' */
  mode?: 'auto' | 'web-speech' | 'gemini'
}
```

### Return Values

```typescript
interface UseSpeechToTextReturn {
  isListening: boolean
  isTranscribing: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  engine: 'web-speech' | 'media-recorder' | null
  startListening: (options?: { lang?: string }) => Promise<void>
  stopListening: () => void
  toggleListening: (options?: { lang?: string }) => void
  resetTranscript: () => void
  error: string | null
}
```

---

## useGeolocation

Located in `hooks/useGeolocation.ts`

Requests the user's browser GPS coordinates and auto-reverse-geocodes them into a structured street address and city via OpenStreetMap Nominatim.

### Parameters

```typescript
interface UseGeolocationOptions {
  enableHighAccuracy?: boolean // default: true
  timeout?: number            // default: 10000ms
  maximumAge?: number         // default: 60000ms
  autoLocate?: boolean        // default: false
  reverseGeocode?: boolean    // default: true
  lang?: string               // default: browser locale or 'en'
  onSuccess?: (coords: { lat: number; lng: number; accuracy: number; address: ReverseGeocodeResult | null }) => void
  onError?: (error: string) => void
}
```

### Return Values

```typescript
interface UseGeolocationReturn {
  coordinates: { lat: number; lng: number } | null
  address: ReverseGeocodeResult | null
  accuracy: number | null
  loading: boolean
  error: string | null
  isSupported: boolean
  getCurrentLocation: () => Promise<{ lat: number; lng: number; accuracy: number; address: ReverseGeocodeResult | null } | null>
  clear: () => void
}
```

### Usage Example

```tsx
'use client'

import { useGeolocation } from '@/hooks/useGeolocation'
import { Button } from '@workspace/ui/ui/button'

export function LocationWidget() {
  const { coordinates, address, loading, getCurrentLocation } = useGeolocation()

  return (
    <div>
      <Button onClick={() => getCurrentLocation()} disabled={loading}>
        {loading ? 'Locating...' : 'Find My Location'}
      </Button>
      {coordinates && (
        <p>GPS: {coordinates.lat}, {coordinates.lng}</p>
      )}
      {address && (
        <p>Address: {address.displayName}</p>
      )}
    </div>
  )
}
```

---

## useAI

Located in `hooks/useAI.ts`

Manages AI chat state, one-shot text generation, strictly typed structured JSON schemas, multimodal vision / OCR with Google Gemini (`gemini-3.6-flash`), and generation abort controls.

### Return Values

```typescript
interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
  imageUrl?: string
}

type UseAIReturn = {
  generateText: (prompt: string) => Promise<string>;
  generateStructured: <T = unknown>(prompt: string, schema: Schema) => Promise<T>;
  analyzeImage: <T = string>(image: File | Blob | string, prompt: string, schema?: Schema) => Promise<T>;
  sendMessage: (message: string, options?: { imageUrl?: string }) => Promise<string>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  clearChat: () => void;
  stop: () => void;
  loading: boolean;
  error: string | null;
}
```

### Vision / OCR Example

```tsx
const { analyzeImage, loading } = useAI()

// Direct File or Base64 image analysis with strict schema
const receipt = await analyzeImage<ReceiptData>(
  file,
  'Extract vendor, total, and purchased items',
  receiptSchema
)
```

---

## useChatHistory

Located in `hooks/useChatHistory.ts`

Per-user chat conversation persistence via Supabase with full multimodal image persistence across sessions.

### Return Values

```typescript
interface UseChatHistoryReturn {
  conversations: Conversation[]
  activeConversationId: string | null
  loading: boolean
  error: string | null
  createConversation: (title?: string) => Promise<string>
  selectConversation: (id: string) => Promise<ChatMessage[]>
  deleteConversation: (id: string) => Promise<void>
  saveMessage: (role: 'user' | 'model', content: string, conversationId?: string) => Promise<void>
  refreshConversations: () => Promise<void>
}
```

---

## useAnalytics

Located in `hooks/useAnalytics.ts`

Hook for analytics event tracking and dashboard statistics with Supabase aggregation.

### Return Values

```typescript
interface UseAnalyticsReturn {
  stats: DashboardStats | null
  trackEvent: (eventType: string, eventData?: Record<string, unknown>) => Promise<void>
  refreshStats: () => Promise<void>
  loading: boolean
}
```

---

## useFileUpload

Located in `hooks/useFileUpload.ts`

Hook for file selection, validation presets (`avatar`, `image`, `document`, `any`), progress tracking, and uploading directly to Supabase Storage.

### Parameters

```typescript
interface UseFileUploadOptions {
  validation: FilePreset | FileValidationRule
  onUploadComplete?: (result: UploadResult) => void
  onError?: (error: string) => void
}
```

### Return Values

```typescript
interface UseFileUploadReturn {
  file: File | null
  preview: string | null
  uploading: boolean
  progress: number
  error: string | null
  selectFile: (file: File) => boolean
  clearFile: () => void
  upload: (options: UploadOptions) => Promise<UploadResult>
}
```

---

## useNotification

Located in `hooks/useNotification.ts`

Provides access to the application notification center context.

### Return Values

```typescript
interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  clearAll: () => void
}
```

---

## useToast

Located in `hooks/useToast.ts`

Hook for triggering global toast feedback notifications.

### Return Values

```typescript
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}
```

---

## useSmoothScroll

Located in `hooks/useSmoothScroll.ts`

Provides programmatic access to the Lenis smooth scroll instance.

### Return Values

```typescript
interface SmoothScrollContextType {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean; duration?: number }) => void
}
```

---

## useModal

Located in `hooks/useModal.ts`

Lightweight state hook for managing modal open/close lifecycle and associated payload data.

### Return Values

```typescript
interface UseModalReturn {
  isOpen: boolean
  open: (data?: unknown) => void
  close: () => void
  toggle: () => void
  data: unknown
}
```

---

## useSearch

Located in `hooks/useSearch.ts`

Client-side multi-field filtering and dynamic multi-type sorting (alphabetical, numeric, date) for arrays.

### Usage Example

```tsx
const { query, setQuery, filtered, sort, setSort } = useSearch(items, {
  keys: ['title', 'category', 'description'],
  sort: { key: 'created_at', direction: 'desc', type: 'date' },
})
```

---

## useFormValidation

Located in `hooks/useFormValidation.ts`

Lightweight form state and validation helper with per-field touch tracking.

### Usage Example

```tsx
const form = useFormValidation({
  email: { required: true, label: 'Email', validate: (v) => !v.includes('@') ? 'Invalid email' : undefined },
  password: { required: true, label: 'Password', validate: (v) => v.length < 6 ? 'Too short' : undefined },
})
```

---

## useMediaQuery & Breakpoint Hooks

Located in `hooks/useMediaQuery.ts`

Hooks for CSS media queries and responsive Tailwind breakpoint detection.

### Exported Functions

```typescript
declare function useMediaQuery(query: string): boolean
declare function useIsMobile(): boolean     // matches < 768px
declare function useIsTablet(): boolean     // matches 768px - 1023px
declare function useIsDesktop(): boolean    // matches >= 1024px
declare function useBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' | '2xl'
declare function usePrefersReducedMotion(): boolean
```

---

## useTheme

Located in `hooks/useTheme.ts`

Hook for toggling and querying light, dark, or system theme mode with automatic `localStorage` synchronization and hydration safety.

### Return Values

```typescript
interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}
```

---

## useAccessibility

Located in `hooks/useAccessibility.ts`

Toggles colorblind-friendly mode: adds/removes a `.colorblind` class on `<html>`, persisted to `localStorage`. `app/globals.css` defines what that class changes — `--success`/`--destructive` remap from the default red/green to a colorblind-safe blue/amber pairing, and `--border`/`--input` darken to clear the WCAG 1.4.11 non-text contrast minimum.

Has no SSR source (unlike locale — see `useI18n` below), so it intentionally starts at the server-matched default (`false`) and syncs from `localStorage` in a `useEffect` after mount, rather than reading it synchronously in the initial state. That avoids a hydration mismatch at the cost of one frame of visual flash for the toggle itself — see [`docs/i18n-and-accessibility.md`](./i18n-and-accessibility.md) for why.

### Return Values

```typescript
interface UseAccessibilityReturn {
  colorblindMode: boolean
  setColorblindMode: (enabled: boolean) => void
  toggleColorblindMode: () => void
}
```

### Usage Example

```tsx
'use client'

import {useAccessibility} from '@/hooks/useAccessibility'

export function AccessibilityToggle() {
  const {colorblindMode, toggleColorblindMode} = useAccessibility()
  return <button onClick={toggleColorblindMode} aria-pressed={colorblindMode}>Colorblind mode</button>
}
```

**If you add a new success/error color anywhere**, use the `text-success` / `text-destructive` (etc.) Tailwind tokens instead of hardcoding `emerald-500` / `red-500` — otherwise this mode silently won't affect it.

---

## useI18n

Located in `lib/i18n/provider.tsx` (not `hooks/`, since it's a React Context provider + consumer pair, not a standalone hook — but it's used exactly like one).

Returns the active translated strings and lets you switch between BG and EN. Full guide, including why the locale is stored in a cookie rather than just `localStorage`: [`docs/i18n-and-accessibility.md`](./i18n-and-accessibility.md).

### Return Values

```typescript
interface I18nContextValue {
  locale: 'en' | 'bg'
  setLocale: (locale: 'en' | 'bg') => void
  t: Dictionary // nested object of translated strings for the active locale
}
```

### Usage Example

```tsx
'use client'

import {useI18n, tFormat} from '@/lib/i18n/provider'

export function WelcomeBanner({username}: {username: string}) {
  const {t, locale, setLocale} = useI18n()
  return (
    <>
      <p>{tFormat(t.home.welcomeBack, {name: username})}</p>
      <button onClick={() => setLocale(locale === 'en' ? 'bg' : 'en')}>
        {t.accessibility.language}
      </button>
    </>
  )
}
```

---

## Mobile Hooks

`apps/mobile/hooks/` — a much smaller set, by design: mobile ports the *logic* of specific web hooks (same API calls, same data shapes) rather than mirroring every web hook 1:1. Full detail in [`docs/mobile.md`](./mobile.md); summary:

| Hook | Ports the logic of | Key difference |
|---|---|---|
| `useSession()` | — (no web equivalent; mobile's native-session analogue of `useAuth()`'s session piece) | Native Supabase client, `onAuthStateChange`-synced |
| `useProfile(session)` | `apps/web/hooks/useProfile.ts` | Same `/api/profile` PUT shape, minus `uploadAvatar` (needs `expo-image-picker`, not yet added) |
| `useDashboardStats()` | `apps/web/hooks/useAnalytics.ts` | Same `/api/analytics/stats` shape, fetched via `apiFetch()` instead of a relative `fetch()` |
| `useTheme()` | `apps/web/hooks/useTheme.ts` | A **context**, not a plain hook — lets the tab bar and every screen share one toggle. `AsyncStorage` instead of `localStorage` |
| `useI18n()` | `apps/web/lib/i18n/provider.tsx` | Same `@workspace/shared` dictionary, `AsyncStorage` instead of a cookie (no SSR to match) |

Hooks with no mobile port yet: `useSpeechToText`, `useChatHistory` (mobile's AI tab is stateless per-session, no persisted conversation list), `useFileUpload`, `useNotification`/`useToast` (mobile uses `Alert.alert` for the one case that needs it — account deletion confirmation), `useSmoothScroll`, `useModal`, `useSearch`, `useFormValidation`, `useMediaQuery`, `useAccessibility` (no colorblind mode on mobile).

**To add a new string**: open `lib/i18n/dictionaries.ts` and add `myKey: {en: '...', bg: '...'}` to the appropriate namespace — one line, both languages, TypeScript flags a missing one immediately.
