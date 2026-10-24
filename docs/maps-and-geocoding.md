# Maps & Geocoding Architecture

A 100% free, zero-API-key mapping and geocoding engine powered by Leaflet, OpenStreetMap, and OpenStreetMap Nominatim with server-side caching proxies, in `apps/web`. All paths below are relative to `apps/web/`. For how `apps/mobile` reuses this (it doesn't reimplement it), see §5 at the end.

---

## Key Capabilities

- **Zero API Key Requirement**: Runs completely free with OpenStreetMap vector/raster tile providers and server-side Nominatim proxy routes (`/api/geo/reverse`, `/api/geo/search`).
- **Instant Optimistic Pin Drop**: Dropping pins on click provides instant `0ms` UI feedback with automatic waterbody detection (`getOceanOrWaterbody`) while reverse-geocoding enriches details asynchronously in the background.
- **Location Hierarchy Formatting**: Prominently displays the most relevant geographic level (`City -> Town -> Municipality -> Village -> County -> State -> Country -> Ocean / Sea`) followed by coordinates and address.
- **GPS "My Location" Geolocation**: Uses the browser's `navigator.geolocation` API with high-accuracy coordinate acquisition, map fly-to animation, and radar halo indicator.
- **In-Memory LRU & Coordinate Cache**: Automatically caches repeated coordinates and forward search queries to adhere strictly to Nominatim rate limits.
- **Dynamic Tile Switcher**: Supports OSM Standard, Humanitarian, OpenTopoMap, CartoDB Light (Positron), and CartoDB Dark (Dark Matter).

---

## 1. MapView Component (`components/map/`)

The `<MapView />` component is SSR-safe and dynamically imported to avoid Leaflet browser-only `window` errors during Next.js server-side rendering.

```tsx
import { MapView, type MapPin } from '@/components/map'

const pins: MapPin[] = [
  {
    id: 'venue-main',
    lat: 42.6977,
    lng: 23.3219,
    title: 'Hackathon Innovation Hub',
    description: 'Main keynote hall, hacking zones, and mentor lounges.',
    category: 'Arena',
    color: '#6366f1',
    icon: '⚡',
    badge: 'Main Hall',
    metadata: {
      capacity: '500 participants',
      wifi: 'Gigabit 6E',
      floors: '2 & 3',
    },
    link: 'https://maps.google.com/?q=42.6977,23.3219',
  },
]

export function VenueMap() {
  return (
    <MapView
      center={[42.6977, 23.3219]}
      zoom={14}
      pins={pins}
      tileProvider="osm"
      height="500px"
      showSearch={true}
      showCategoryFilter={true}
      showPinInfoBox={true}
      showPinCards={true}
      showLayerSelector={true}
      showUserLocationButton={true}
      enableClickToLookup={true}
      allowFullscreen={true}
      onPinClick={(pin) => console.log('Selected pin:', pin.title)}
      onMapClick={(e) => console.log('Reverse geocoded:', e.address?.displayName)}
      onLocationFound={(loc) => console.log('GPS located at:', loc.lat, loc.lng)}
    />
  )
}
```

### MapView Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pins` | `MapPin[]` | `[]` | Array of pin objects displayed on the map |
| `center` | `[number, number]` | `[37.7749, -122.4194]` | Initial center coordinates |
| `zoom` | `number` | `13` | Initial zoom level (1–19) |
| `tileProvider` | `'osm' \| 'hot' \| 'osm-de' \| 'carto-light' \| 'carto-dark'` | `'osm'` | Free tile provider preset |
| `height` | `string \| number` | `'480px'` | Map container CSS height |
| `showPinInfoBox` | `boolean` | `true` | Inside-the-map floating card for clicked pin details |
| `showPinCards` | `boolean` | `true` | Bottom scrollable card carousel |
| `showSearch` | `boolean` | `true` | Dynamic location search bar in header |
| `showCategoryFilter` | `boolean` | `true` | Filter pins by category pill chips |
| `showLayerSelector` | `boolean` | `true` | Tile provider switcher dropdown |
| `showUserLocationButton` | `boolean` | `true` | GPS "My Location" button (🎯) |
| `enableClickToLookup` | `boolean` | `true` | Click anywhere to reverse-geocode coordinates |
| `lookupLang` | `string` | browser default | Language code for reverse geocoding results |
| `allowFullscreen` | `boolean` | `true` | Fullscreen toggle button |
| `onPinClick` | `(pin: MapPin) => void` | — | Fired when a pin marker is clicked |
| `onMapClick` | `(coords: { lat, lng, address }) => void` | — | Fired when clicking the map |
| `onLocationFound` | `(loc: { lat, lng, address }) => void` | — | Fired when GPS position is acquired |

---

## 2. Geocoding Utility Functions (`lib/geo/geocoding.ts`)

```typescript
import {
  reverseGeocode,
  forwardGeocode,
  formatConciseAddress,
  getMajorLocation,
  formatMajorLocationTitle,
  getOceanOrWaterbody,
  formatCoordinates,
} from '@/lib/geo/geocoding'

// 1. Reverse Geocode Coordinates -> Address
const location = await reverseGeocode(42.6977, 23.3219, { lang: 'en', zoom: 18 })
console.log(location.displayName)
// "Sofia, Sofia-City, Bulgaria"

// 2. Extract Primary Major Geographic Name
console.log(getMajorLocation(location))
// "Sofia"

// 3. Format Combined Major Location Badge
console.log(formatMajorLocationTitle(location))
// "Sofia, Bulgaria"

// 4. Concise Address (Street + City)
console.log(formatConciseAddress(location))
// "Vitosha Blvd, Sofia, Bulgaria"

// 5. Waterbody Detection for Ocean / Offshore Coordinates
console.log(getOceanOrWaterbody(37.7, -140.0))
// "North Pacific Ocean"

// 6. Forward Geocode Search Query -> Coordinates
const results = await forwardGeocode('Berlin Central Station', { limit: 1 })
if (results[0]) {
  console.log(`Lat: ${results[0].lat}, Lng: ${results[0].lng}`)
}
```

---

## 3. Server-Side Geocoding API Proxies

To prevent CORS issues, protect client IP addresses, and respect Nominatim's usage policy (including Custom User-Agent requirements), all geocoding calls route through Next.js API route handlers:

- **`GET /api/geo/reverse?lat=...&lng=...&lang=en`**:
  - Validates and rounds coordinates to prevent redundant duplicate queries.
  - Checks the in-memory LRU cache before making upstream requests.
  - Adds necessary headers (`User-Agent: HackathonStartup/3.9`) and handles graceful fallbacks.
- **`GET /api/geo/search?q=...&limit=5&lang=en`**:
  - Trims and normalizes query strings with response caching.

---

## 4. GPS Geolocation Hook (`hooks/useGeolocation.ts`)

```tsx
'use client'

import { useGeolocation } from '@/hooks/useGeolocation'

export function LocationTracker() {
  const {
    coordinates,
    address,
    accuracy,
    loading,
    error,
    isSupported,
    getCurrentLocation,
  } = useGeolocation({
    enableHighAccuracy: true,
    autoLocate: false,
    reverseGeocode: true,
  })

  if (!isSupported) {
    return <p>Geolocation is not supported by your browser.</p>
  }

  return (
    <div>
      <button onClick={getCurrentLocation} disabled={loading}>
        {loading ? 'Locating...' : 'Get My Location'}
      </button>

      {coordinates && (
        <div>
          <p>Latitude: {coordinates.lat.toFixed(5)}</p>
          <p>Longitude: {coordinates.lng.toFixed(5)}</p>
          <p>Accuracy: ±{Math.round(accuracy ?? 0)} meters</p>
          {address && <p>Address: {address.displayName}</p>}
        </div>
      )}

      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  )
}
```

---

## 5. How `apps/mobile` uses this (without reimplementing it)

There's no `react-native-maps` here and no second Leaflet integration. `apps/mobile/app/(tabs)/map.tsx` is a `react-native-webview` `WebView` pointed at a new chrome-free Next.js route, `apps/web/app/embed/map/page.tsx`, which renders the exact `<MapView/>` component documented above, full-screen, with no `<Header/>` and no auth requirement (the map has no user data to protect). This is deliberate: `react-native-maps` needs a custom dev client (`expo prebuild`), which this project's Expo-Go-pinned mobile workflow doesn't use, and reimplementing Leaflet natively would mean maintaining two independent map engines in parallel forever. A `WebView` is an actual browser, so it's the one way to run the *real* component on a phone.

The non-obvious part is keeping the embedded page's dark mode in sync with the native app's theme — the `WebView` is a separate browser context with its own fresh `localStorage`, so it has no way to know what theme `apps/mobile` is in. `map.tsx` passes `?theme=dark|light` in the embed URL and remounts the `WebView` when it changes; `embed/map/page.tsx` reads that server-side and applies the `.dark` class to `<html>` (not a wrapper `<div>` — see `docs/mobile.md` for why that distinction matters with Tailwind v4's `--color-background` token). Full writeup: [`docs/mobile.md`](./mobile.md#map-tab--the-webview-embed-pattern).

GPS "My Location" inside the `WebView` is a known partial gap: Android won't surface the permission prompt without also wiring `onGeolocationPermissionsShowPrompt` + a location permission on the native side, so it currently degrades to the same "denied" state this doc's `useGeolocation()` already handles gracefully. Search and click-to-reverse-geocode are unaffected — they don't need GPS.
