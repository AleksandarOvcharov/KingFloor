import {MapView} from '@/components/map'

// Standalone, chrome-free embed of the real web MapView for apps/mobile's
// Map tab (loaded inside a WebView — there's no DOM/Leaflet on React
// Native, so this reuses the actual component instead of a native
// reimplementation). No auth required: the map itself has no user data.
//
// Dark mode here is independent of the root layout's own theme script:
// that script only reads ITS OWN localStorage/matchMedia, which is scoped
// to whatever fresh browser context the WebView happens to create — it
// has no idea what theme the native app is in. So apps/mobile's Map tab
// passes its current theme explicitly as ?theme=dark|light.
//
// The `.dark` class has to land on <html> itself, not a wrapper div here:
// Tailwind's `--color-background: hsl(var(--background))` token (see
// globals.css's @theme block) resolves its var(--background) reference
// once, at whichever element inherits --color-background from — for every
// element that's :root, since nothing redeclares --color-background
// lower in the tree. Overriding --background on a descendant div doesn't
// retroactively change the already-inherited --color-background value.
// This script runs before the root layout's own themeScript's effect
// would otherwise paint — both are synchronous inline scripts, so there's
// no flash.
export default async function EmbedMapPage({
    searchParams,
}: {
    searchParams: Promise<{ theme?: string }>
}) {
    const {theme} = await searchParams
    const isDark = theme === 'dark'
    const script = isDark
        ? "document.documentElement.classList.add('dark')"
        : "document.documentElement.classList.remove('dark')"

    return (
        <>
            <script dangerouslySetInnerHTML={{__html: script}}/>
            <div style={{height: '100vh', width: '100vw', margin: 0}}>
                <MapView
                    height="100vh"
                    tileProvider="osm"
                    showSearch={true}
                    showCategoryFilter={false}
                    showPinInfoBox={true}
                    showPinCards={false}
                    showLayerSelector={true}
                    showUserLocationButton={true}
                    enableClickToLookup={true}
                />
            </div>
        </>
    )
}
