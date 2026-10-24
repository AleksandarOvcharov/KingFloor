import {NextRequest, NextResponse} from 'next/server'

/**
 * GET /api/geo/search?q=Sofia&limit=5&lang=en
 * Server-side proxy to OpenStreetMap Nominatim forward geocoding.
 */
export async function GET(request: NextRequest) {
    const {searchParams} = request.nextUrl
    const query = searchParams.get('q') || searchParams.get('query')
    const rawLimit = parseInt(searchParams.get('limit') || '5', 10)
    const limit = isNaN(rawLimit) ? 5 : Math.max(1, Math.min(rawLimit, 20))
    const lang = searchParams.get('lang') || 'en'
    const viewbox = searchParams.get('viewbox')

    if (!query || !query.trim()) {
        return NextResponse.json([], {status: 200})
    }

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('q', query.trim())
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('accept-language', lang)

    if (viewbox) {
        url.searchParams.set('viewbox', viewbox)
        url.searchParams.set('bounded', '1')
    }

    try {
        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'HackathonStartupTemplate/1.0 (Next.js OSM Server Proxy; contact: info@hackathon-startup.dev)',
            },
            next: {
                revalidate: 3600,
            },
        })

        if (!response.ok) {
            return NextResponse.json([], {status: 200})
        }

        const list = await response.json()
        if (!Array.isArray(list)) {
            return NextResponse.json([], {status: 200})
        }

        const results = list.map((item: Record<string, unknown>) => {
            const rawAddr = (item.address as Record<string, string>) || {}
            return {
                lat: parseFloat(String(item.lat)),
                lng: parseFloat(String(item.lon)),
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
                    county: rawAddr.county,
                    state: rawAddr.state,
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

        return NextResponse.json(results, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        })
    } catch {
        return NextResponse.json([], {status: 200})
    }
}
