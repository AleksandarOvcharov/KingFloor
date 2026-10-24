# Components Reference

This document describes `apps/web`'s components. Most of the shadcn/Radix component library (57 components) now lives in `packages/ui` (`@workspace/ui`) — import as `@workspace/ui/ui/<name>` or `@workspace/ui/shadcn/<name>`, not `@/components/ui/<name>`. The components below that are specific to `apps/web` itself (`Header`, `UserMenu`, `LanguageToggle`, `AccessibilityToggle`, `MapView`, the notification system) stayed in `apps/web/components/` and keep their original `@/components/...` import paths — only `CodeBlock` and the loading-indicator suite moved into `packages/ui`, since they're part of the generic component library, not app-specific widgets.

**This doc is web-only.** `apps/mobile` has its own small native component library (`apps/mobile/components/ui/`) with different code but matching component/variant names — see [`docs/mobile.md`](./mobile.md#component-library-componentsui).

---

## Navigation & Layout Components

### Header (`components/header.tsx`)

The sticky, responsive top navigation bar with blur effect, user profile indicator, theme toggle, and mobile dropdown drawer.

```tsx
import { Header } from '@/components/header'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

#### Key Capabilities:
- **Responsive Layout**: Switches seamlessly between desktop inline navigation (`>= 768px`) and mobile slide-down drawer overlay (`< 768px`).
- **Body Scroll Locking**: Prevents background page scrolling while the mobile navigation drawer is active.
- **Accessible HTML5 Links**: Uses `buttonVariants(...)` directly on Next.js `<Link>` elements, eliminating invalid nested `<button>` tags and preserving keyboard navigation.
- **User Authentication Sync**: Automatically displays user avatar, email/username, and quick-access dropdown or drawer actions when logged in.

---

### UserMenu (`components/user-menu.tsx`)

Responsive user dropdown menu displaying profile avatar, username, email, dashboard shortcut, settings, and logout actions.

```tsx
import { UserMenu } from '@/components/user-menu'

export function Navigation() {
  return <UserMenu hideWhenLoggedOut={false} />
}
```

---

### LanguageToggle (`components/language-toggle.tsx`)

BG/EN language dropdown. The trigger shows the active flag + language code; the open menu lists both locales as flag + native name, with a checkmark on the active one. Lives in the desktop header and the Settings page's Preferences tab.

```tsx
import { LanguageToggle } from '@/components/language-toggle'

export function Toolbar() {
  return <LanguageToggle />
}
```

---

### AccessibilityToggle (`components/accessibility-toggle.tsx`)

Icon-button toggle for colorblind-friendly mode, backed by `useAccessibility()`. Uses lucide's `Glasses` icon — color-vision correction/assistance is a clearer metaphor than a generic accessibility symbol.

```tsx
import { AccessibilityToggle } from '@/components/accessibility-toggle'

export function Toolbar() {
  return <AccessibilityToggle />
}
```

See [`docs/i18n-and-accessibility.md`](./i18n-and-accessibility.md) for what colorblind mode actually changes (the `--success`/`--destructive` color remap and border-contrast strengthening) and the hydration-safety reasoning behind how both of these toggles read their persisted state.

---

## Custom Components & Features

### MapView (`components/map/`)

Free OpenStreetMap Leaflet component with custom developer-configurable pins, GPS "My Location" geolocation, Nominatim reverse geocoding on click, dynamic search, category chips, pulsing halo animations, layer switcher, full-screen view, and an embedded internal pin info text box. Read-only for end-users and effortlessly configured via code props — 100% self-contained when embedded.

```tsx
import { MapView, type MapPin } from '@/components/map'

const pins: MapPin[] = [
  {
    id: 'hq',
    lat: 37.7749,
    lng: -122.4194,
    title: 'Hackathon Main Stage',
    description: 'Keynotes, hacking arena, and demo presentations.',
    category: 'Arena',
    color: '#6366f1',
    icon: '⚡',
    badge: 'Main Hall',
    metadata: { capacity: '800 hackers', wifi: 'Gigabit 6E' },
    link: 'https://maps.google.com/?q=37.7749,-122.4194',
  },
]

export function EventMap() {
  return (
    <MapView
      center={[37.7749, -122.4194]}
      zoom={14}
      pins={pins}
      tileProvider="osm"
      height="480px"
      showSearch={true}
      showCategoryFilter={true}
      showPinInfoBox={true}
      showPinCards={true}
      showLayerSelector={true}
      showUserLocationButton={true}
      enableClickToLookup={true}
      allowFullscreen={true}
      onMapClick={(e) => console.log('Clicked address:', e.address?.displayName)}
      onLocationFound={(loc) => console.log('User GPS at:', loc.lat, loc.lng)}
    />
  )
}
```

#### MapProps

| Prop | Type | Default | Description |
|---|---|---|---|
| `pins` | `MapPin[]` | `[]` | Array of configurable pins |
| `center` | `[number, number]` | Auto | Initial `[lat, lng]` center coordinates |
| `zoom` | `number` | `13` | Initial map zoom level |
| `tileProvider` | `'osm' \| 'hot' \| 'osm-de' \| 'carto-light' \| 'carto-dark'` | `'osm'` | 100% free OSM tile source (zero API keys needed) |
| `height` | `string \| number` | `'480px'` | Height of the map container |
| `showPinInfoBox` | `boolean` | `true` | Show floating inside-the-map text box upon pin click |
| `showPinCards` | `boolean` | `true` | Toggle bottom cards list |
| `showSearch` | `boolean` | `true` | Search input filter in toolbar |
| `showCategoryFilter`| `boolean` | `true` | Category pill chips in toolbar |
| `showLayerSelector` | `boolean` | `true` | Tile layer switcher dropdown |
| `showUserLocationButton` | `boolean` | `true` | GPS "My Location" button using `navigator.geolocation` |
| `enableClickToLookup` | `boolean` | `true` | Reverse-geocodes clicked locations via Nominatim API |
| `lookupLang` | `string` | browser | Preferred language for reverse geocoded addresses |
| `allowFullscreen` | `boolean` | `true` | Fullscreen toggle button |
| `onPinClick` | `(pin: MapPin) => void` | — | Callback when a pin is clicked |
| `onMapClick` | `(coords: { lat, lng, address }) => void` | — | Callback when map is clicked |
| `onLocationFound` | `(loc: { lat, lng, address }) => void` | — | Callback when GPS location is acquired |

---

### CodeBlock (`packages/ui/src/shadcn/code-block.tsx`)

Multi-tabbed, mobile-optimized syntax highlighted code snippet container with file tabs, language icons, line numbers, diff annotations, and copy button.

```tsx
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockFiles,
  CodeBlockFileTab,
  CodeBlockCopyButton,
  CodeBlockBody,
  CodeBlockItem,
  CodeBlockContent,
} from '@workspace/ui/shadcn/code-block'

const files = [
  {
    filename: 'auth.ts',
    language: 'typescript',
    code: `export function auth() {\n  return true // [!code highlight]\n}`,
  },
  {
    filename: 'styles.css',
    language: 'css',
    code: `.btn { color: red; } /* [!code ++] */`,
  },
]

export function CodeViewer() {
  return (
    <CodeBlock data={files} defaultValue="auth.ts">
      <CodeBlockHeader trafficLights={true}>
        <CodeBlockFiles>
          {(item) => (
            <CodeBlockFileTab key={item.filename} value={item.filename}>
              {item.filename}
            </CodeBlockFileTab>
          )}
        </CodeBlockFiles>
        <CodeBlockCopyButton />
      </CodeBlockHeader>
      <CodeBlockBody maxHeight={300}>
        {files.map((file) => (
          <CodeBlockItem key={file.filename} value={file.filename} lineNumbers={true}>
            <CodeBlockContent language={file.language}>{file.code}</CodeBlockContent>
          </CodeBlockItem>
        ))}
      </CodeBlockBody>
    </CodeBlock>
  )
}
```

---

### Notification System (`components/notification/`)

Floating popup notifications supporting 4 corners (`top-left`, `top-right`, `bottom-left`, `bottom-right`) with swipe gestures and stack scrolling.

```tsx
import { useNotification, notify } from '@/components/notification'

export function ExampleNotifier() {
  const { showNotification } = useNotification()

  const handleNotify = () => {
    showNotification({
      title: 'New Achievement Unlocked',
      description: 'You built an AI startup in 24 hours!',
      position: 'top-right',
      avatar: '/avatars/trophy.png',
      actionLabel: 'View Badge',
      onAction: () => console.log('Badge opened'),
    })

    // Or globally anywhere without hooks:
    notify.success('Project deployed successfully!')
  }

  return <button onClick={handleNotify}>Notify</button>
}
```

---

### Loading Indicators & Screen (`packages/ui/src/ui/global-loading.tsx`, `apps/web/app/loading.tsx`)

A unified suite of loading state components with smooth CSS rotating animations and backdrop blur.

```tsx
import {
  LoadingScreen,
  LoadingSpinner,
  TopLoader,
  OverlayLoader,
  InlineLoader,
} from '@workspace/ui/ui/global-loading'
```

#### 1. `LoadingScreen`
Full-area centered loading screen with rotating spinner and pulsing label (used in Next.js `app/loading.tsx` and auth guards):
```tsx
import { LoadingScreen } from '@workspace/ui/ui/global-loading'

export function PageLoader({ loading }: { loading: boolean }) {
  if (loading) {
    return <LoadingScreen message="Checking authentication..." spinnerSize={36} />
  }
  return <div>Content</div>
}
```

#### 2. `TopLoader`
Slim animated bar at the top of the viewport for background requests:
```tsx
import { TopLoader } from '@workspace/ui/ui/global-loading'

export function SyncStatus({ isSyncing }: { isSyncing: boolean }) {
  return <TopLoader loading={isSyncing} />
}
```

#### 3. `OverlayLoader`
Modal-level blocking backdrop spinner with custom message:
```tsx
import { OverlayLoader } from '@workspace/ui/ui/global-loading'

export function SaveState({ isSaving }: { isSaving: boolean }) {
  return <OverlayLoader loading={isSaving} message="Saving changes..." />
}
```

#### 4. `InlineLoader`
Small button spinner:
```tsx
import { Button } from '@workspace/ui/ui/button'
import { InlineLoader } from '@workspace/ui/ui/global-loading'

export function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <Button disabled={loading}>
      <InlineLoader loading={loading} className="mr-2" />
      {loading ? 'Saving...' : 'Save'}
    </Button>
  )
}
```

---

### Geocoding Utility Functions (`lib/geo/geocoding.ts` or `@/components/map`)

```typescript
import {
  reverseGeocode,
  forwardGeocode,
  formatConciseAddress,
  getMajorLocation,
  formatMajorLocationTitle,
  getOceanOrWaterbody,
  formatCoordinates,
} from '@/components/map'

async function lookupExample() {
  // 1. Reverse geocode lat/lng to structured address (100% free Nominatim proxy)
  const place = await reverseGeocode(42.6977, 23.3219, { lang: 'en' })

  // 2. Extract closest major big object (City, County, State, Country, Ocean/Sea)
  console.log(getMajorLocation(place)) // "Sofia"
  console.log(formatMajorLocationTitle(place)) // "Sofia, Bulgaria"
  console.log(formatCoordinates(42.6977, 23.3219)) // "42.69770, 23.32190"
  console.log(formatConciseAddress(place)) // "Vitosha Blvd, Sofia, Bulgaria"

  // 3. Approximate ocean/waterbody from coordinates
  console.log(getOceanOrWaterbody(37.7, -140.0)) // "North Pacific Ocean"

  // 4. Forward search (place name or address -> coordinates)
  const results = await forwardGeocode('San Francisco Ferry Building', { limit: 1 })
  console.log(results)
}
```
