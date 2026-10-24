'use client'

import React, {useEffect, useRef, useState, useMemo, useCallback} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {cn} from '@/lib/utils'
import {MapPin, MapProps, MapTileProvider} from './types'
import {
    reverseGeocode,
    forwardGeocode,
    formatConciseAddress,
    getMajorLocation,
    formatMajorLocationTitle,
    getOceanOrWaterbody,
} from '@/lib/geo/geocoding'
import {Badge} from '@workspace/ui/ui/badge'
import {Input} from '@workspace/ui/ui/input'
import {
    Search,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw,
    Sparkles,
    X,
    ExternalLink,
    Navigation,
    Locate,
    Loader2,
} from 'lucide-react'

// Free OpenStreetMap & Community Tile Layer Definitions
const TILE_PROVIDERS: Record<
    MapTileProvider,
    {name: string; url: string; subdomains?: string; maxZoom: number; attribution: string}
> = {
    osm: {
        name: 'OpenStreetMap (Standard - 100% Free)',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    },
    hot: {
        name: 'OSM Humanitarian (Free)',
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        subdomains: 'abc',
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
    },
    'osm-de': {
        name: 'OSM Topo (Free)',
        url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
        subdomains: 'abc',
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    },
    'carto-light': {
        name: 'Carto Light (Free)',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
        maxZoom: 20,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    },
    'carto-dark': {
        name: 'Carto Dark (Night)',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
        maxZoom: 20,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    },
}

// Color presets for map pins
const COLOR_PRESETS: Record<string, string> = {
    primary: '#6366f1', // Indigo
    blue: '#3b82f6',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    orange: '#f97316',
}

function resolvePinColor(color?: string): string {
    if (!color) return COLOR_PRESETS.primary
    if (color in COLOR_PRESETS) return COLOR_PRESETS[color]
    return color
}

// Generate SVG marker HTML for Leaflet DivIcon
function createPinIconHtml(pin: MapPin, isSelected: boolean = false): string {
    const color = resolvePinColor(pin.color)
    const showCustomEmoji = pin.icon && pin.icon !== '📍'
    const iconContent = showCustomEmoji && pin.icon
        ? `<span class="map-pin-emoji">${escapeHtml(pin.icon)}</span>`
        : `<span class="map-pin-dot"></span>`
    const selectedClass = isSelected ? 'map-pin-selected' : ''

    return `
        <div class="custom-osm-pin ${selectedClass}" style="--pin-color: ${color};">
            <div class="pin-pulse"></div>
            <div class="pin-marker">
                <svg viewBox="0 0 32 42" class="pin-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
                    <circle cx="16" cy="15" r="10" fill="#ffffff" />
                </svg>
                <div class="pin-inner-content">
                    ${iconContent}
                </div>
            </div>
            ${pin.badge ? `<div class="pin-badge-label">${escapeHtml(pin.badge)}</div>` : ''}
        </div>
    `
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function isSafeUrl(url?: string): boolean {
    if (!url) return false
    try {
        const trimmed = url.trim()
        if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true
        const parsed = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed)
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
    } catch {
        return false
    }
}

// Generate rich popup HTML
function createPopupHtml(pin: MapPin): string {
    const color = resolvePinColor(pin.color)
    const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${pin.lat}%2C${pin.lng}`
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`
    const linkObj = typeof pin.link === 'string'
        ? { url: pin.link, label: 'Learn More', external: true }
        : pin.link ? { ...pin.link } : null
    const safeLinkUrl = linkObj?.url && isSafeUrl(linkObj.url) ? linkObj.url : null
    const safeImageUrl = pin.image && isSafeUrl(pin.image) ? pin.image : null

    return `
        <div class="osm-popup-card">
            ${safeImageUrl ? `
                <div class="osm-popup-img-wrap">
                    <img src="${escapeHtml(safeImageUrl)}" alt="${escapeHtml(pin.title)}" class="osm-popup-img" />
                </div>
            ` : ''}
            <div class="osm-popup-body">
                <div class="osm-popup-header">
                    ${pin.category ? `<span class="osm-popup-badge" style="color: ${color}; border-color: ${color};">${escapeHtml(pin.category)}</span>` : ''}
                    ${pin.badge ? `<span class="osm-popup-badge-secondary">${escapeHtml(pin.badge)}</span>` : ''}
                </div>
                <h4 class="osm-popup-title">${escapeHtml(pin.title)}</h4>
                <div class="osm-popup-meta">
                    <span class="osm-coords font-mono text-[11px]">${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}</span>
                </div>
                ${pin.description ? `<p class="osm-popup-desc">${escapeHtml(pin.description)}</p>` : ''}
                <div class="osm-popup-actions">
                    ${safeLinkUrl && linkObj ? `
                        <a href="${escapeHtml(safeLinkUrl)}" ${linkObj.external !== false ? 'target="_blank" rel="noopener noreferrer"' : ''} class="osm-popup-btn osm-popup-btn-primary" style="background-color: ${color};">
                            ${escapeHtml(linkObj.label || 'Learn More')}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                    ` : ''}
                    <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="osm-popup-btn osm-popup-btn-outline" title="Open directions on OpenStreetMap">
                        Directions
                    </a>
                    <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="osm-popup-btn osm-popup-btn-ghost" title="Open in Google Maps">
                        GMaps
                    </a>
                </div>
            </div>
        </div>
    `
}

export function MapView({
    pins = [],
    center,
    zoom = 13,
    minZoom = 2,
    maxZoom = 19,
    tileProvider: initialProvider,
    autoTheme = true,
    height = 480,
    className,
    interactive = true,
    scrollWheelZoom = true,
    showZoomControls = true,
    showLayerSelector = true,
    showSearch = true,
    showCategoryFilter = true,
    showPinInfoBox = true,
    showPinCards,
    showPinList = true,
    showResetView = true,
    allowFullscreen = true,
    showUserLocationButton = true,
    enableClickToLookup = true,
    lookupLang,
    selectedPinId,
    onPinClick,
    onMapClick,
    onLocationFound,
}: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const tileLayerRef = useRef<L.TileLayer | null>(null)
    const markersGroupRef = useRef<L.FeatureGroup | null>(null)
    const markersMapRef = useRef<Map<string, {marker: L.Marker; pin: MapPin}>>(new Map())
    const hasInitialBoundsFitRef = useRef(false)

    // Store previous coordinates to avoid re-triggering setView on every click or state update
    const centerLat = center ? center[0] : null
    const centerLng = center ? center[1] : null
    const prevCenterRef = useRef<[number, number] | null>(center ? [center[0], center[1]] : null)
    const prevZoomRef = useRef<number | undefined>(zoom)

    // Theme detection
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [activeProvider, setActiveProvider] = useState<MapTileProvider>(
        initialProvider || 'osm'
    )
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [activePinId, setActivePinId] = useState<string | undefined>(selectedPinId)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [isSearchingOnline, setIsSearchingOnline] = useState(false)

    // Dynamic clicked or located pin
    const [customPin, setCustomPin] = useState<MapPin | null>(null)

    // Configurable display of bottom pin cards (showPinCards takes precedence if specified)
    const shouldShowPinCards = showPinCards !== undefined ? showPinCards : showPinList

    // Combine prop pins with dynamic clicked/user pin if present
    const allPins = useMemo(() => {
        if (!customPin) return pins
        const exists = pins.some((p) => (p.id && p.id === customPin.id))
        return exists ? pins : [customPin, ...pins]
    }, [pins, customPin])

    // Find active selected pin
    const activePin = useMemo(() => {
        if (!activePinId) return null
        return allPins.find((p, idx) => {
            const id = p.id || `pin-${idx}-${p.lat}-${p.lng}`
            return id === activePinId || p.id === activePinId
        }) || null
    }, [allPins, activePinId])

    // Watch document dark mode class
    useEffect(() => {
        const checkDarkMode = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark')
            setIsDarkMode(hasDarkClass)
            if (autoTheme && !initialProvider) {
                setActiveProvider(hasDarkClass ? 'carto-dark' : 'carto-light')
            }
        }

        checkDarkMode()

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    checkDarkMode()
                }
            }
        })

        observer.observe(document.documentElement, {attributes: true})
        return () => observer.disconnect()
    }, [autoTheme, initialProvider])

    // Categories list derived from pins
    const categories = useMemo(() => {
        const set = new Set<string>()
        allPins.forEach((p) => {
            if (p.category) set.add(p.category)
        })
        return Array.from(set)
    }, [allPins])

    // Filtered pins
    const filteredPins = useMemo(() => {
        return allPins.filter((p) => {
            const matchesSearch =
                !searchQuery.trim() ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.badge?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory =
                selectedCategory === 'all' || p.category === selectedCategory

            return matchesSearch && matchesCategory
        })
    }, [allPins, searchQuery, selectedCategory])

    // Compute effective initial center
    const effectiveCenter = useMemo<[number, number]>(() => {
        if (center) return center
        if (pins.length > 0) return [pins[0].lat, pins[0].lng]
        return [37.7749, -122.4194] // Default: San Francisco
    }, [center, pins])

    // Instant optimistic reverse geocode on map click handler (0ms UI latency)
    const handleMapClickInternal = useCallback(
        (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng
            const map = mapInstanceRef.current
            if (!map) return

            const pinId = `clicked-${lat.toFixed(5)}-${lng.toFixed(5)}`
            const fallbackOcean = getOceanOrWaterbody(lat, lng)

            // 1. INSTANT optimistic pin placement (0ms delay)
            const initialPin: MapPin = {
                id: pinId,
                lat,
                lng,
                title: fallbackOcean,
                description: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                category: fallbackOcean,
                badge: fallbackOcean,
                color: '#f43f5e', // Rose
                icon: '📍',
            }

            setCustomPin(initialPin)
            setActivePinId(pinId)

            if (onMapClick) {
                onMapClick({ lat, lng })
            }

            // 2. Asynchronous reverse geocoding in background without blocking pin appearance
            if (enableClickToLookup) {
                const targetLang = lookupLang || (typeof navigator !== 'undefined' ? navigator.language : 'en')
                reverseGeocode(lat, lng, { lang: targetLang, zoom: 18 })
                    .then((addressResult) => {
                        const majorPlace = getMajorLocation(addressResult, { lat, lng }) || fallbackOcean
                        const majorTitle = formatMajorLocationTitle(addressResult, { lat, lng })
                        const fullAddress = formatConciseAddress(addressResult)

                        const enrichedPin: MapPin = {
                            id: pinId,
                            lat,
                            lng,
                            title: majorTitle,
                            description: fullAddress !== majorTitle && fullAddress ? `${lat.toFixed(5)}, ${lng.toFixed(5)} • ${fullAddress}` : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                            category: majorPlace,
                            badge: majorPlace,
                            color: '#f43f5e',
                            icon: '📍',
                            metadata: { address: addressResult },
                        }

                        setCustomPin((current) => {
                            if (current?.id === pinId) {
                                return enrichedPin
                            }
                            return current
                        })

                        if (onMapClick) {
                            onMapClick({ lat, lng, address: addressResult })
                        }
                    })
                    .catch(() => {
                        setCustomPin((current) => {
                            if (current?.id === pinId) {
                                return {
                                    ...current,
                                    title: fallbackOcean,
                                    description: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                                    badge: fallbackOcean,
                                }
                            }
                            return current
                        })
                    })
            }
        },
        [enableClickToLookup, lookupLang, onMapClick]
    )

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapContainerRef.current) return

        // Prevent duplicate initialization
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        const map = L.map(mapContainerRef.current, {
            center: effectiveCenter,
            zoom,
            minZoom,
            maxZoom,
            zoomControl: false,
            attributionControl: true,
            scrollWheelZoom: interactive && scrollWheelZoom,
            dragging: interactive,
            touchZoom: interactive,
            doubleClickZoom: interactive,
            boxZoom: interactive,
            keyboard: interactive,
        })

        // Tile layer
        const providerConfig = TILE_PROVIDERS[activeProvider] || TILE_PROVIDERS['osm']
        tileLayerRef.current = L.tileLayer(providerConfig.url, {
            attribution: providerConfig.attribution,
            maxZoom: providerConfig.maxZoom,
            subdomains: providerConfig.subdomains || 'abc',
        }).addTo(map)

        // Feature group for markers
        markersGroupRef.current = L.featureGroup().addTo(map)

        mapInstanceRef.current = map

        // Attach click listener
        map.on('click', (e) => {
            handleMapClickInternal(e)
        })

        // Trigger resize calculation
        setTimeout(() => {
            map.invalidateSize()
        }, 100)

        return () => {
            map.remove()
            mapInstanceRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-resize observer
    useEffect(() => {
        if (!mapContainerRef.current) return
        const resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize()
            }
        })
        resizeObserver.observe(mapContainerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Sync center and zoom ONLY when coordinate numbers genuinely change
    useEffect(() => {
        const map = mapInstanceRef.current
        if (!map || centerLat === null || centerLng === null) return

        const isCenterChanged =
            !prevCenterRef.current ||
            Math.abs(prevCenterRef.current[0] - centerLat) > 0.0001 ||
            Math.abs(prevCenterRef.current[1] - centerLng) > 0.0001
        const isZoomChanged = prevZoomRef.current !== zoom

        if (isCenterChanged || isZoomChanged) {
            prevCenterRef.current = [centerLat, centerLng]
            prevZoomRef.current = zoom
            map.setView([centerLat, centerLng], zoom ?? map.getZoom(), { animate: true })
        }
    }, [centerLat, centerLng, zoom])

    // Invalidate size on fullscreen toggle
    useEffect(() => {
        if (mapInstanceRef.current) {
            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize()
            }, 150)
        }
    }, [isFullscreen])

    // Update tile provider
    useEffect(() => {
        const map = mapInstanceRef.current
        if (!map) return

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current)
        }

        const providerConfig = TILE_PROVIDERS[activeProvider] || TILE_PROVIDERS['osm']
        tileLayerRef.current = L.tileLayer(providerConfig.url, {
            attribution: providerConfig.attribution,
            maxZoom: providerConfig.maxZoom,
            subdomains: providerConfig.subdomains || 'abc',
        }).addTo(map)
    }, [activeProvider])

    // Fly-to and open popup for a pin
    const focusPin = useCallback((pinId: string) => {
        const map = mapInstanceRef.current
        const item = markersMapRef.current.get(pinId)
        if (!map || !item) return

        setActivePinId(pinId)
        map.flyTo([item.pin.lat, item.pin.lng], Math.max(map.getZoom(), 15), {
            animate: true,
            duration: 1.2,
        })
        item.marker.openPopup()
        if (onPinClick) onPinClick(item.pin)
    }, [onPinClick])

    // Reset view to all pins
    const handleResetView = useCallback(() => {
        const map = mapInstanceRef.current
        const markersGroup = markersGroupRef.current
        if (!map) return

        if (markersGroup && filteredPins.length > 0) {
            const bounds = markersGroup.getBounds()
            if (bounds.isValid()) {
                map.fitBounds(bounds, {padding: [50, 50], maxZoom: 15})
                return
            }
        }
        map.setView(effectiveCenter, zoom)
    }, [effectiveCenter, filteredPins.length, zoom])

    // Locate user via GPS and reverse geocode with instant UI feedback
    const handleLocateMe = useCallback(async () => {
        if (typeof window === 'undefined' || !('geolocation' in navigator)) {
            alert('Geolocation is not supported in this browser.')
            return
        }

        setIsLocating(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                const map = mapInstanceRef.current

                if (map) {
                    map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 })
                }

                // 1. Instant user pin
                const oceanName = getOceanOrWaterbody(lat, lng)
                const userPin: MapPin = {
                    id: 'user-my-location',
                    lat,
                    lng,
                    title: oceanName,
                    description: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                    category: 'You',
                    badge: 'GPS',
                    color: '#3b82f6',
                    icon: '🎯',
                }

                setCustomPin(userPin)
                setActivePinId('user-my-location')
                setIsLocating(false)

                // 2. Background address lookup
                reverseGeocode(lat, lng, {
                    lang: lookupLang || (typeof navigator !== 'undefined' ? navigator.language : 'en'),
                    zoom: 18,
                })
                    .then((addressResult) => {
                        const majorPlace = getMajorLocation(addressResult, { lat, lng }) || 'Your Location'
                        const concise = formatConciseAddress(addressResult)
                        const enrichedUserPin: MapPin = {
                            id: 'user-my-location',
                            lat,
                            lng,
                            title: majorPlace,
                            description: concise ? `${lat.toFixed(5)}, ${lng.toFixed(5)} • ${concise}` : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                            category: 'You',
                            badge: majorPlace,
                            color: '#3b82f6',
                            icon: '🎯',
                            metadata: { address: addressResult },
                        }
                        setCustomPin(enrichedUserPin)

                        if (onLocationFound) {
                            onLocationFound({ lat, lng, address: addressResult })
                        }
                    })
                    .catch(() => {
                        if (onLocationFound) {
                            onLocationFound({ lat, lng, address: null })
                        }
                    })
            },
            (err) => {
                setIsLocating(false)
                let msg = 'Could not retrieve your location.'
                if (err.code === err.PERMISSION_DENIED) {
                    msg = 'Location permission was denied in browser settings.'
                }
                alert(msg)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
    }, [lookupLang, onLocationFound])

    // Online forward geocode when pressing Enter in search
    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const query = searchQuery.trim()
        if (!query) return

        // If local pins match, focus the first one
        if (filteredPins.length > 0) {
            const firstId = filteredPins[0].id || `pin-0-${filteredPins[0].lat}-${filteredPins[0].lng}`
            focusPin(firstId)
            return
        }

        // Otherwise perform online forward geocode lookup
        setIsSearchingOnline(true)
        try {
            const results = await forwardGeocode(query, { limit: 1 })
            if (results && results.length > 0) {
                const item = results[0]
                const map = mapInstanceRef.current
                if (map) {
                    map.flyTo([item.lat, item.lng], 14, { animate: true, duration: 1.2 })
                }
                const oceanOrMajor = getMajorLocation(item, { lat: item.lat, lng: item.lng }) || item.name || 'Location'
                const fullTitle = formatMajorLocationTitle(item, { lat: item.lat, lng: item.lng })
                const pinId = `search-${item.lat.toFixed(5)}-${item.lng.toFixed(5)}`
                const searchedPin: MapPin = {
                    id: pinId,
                    lat: item.lat,
                    lng: item.lng,
                    title: fullTitle,
                    description: `${item.lat.toFixed(5)}, ${item.lng.toFixed(5)} • ${item.displayName}`,
                    category: oceanOrMajor,
                    badge: oceanOrMajor,
                    color: '#6366f1',
                    icon: '📍',
                    metadata: { address: item },
                }
                setCustomPin(searchedPin)
                setActivePinId(pinId)
            }
        } catch {
            // Ignore
        } finally {
            setIsSearchingOnline(false)
        }
    }

    // Zoom handlers
    const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
    const handleZoomOut = () => mapInstanceRef.current?.zoomOut()

    // Render & sync pins onto the map
    useEffect(() => {
        const map = mapInstanceRef.current
        const markersGroup = markersGroupRef.current
        if (!map || !markersGroup) return

        markersGroup.clearLayers()
        markersMapRef.current.clear()

        if (filteredPins.length === 0) return

        filteredPins.forEach((pin, index) => {
            const pinId = pin.id || `pin-${index}-${pin.lat}-${pin.lng}`
            const isSelected = pinId === activePinId

            const customIcon = L.divIcon({
                className: 'custom-leaflet-div-icon',
                html: createPinIconHtml(pin, isSelected),
                iconSize: [32, 42],
                iconAnchor: [16, 42],
                popupAnchor: [0, -42],
            })

            const marker = L.marker([pin.lat, pin.lng], {
                icon: customIcon,
                title: pin.title,
                interactive: true,
                keyboard: true,
            })

            const popup = L.popup({
                offset: [0, -38],
                className: 'custom-osm-popup-wrapper',
                maxWidth: 320,
                minWidth: 260,
                autoPan: true,
                autoPanPadding: [24, 24],
            }).setContent(createPopupHtml(pin))

            marker.bindPopup(popup)

            marker.on('click', () => {
                setActivePinId(pinId)
                if (onPinClick) onPinClick(pin)
            })

            markersGroup.addLayer(marker)
            markersMapRef.current.set(pinId, {marker, pin})
        })

        // Auto-fit bounds ONLY once on initial mount if multiple pins exist and no explicit center
        if (!center && filteredPins.length > 1 && !customPin && !hasInitialBoundsFitRef.current) {
            try {
                const bounds = markersGroup.getBounds()
                if (bounds.isValid()) {
                    hasInitialBoundsFitRef.current = true
                    map.fitBounds(bounds, {padding: [50, 50], maxZoom: 15})
                }
            } catch {
                // Ignore bounds error
            }
        }
    }, [filteredPins, activePinId, center, customPin, onPinClick])

    // Synchronize external selectedPinId
    useEffect(() => {
        if (selectedPinId && selectedPinId !== activePinId) {
            focusPin(selectedPinId)
        }
    }, [selectedPinId, activePinId, focusPin])

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden transition-all',
                isFullscreen && 'fixed inset-0 z-50 rounded-none h-screen border-none',
                className
            )}
            style={{height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height}}
            data-lenis-prevent
        >
            {/* Top Toolbar: Search, Categories & Layer Switcher */}
            {(showSearch || showLayerSelector || showCategoryFilter) && (
                <div className="z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-3 py-2 backdrop-blur-sm">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto flex-1 min-w-0">
                        {showSearch && (
                            <form onSubmit={handleSearchSubmit} className="relative flex-1">
                                {isSearchingOnline ? (
                                    <Loader2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary animate-spin" />
                                ) : (
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                )}
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search pins or press Enter to find..."
                                    className="h-8 pl-8 text-xs bg-muted/50 border-muted focus-visible:bg-background w-full"
                                />
                            </form>
                        )}

                        {showCategoryFilter && categories.length > 0 && (
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 touch-pan-x flex-1 sm:flex-initial">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('all')}
                                    className={cn(
                                        'rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                                        selectedCategory === 'all'
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'bg-muted text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    All ({allPins.length})
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            'rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                                            selectedCategory === cat
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-muted text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 justify-between sm:justify-end sm:ml-auto w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
                        {/* Layer Switcher */}
                        {showLayerSelector && (
                            <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5">
                                {(Object.keys(TILE_PROVIDERS) as MapTileProvider[]).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveProvider(key)}
                                        title={TILE_PROVIDERS[key].name}
                                        className={cn(
                                            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer',
                                            activeProvider === key
                                                ? 'bg-background text-foreground shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {key === 'osm'
                                            ? 'OSM Free'
                                            : key === 'hot'
                                            ? 'Humanitarian'
                                            : key === 'osm-de'
                                            ? 'Topo'
                                            : key === 'carto-light'
                                            ? 'Light'
                                            : 'Dark'}
                                    </button>
                                ))}
                            </div>
                        )}

                        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] gap-1 px-1.5 py-0.5 font-mono">
                            <Sparkles className="h-2.5 w-2.5 text-primary" />
                            {filteredPins.length} {filteredPins.length === 1 ? 'Pin' : 'Pins'}
                        </Badge>
                    </div>
                </div>
            )}

            {/* Map Canvas + Floating Controls */}
            <div className="relative flex-1 w-full h-full min-h-80 overflow-hidden" data-lenis-prevent>
                <div
                    ref={mapContainerRef}
                    className="w-full h-full z-0 outline-none select-none cursor-crosshair"
                    style={{background: isDarkMode ? '#1e293b' : '#f8fafc'}}
                />

                {/* Floating Map Controls (Zoom, Locate, Reset, Fullscreen) */}
                <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
                    {showZoomControls && (
                        <div className="flex flex-col rounded-lg border border-border bg-background/90 shadow-md backdrop-blur-md overflow-hidden">
                            <button
                                type="button"
                                onClick={handleZoomIn}
                                className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-muted/80 transition-colors border-b border-border/60 cursor-pointer"
                                title="Zoom in"
                                aria-label="Zoom in"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="Zoom out"
                                aria-label="Zoom out"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Locate Me Button */}
                    {showUserLocationButton && (
                        <button
                            type="button"
                            onClick={handleLocateMe}
                            disabled={isLocating}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-md backdrop-blur-md hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50"
                            title="My Location (GPS & Reverse Geocoding)"
                            aria-label="Find my location"
                        >
                            {isLocating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            ) : (
                                <Locate className="h-3.5 w-3.5 text-primary" />
                            )}
                        </button>
                    )}

                    {showResetView && (
                        <button
                            type="button"
                            onClick={handleResetView}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-md backdrop-blur-md hover:bg-muted/80 transition-colors cursor-pointer"
                            title="Reset view / fit all pins"
                            aria-label="Reset map view"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {allowFullscreen && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsFullscreen(!isFullscreen)
                                setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150)
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-md backdrop-blur-md hover:bg-muted/80 transition-colors cursor-pointer"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            aria-label="Toggle map fullscreen"
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Embedded In-Map Selected Pin / Reverse Geocoded Text Box */}
                {showPinInfoBox && activePin && (
                    <div className="absolute left-3 right-3 bottom-3 sm:right-auto sm:max-w-md sm:bottom-3 z-20 rounded-xl border border-border/90 bg-background/95 p-3.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
                        <div className="flex items-start justify-between gap-2 pb-1.5 mb-1.5 border-b border-border/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                                {activePin.icon ? (
                                    <span className="text-xs shrink-0">{activePin.icon}</span>
                                ) : (
                                    <div
                                        className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
                                        style={{ backgroundColor: resolvePinColor(activePin.color) }}
                                    />
                                )}
                                <span className="text-xs font-bold text-foreground truncate">
                                    {activePin.title}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActivePinId(undefined)}
                                className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="Close pin info"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                                {activePin.category && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4.5"
                                        style={{
                                            color: resolvePinColor(activePin.color),
                                            borderColor: resolvePinColor(activePin.color),
                                        }}
                                    >
                                        {activePin.category}
                                    </Badge>
                                )}
                                {activePin.badge && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4.5">
                                        {activePin.badge}
                                    </Badge>
                                )}
                            </div>

                            {/* Coordinates Display Below Big Object */}
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                <span>{activePin.lat.toFixed(5)}, {activePin.lng.toFixed(5)}</span>
                            </div>

                            {activePin.description && (
                                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                    {activePin.description}
                                </p>
                            )}

                            {/* Outbound Quick Links */}
                            <div className="flex items-center gap-1.5 pt-1">
                                {activePin.link && (
                                    <a
                                        href={typeof activePin.link === 'string' ? activePin.link : activePin.link.url}
                                        target={typeof activePin.link === 'string' || activePin.link.external !== false ? '_blank' : '_self'}
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                    >
                                        {typeof activePin.link === 'string' ? 'Learn More' : activePin.link.label || 'Learn More'}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                <a
                                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${activePin.lat}%2C${activePin.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline ml-auto"
                                    title="Get directions via OpenStreetMap"
                                >
                                    <Navigation className="h-3 w-3" />
                                    Directions
                                </a>
                                <span className="text-muted-foreground/40">•</span>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${activePin.lat},${activePin.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                                    title="Open in Google Maps"
                                >
                                    GMaps
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Optional Bottom Pin Cards Row */}
            {shouldShowPinCards && filteredPins.length > 0 && (
                <div className="z-10 border-t border-border/80 bg-background/95 p-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
                        {filteredPins.map((pin, idx) => {
                            const pinId = pin.id || `pin-${idx}-${pin.lat}-${pin.lng}`
                            const isSelected = pinId === activePinId
                            return (
                                <button
                                    key={pinId}
                                    type="button"
                                    onClick={() => focusPin(pinId)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-all shrink-0 cursor-pointer min-w-35 max-w-55',
                                        isSelected
                                            ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                                            : 'border-border/70 bg-card hover:bg-muted/60'
                                    )}
                                >
                                    {pin.icon ? (
                                        <span className="text-sm shrink-0 leading-none">{pin.icon}</span>
                                    ) : (
                                        <div
                                            className="h-2 w-2 rounded-full shrink-0"
                                            style={{backgroundColor: resolvePinColor(pin.color)}}
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate text-foreground">
                                            {pin.title}
                                        </p>
                                        {pin.badge && (
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {pin.badge}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
