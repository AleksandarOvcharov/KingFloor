/**
 * Free OpenStreetMap Geocoding & Reverse Geocoding via Nominatim API.
 * 100% Free - Requires zero API keys.
 * 
 * Usage policies: Nominatim provides open geocoding for OpenStreetMap data.
 * Includes caching and sensible user headers.
 */

export interface ReverseGeocodeAddress {
    road?: string
    houseNumber?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    stateDistrict?: string
    state?: string
    region?: string
    province?: string
    country?: string
    postcode?: string
    countryCode?: string
    building?: string
    amenity?: string
    shop?: string
    tourism?: string
    ocean?: string
    sea?: string
    water?: string
    bay?: string
    natural?: string
}

export interface ReverseGeocodeResult {
    lat: number
    lng: number
    displayName: string
    name?: string
    address: ReverseGeocodeAddress
    placeId?: number
    osmType?: string
    category?: string
    type?: string
    boundingbox?: [string, string, string, string]
}

export interface ReverseGeocodeOptions {
    /** Preferred language for address output (e.g. 'en', 'bg', 'es', 'de'). Default: 'en' */
    lang?: string
    /** Level of detail (3=country, 5=state, 8=county, 10=city, 14=suburb, 16=major street, 18=building/address). Default: 18 */
    zoom?: number
}

export interface ForwardGeocodeOptions {
    /** Maximum number of results to return. Default: 5 */
    limit?: number
    /** Preferred language. Default: 'en' */
    lang?: string
    /** Bounding box filter `[minLat, minLng, maxLat, maxLng]` */
    viewbox?: [number, number, number, number]
}

// In-memory cache for reverse geocoding requests to respect rate limits and speed up repeated lookups
const reverseGeocodeCache = new Map<string, { result: ReverseGeocodeResult; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

/**
 * Approximate closest major ocean, sea, or waterbody based on geographic coordinates.
 */
export function getOceanOrWaterbody(lat: number, lng: number): string {
    if (lat > 66.5) return 'Arctic Ocean'
    if (lat < -60) return 'Southern Ocean'

    // Mediterranean Sea
    if (lat >= 30 && lat <= 46 && lng >= -5 && lng <= 36) {
        return 'Mediterranean Sea'
    }
    // Red Sea
    if (lat >= 12 && lat <= 30 && lng >= 32 && lng <= 44) {
        return 'Red Sea'
    }
    // Persian Gulf
    if (lat >= 23 && lat <= 31 && lng >= 48 && lng <= 57) {
        return 'Persian Gulf'
    }
    // Black Sea
    if (lat >= 40 && lat <= 47 && lng >= 27 && lng <= 42) {
        return 'Black Sea'
    }
    // Baltic Sea
    if (lat >= 53 && lat <= 66 && lng >= 10 && lng <= 30) {
        return 'Baltic Sea'
    }
    // North Sea
    if (lat >= 51 && lat <= 61 && lng >= -4 && lng <= 9) {
        return 'North Sea'
    }
    // Gulf of Mexico
    if (lat >= 18 && lat <= 31 && lng >= -98 && lng <= -80) {
        return 'Gulf of Mexico'
    }
    // Caribbean Sea
    if (lat >= 9 && lat <= 22 && lng >= -88 && lng <= -60) {
        return 'Caribbean Sea'
    }
    // Atlantic Ocean
    if (lng >= -75 && lng <= 20) {
        return lat >= 0 ? 'North Atlantic Ocean' : 'South Atlantic Ocean'
    }
    // Indian Ocean
    if (lng > 20 && lng <= 110 && lat < 30) {
        return 'Indian Ocean'
    }
    // Pacific Ocean
    return lat >= 0 ? 'North Pacific Ocean' : 'South Pacific Ocean'
}

/**
 * Extract the prominent/major location name (City, Town, Municipality, County, Suburb, or State).
 * E.g. "San Francisco", "Alameda County", "Sofia", "Munich"
 */
export function getMajorLocation(
    input: ReverseGeocodeResult | ReverseGeocodeAddress | null | undefined,
    fallbackCoords?: { lat: number; lng: number }
): string {
    if (!input) {
        return fallbackCoords ? getOceanOrWaterbody(fallbackCoords.lat, fallbackCoords.lng) : ''
    }
    const address = 'address' in input ? input.address : input
    const lat = 'lat' in input ? input.lat : fallbackCoords?.lat
    const lng = 'lng' in input ? input.lng : fallbackCoords?.lng
    if (!address) {
        return lat !== undefined && lng !== undefined ? getOceanOrWaterbody(lat, lng) : ''
    }

    // 1. Direct settlement (City / Town / Municipality / Village)
    if (address.city) return address.city
    if (address.town) return address.town
    if (address.municipality) return address.municipality
    if (address.village) return address.village

    // 2. County / State District
    if (address.county) return address.county
    if (address.stateDistrict) return address.stateDistrict

    // 3. Suburb / Neighbourhood
    if (address.suburb) return address.suburb
    if (address.neighbourhood) return address.neighbourhood

    // 4. State / Region / Province
    if (address.state) return address.state
    if (address.region) return address.region
    if (address.province) return address.province

    // 5. Country
    if (address.country) return address.country

    // 6. Waterbody / Ocean / Sea
    if (address.ocean) return address.ocean
    if (address.sea) return address.sea
    if (address.water) return address.water
    if (address.bay) return address.bay
    if (address.natural) return address.natural

    // 7. Geographic ocean / sea estimation
    if (lat !== undefined && lng !== undefined) {
        return getOceanOrWaterbody(lat, lng)
    }

    return ''
}

/**
 * Format a prominent headline display title for a location (e.g. "San Francisco, California" or "Alameda County, California").
 */
export function formatMajorLocationTitle(
    result: ReverseGeocodeResult | null | undefined,
    fallbackCoords?: { lat: number; lng: number }
): string {
    const lat = result?.lat ?? fallbackCoords?.lat
    const lng = result?.lng ?? fallbackCoords?.lng

    if (!result) {
        return lat !== undefined && lng !== undefined ? getOceanOrWaterbody(lat, lng) : 'Selected Location'
    }

    const major = getMajorLocation(result, fallbackCoords)
    const { address } = result

    if (major) {
        const secondary = address.state && address.state !== major
            ? address.state
            : address.country && address.country !== major
            ? address.country
            : ''
        return secondary ? `${major}, ${secondary}` : major
    }

    if (result.name && result.name !== result.displayName) {
        return result.name
    }

    if (result.displayName) {
        const firstSegment = result.displayName.split(',')[0]?.trim()
        if (firstSegment) return firstSegment
    }

    if (lat !== undefined && lng !== undefined) {
        return getOceanOrWaterbody(lat, lng)
    }

    return 'Selected Location'
}

export function formatCoordinates(lat: number, lng: number, digits: number = 5): string {
    return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`
}

/**
 * Reverse geocode coordinates `(lat, lng)` into a human-readable street address, city, and country.
 * 
 * @param lat Latitude coordinate (e.g. 42.6977)
 * @param lng Longitude coordinate (e.g. 23.3219)
 * @param options Configuration options (language, zoom level)
 */
export async function reverseGeocode(
    lat: number,
    lng: number,
    options: ReverseGeocodeOptions = {}
): Promise<ReverseGeocodeResult> {
    const { lang = 'en', zoom = 18 } = options
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}:${lang}:${zoom}`

    const cached = reverseGeocodeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.result
    }

    const fallbackResult: ReverseGeocodeResult = {
        lat,
        lng,
        displayName: 'Selected Location',
        address: {},
    }

    try {
        const isClient = typeof window !== 'undefined'
        const endpoint = isClient
            ? `/api/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&lang=${encodeURIComponent(lang)}&zoom=${encodeURIComponent(zoom)}`
            : `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=${zoom}&accept-language=${encodeURIComponent(lang)}`

        const headers: Record<string, string> = {
            Accept: 'application/json',
        }

        if (!isClient) {
            headers['User-Agent'] = 'HackathonStartupTemplate/1.0 (OpenStreetMap reverse geocoder)'
        }

        const response = await fetch(endpoint, {
            headers,
            cache: isClient ? 'default' : 'no-store',
        })

        if (!response.ok) {
            return fallbackResult
        }

        const data = await response.json()
        if (!data || data.error) {
            return fallbackResult
        }

        if (data.displayName && data.address !== undefined) {
            const result: ReverseGeocodeResult = {
                lat: data.lat ?? lat,
                lng: data.lng ?? lng,
                displayName: data.displayName || 'Selected Location',
                name: data.name,
                address: data.address || {},
                placeId: data.placeId,
                osmType: data.osmType,
                category: data.category,
                type: data.type,
                boundingbox: data.boundingbox,
            }
            reverseGeocodeCache.set(cacheKey, { result, timestamp: Date.now() })
            return result
        }

        const rawAddr = data.address || {}
        const address: ReverseGeocodeAddress = {
            road: rawAddr.road || rawAddr.pedestrian || rawAddr.street || rawAddr.footway,
            houseNumber: rawAddr.house_number,
            neighbourhood: rawAddr.neighbourhood || rawAddr.residential,
            suburb: rawAddr.suburb || rawAddr.quarter,
            city: rawAddr.city,
            town: rawAddr.town,
            village: rawAddr.village || rawAddr.hamlet,
            municipality: rawAddr.municipality,
            county: rawAddr.county || rawAddr.state_district || rawAddr.district,
            stateDistrict: rawAddr.state_district || rawAddr.district,
            state: rawAddr.state || rawAddr.region || rawAddr.province,
            region: rawAddr.region,
            province: rawAddr.province,
            country: rawAddr.country,
            postcode: rawAddr.postcode,
            countryCode: rawAddr.country_code,
            building: rawAddr.building,
            amenity: rawAddr.amenity,
            shop: rawAddr.shop,
            tourism: rawAddr.tourism,
        }

        const result: ReverseGeocodeResult = {
            lat: parseFloat(data.lat) || lat,
            lng: parseFloat(data.lon) || lng,
            displayName: data.display_name || 'Selected Location',
            name: data.name || address.building || address.amenity || address.road,
            address,
            placeId: data.place_id,
            osmType: data.osm_type,
            category: data.category,
            type: data.type,
            boundingbox: data.boundingbox,
        }

        reverseGeocodeCache.set(cacheKey, { result, timestamp: Date.now() })
        return result
    } catch {
        return fallbackResult
    }
}

/**
 * Forward geocode a search string query into coordinates and matching place details.
 */
export async function forwardGeocode(
    query: string,
    options: ForwardGeocodeOptions = {}
): Promise<ReverseGeocodeResult[]> {
    if (!query || !query.trim()) return []

    const { limit = 5, lang = 'en', viewbox } = options

    try {
        const isClient = typeof window !== 'undefined'
        let endpoint = isClient
            ? `/api/geo/search?q=${encodeURIComponent(query.trim())}&limit=${limit}&lang=${encodeURIComponent(lang)}`
            : `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query.trim())}&addressdetails=1&limit=${limit}&accept-language=${encodeURIComponent(lang)}`

        if (viewbox) {
            const vbStr = `${viewbox[1]},${viewbox[0]},${viewbox[3]},${viewbox[2]}`
            endpoint += isClient ? `&viewbox=${encodeURIComponent(vbStr)}` : `&viewbox=${encodeURIComponent(vbStr)}&bounded=1`
        }

        const headers: Record<string, string> = {
            Accept: 'application/json',
        }

        if (!isClient) {
            headers['User-Agent'] = 'HackathonStartupTemplate/1.0 (OpenStreetMap forward geocoder)'
        }

        const response = await fetch(endpoint, {
            headers,
        })

        if (!response.ok) {
            return []
        }

        const list = await response.json()
        if (!Array.isArray(list)) return []

        return list.map((item) => {
            if (item.displayName && item.address !== undefined) {
                return item as ReverseGeocodeResult
            }
            const rawAddr = item.address || {}
            return {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName: item.display_name,
                name: item.name,
                address: {
                    road: rawAddr.road || rawAddr.pedestrian || rawAddr.street,
                    houseNumber: rawAddr.house_number,
                    neighbourhood: rawAddr.neighbourhood,
                    suburb: rawAddr.suburb,
                    city: rawAddr.city,
                    town: rawAddr.town,
                    village: rawAddr.village,
                    county: rawAddr.county || rawAddr.state_district || rawAddr.district,
                    stateDistrict: rawAddr.state_district || rawAddr.district,
                    state: rawAddr.state || rawAddr.region || rawAddr.province,
                    region: rawAddr.region,
                    province: rawAddr.province,
                    country: rawAddr.country,
                    postcode: rawAddr.postcode,
                    countryCode: rawAddr.country_code,
                },
                placeId: item.place_id,
                osmType: item.osm_type,
                category: item.category,
                type: item.type,
                boundingbox: item.boundingbox,
            }
        })
    } catch {
        return []
    }
}

/**
 * Format a concise, clean address headline from reverse geocode details.
 * E.g. "Vitosha Blvd 12, Sofia, Bulgaria"
 */
export function formatConciseAddress(result: ReverseGeocodeResult): string {
    const { address, displayName } = result
    const parts: string[] = []

    const street = address.road
        ? address.houseNumber
            ? `${address.road} ${address.houseNumber}`
            : address.road
        : address.building || address.amenity || address.shop

    if (street) parts.push(street)

    const locality = address.city || address.town || address.village || address.municipality || address.county || address.suburb || address.neighbourhood
    if (locality && !parts.includes(locality)) parts.push(locality)

    if (address.country && !parts.includes(address.country)) {
        parts.push(address.country)
    }

    if (parts.length > 0) {
        return parts.join(', ')
    }

    return displayName || 'Selected Location'
}
