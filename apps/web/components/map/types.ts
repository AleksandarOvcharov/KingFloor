import type { ReverseGeocodeResult } from '@/lib/geo/geocoding'

export type MapTileProvider =
    | 'osm'
    | 'hot'
    | 'osm-de'
    | 'carto-light'
    | 'carto-dark'

export interface MapPin {
    /** Unique identifier for the pin */
    id?: string
    /** Latitude coordinate (e.g. 37.7749) */
    lat: number
    /** Longitude coordinate (e.g. -122.4194) */
    lng: number
    /** Display title for the pin */
    title: string
    /** Optional detailed description */
    description?: string
    /** Optional category or tag name (e.g. 'Office', 'Event', 'HQ', 'Hotel') */
    category?: string
    /** Custom hex color or theme preset (e.g. '#6366f1', '#10b981', 'primary') */
    color?: string
    /** Icon name or emoji displayed inside the pin marker */
    icon?: string
    /** Badge label shown above title in popups (e.g. 'Featured', 'Main Stage') */
    badge?: string
    /** Optional image URL displayed inside the popup card */
    image?: string
    /** Optional outbound link (string URL or detailed object) */
    link?: string | {
        url: string
        label?: string
        external?: boolean
    }
    /** Optional custom metadata for custom rendering */
    metadata?: Record<string, unknown>
}

export interface MapProps {
    /** Array of configurable pins. Read-only for end users. */
    pins?: MapPin[]
    /** Initial center coordinate `[latitude, longitude]` */
    center?: [number, number]
    /** Initial zoom level (default: 13, or auto-fit if multiple pins) */
    zoom?: number
    /** Minimum allowed zoom level (default: 2) */
    minZoom?: number
    /** Maximum allowed zoom level (default: 19) */
    maxZoom?: number
    /** Selected tile layer provider (default: 'osm' - 100% free OpenStreetMap, no API key required) */
    tileProvider?: MapTileProvider
    /** Automatically toggle tile theme based on document dark mode */
    autoTheme?: boolean
    /** Container height (e.g. '500px', '100%', 480) */
    height?: string | number
    /** Additional CSS classes for the outer wrapper */
    className?: string
    /** Enable interactive pan & zoom (default: true) */
    interactive?: boolean
    /** Enable scroll wheel zooming (default: true, with Lenis isolation) */
    scrollWheelZoom?: boolean
    /** Show zoom +/- controls (default: true) */
    showZoomControls?: boolean
    /** Show tile layer switcher dropdown/tabs (default: true) */
    showLayerSelector?: boolean
    /** Show search bar to filter and search pins (default: true) */
    showSearch?: boolean
    /** Show category filter chips (default: true) */
    showCategoryFilter?: boolean
    /** Show internal info text box inside the map when a pin is selected (default: true) */
    showPinInfoBox?: boolean
    /** Show bottom pin cards row with click-to-fly (default: true). Set to `false` to hide cards. */
    showPinCards?: boolean
    /** Alias for `showPinCards`. Show bottom pin cards list (default: true) */
    showPinList?: boolean
    /** Show reset view / fit bounds button (default: true) */
    showResetView?: boolean
    /** Allow toggle fullscreen (default: true) */
    allowFullscreen?: boolean
    /** Show "My Location" GPS locate button on map controls (default: true) */
    showUserLocationButton?: boolean
    /** Enable reverse-geocoding and info lookup on map click (default: false) */
    enableClickToLookup?: boolean
    /** Preferred language for reverse geocoded addresses (default: 'en' or browser locale) */
    lookupLang?: string
    /** Currently active / focused pin ID */
    selectedPinId?: string
    /** Callback fired when a pin is clicked */
    onPinClick?: (pin: MapPin) => void
    /** Callback fired when map is clicked (with optional reverse geocoded address) */
    onMapClick?: (coords: { lat: number; lng: number; address?: ReverseGeocodeResult }) => void
    /** Callback fired when user GPS location is found */
    onLocationFound?: (location: { lat: number; lng: number; address: ReverseGeocodeResult | null }) => void
}
