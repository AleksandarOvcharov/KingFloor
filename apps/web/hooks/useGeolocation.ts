'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { reverseGeocode, type ReverseGeocodeResult } from '@/lib/geo/geocoding'

export interface UseGeolocationOptions {
    /** Whether to enable high accuracy GPS mode (default: true) */
    enableHighAccuracy?: boolean
    /** Maximum time to wait for position in milliseconds (default: 10000) */
    timeout?: number
    /** Maximum cached position age in milliseconds (default: 60000) */
    maximumAge?: number
    /** Automatically request position when hook mounts (default: false) */
    autoLocate?: boolean
    /** Automatically reverse geocode coordinates into a street address (default: true) */
    reverseGeocode?: boolean
    /** Language for reverse geocoding address (e.g. 'en', 'bg') */
    lang?: string
    /** Callback fired when location is obtained */
    onSuccess?: (coords: { lat: number; lng: number; accuracy: number; address: ReverseGeocodeResult | null }) => void
    /** Callback fired on error */
    onError?: (error: string) => void
}

export interface UseGeolocationReturn {
    /** Coordinates `{ lat, lng }` or null if not yet located */
    coordinates: { lat: number; lng: number } | null
    /** Reverse geocoded address details or null */
    address: ReverseGeocodeResult | null
    /** GPS accuracy in meters */
    accuracy: number | null
    /** Whether geolocation or reverse geocoding is in progress */
    loading: boolean
    /** Error message, or null */
    error: string | null
    /** Whether the browser supports the Geolocation API */
    isSupported: boolean
    /** Request the user's current GPS position and reverse geocode */
    getCurrentLocation: (options?: { reverseGeocode?: boolean; lang?: string }) => Promise<{
        lat: number
        lng: number
        accuracy: number
        address: ReverseGeocodeResult | null
    } | null>
    /** Reset the stored location state */
    clear: () => void
}

/**
 * React hook for requesting browser geolocation and auto reverse-geocoding via OpenStreetMap.
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 60000,
        autoLocate = false,
        reverseGeocode: shouldReverseGeocode = true,
        lang,
        onSuccess,
        onError,
    } = options

    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
    const [address, setAddress] = useState<ReverseGeocodeResult | null>(null)
    const [accuracy, setAccuracy] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSupported, setIsSupported] = useState(false)

    const onSuccessRef = useRef(onSuccess)
    const onErrorRef = useRef(onError)

    useEffect(() => {
        onSuccessRef.current = onSuccess
        onErrorRef.current = onError
    }, [onSuccess, onError])

    useEffect(() => {
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            setIsSupported(true)
        }
    }, [])

    const getCurrentLocation = useCallback(
        async (callOptions?: { reverseGeocode?: boolean; lang?: string }) => {
            if (typeof window === 'undefined' || !('geolocation' in navigator)) {
                const err = 'Geolocation is not supported by your browser.'
                setError(err)
                onErrorRef.current?.(err)
                return null
            }

            setLoading(true)
            setError(null)

            return new Promise<{
                lat: number
                lng: number
                accuracy: number
                address: ReverseGeocodeResult | null
            } | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude
                        const lng = position.coords.longitude
                        const acc = position.coords.accuracy

                        setCoordinates({ lat, lng })
                        setAccuracy(acc)

                        let geoAddress: ReverseGeocodeResult | null = null
                        const doReverse = callOptions?.reverseGeocode ?? shouldReverseGeocode

                        if (doReverse) {
                            try {
                                geoAddress = await reverseGeocode(lat, lng, {
                                    lang: callOptions?.lang || lang || (typeof navigator !== 'undefined' ? navigator.language : 'en'),
                                    zoom: 18,
                                })
                                setAddress(geoAddress)
                            } catch {
                                // Ignore reverse geocode failure
                            }
                        }

                        setLoading(false)
                        const result = { lat, lng, accuracy: acc, address: geoAddress }
                        onSuccessRef.current?.(result)
                        resolve(result)
                    },
                    (geoErr) => {
                        setLoading(false)
                        let message = 'Failed to retrieve your location.'
                        switch (geoErr.code) {
                            case geoErr.PERMISSION_DENIED:
                                message = 'Location permission was denied. Please allow location access in your browser.'
                                break
                            case geoErr.POSITION_UNAVAILABLE:
                                message = 'Location information is currently unavailable.'
                                break
                            case geoErr.TIMEOUT:
                                message = 'The request to get user location timed out.'
                                break
                        }
                        setError(message)
                        onErrorRef.current?.(message)
                        resolve(null)
                    },
                    {
                        enableHighAccuracy,
                        timeout,
                        maximumAge,
                    }
                )
            })
        },
        [enableHighAccuracy, timeout, maximumAge, shouldReverseGeocode, lang]
    )

    const clear = useCallback(() => {
        setCoordinates(null)
        setAddress(null)
        setAccuracy(null)
        setError(null)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (autoLocate && typeof window !== 'undefined' && 'geolocation' in navigator) {
            getCurrentLocation()
        }
    }, [autoLocate, getCurrentLocation])

    return {
        coordinates,
        address,
        accuracy,
        loading,
        error,
        isSupported,
        getCurrentLocation,
        clear,
    }
}
