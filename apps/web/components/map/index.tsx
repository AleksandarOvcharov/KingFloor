'use client'

import dynamic from 'next/dynamic'
import React from 'react'
import {useI18n} from '@/lib/i18n/provider'

function MapViewLoading() {
    const {t} = useI18n()
    return (
        <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground animate-pulse">
            <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-medium">{t.map.loadingInteractiveMap}</span>
            </div>
        </div>
    )
}

// Dynamic SSR-safe wrapper for Next.js App Router
export const MapView = dynamic(
    () => import('./map-view').then((mod) => mod.MapView),
    {
        ssr: false,
        loading: MapViewLoading,
    }
)

export const CustomMap = MapView

export * from './types'
export {
    reverseGeocode,
    forwardGeocode,
    formatConciseAddress,
    type ReverseGeocodeResult,
    type ReverseGeocodeAddress,
    type ReverseGeocodeOptions,
    type ForwardGeocodeOptions,
} from '@/lib/geo/geocoding'
