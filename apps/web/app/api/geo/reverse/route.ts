import {NextRequest, NextResponse} from 'next/server'

/**
 * GET /api/geo/reverse?lat=42.6977&lng=23.3219&lang=en&zoom=18
 * Server-side proxy to OpenStreetMap Nominatim reverse geocoding.
 * Complies with OSM Usage Policy with proper User-Agent and server caching.
 */
export async function GET(request: NextRequest) {
    const {searchParams} = request.nextUrl
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng') || searchParams.get('lon')
    const lang = searchParams.get('lang') || searchParams.get('accept-language') || 'en'
    const rawZoom = parseInt(searchParams.get('zoom') || '18', 10)
    const zoom = isNaN(rawZoom) ? '18' : Math.max(0, Math.min(rawZoom, 18)).toString()

    if (!lat || !lng) {
        return NextResponse.json(
            {error: 'Missing required query parameters: lat, lng'},
            {status: 400}
        )
    }

    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)

    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        return NextResponse.json(
            {error: 'Invalid coordinates provided'},
            {status: 400}
        )
    }

    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', parsedLat.toString())
    url.searchParams.set('lon', parsedLng.toString())
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('zoom', zoom)
    url.searchParams.set('accept-language', lang)

    try {
        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'HackathonStartupTemplate/1.0 (Next.js OSM Server Proxy; contact: info@hackathon-startup.dev)',
            },
            next: {
                revalidate: 3600, // Cache on server for 1 hour
            },
        })

        if (!response.ok) {
            return NextResponse.json(
                {
                    lat: parsedLat,
                    lng: parsedLng,
                    displayName: `Location (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
                    address: {},
                },
                {status: 200}
            )
        }

        const data = await response.json()
        if (data.error) {
            return NextResponse.json(
                {
                    lat: parsedLat,
                    lng: parsedLng,
                    displayName: `Location (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
                    address: {},
                },
                {status: 200}
            )
        }

        const rawAddr = data.address || {}
        const address = {
            road: rawAddr.road || rawAddr.pedestrian || rawAddr.street || rawAddr.footway || rawAddr.path || rawAddr.highway,
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
            ocean: rawAddr.ocean || rawAddr.sea || rawAddr.water || rawAddr.body_of_water || rawAddr.bay,
            sea: rawAddr.sea,
            water: rawAddr.water,
            bay: rawAddr.bay,
            natural: rawAddr.natural,
        }

        const result = {
            lat: parseFloat(data.lat) || parsedLat,
            lng: parseFloat(data.lon) || parsedLng,
            displayName: data.display_name || `${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`,
            name: data.name || address.building || address.amenity || address.road,
            address,
            placeId: data.place_id,
            osmType: data.osm_type,
            category: data.category,
            type: data.type,
            boundingbox: data.boundingbox,
        }

        return NextResponse.json(result, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        })
    } catch {
        return NextResponse.json(
            {
                lat: parsedLat,
                lng: parsedLng,
                displayName: `Location (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
                address: {},
            },
            {status: 200}
        )
    }
}
