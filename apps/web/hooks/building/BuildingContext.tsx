'use client'

import {createContext, useContext} from 'react'
import {useAuth} from '@/hooks/useAuth'
import {useBuilding} from './useBuilding'

type BuildingContextValue = ReturnType<typeof useBuilding>

const BuildingContext = createContext<BuildingContextValue | null>(null)

/**
 * Fetches the current user's building membership exactly once and shares it
 * through context. Every /building/* page used to call useBuilding(user)
 * independently, so navigating between e.g. /building/fees and
 * /building/issues re-fetched GET /api/building from scratch every single
 * time — this is what actually made the section feel slow to move around
 * in, not any one page being heavy on its own.
 */
export function BuildingProvider({children}: {children: React.ReactNode}) {
    const {user} = useAuth()
    const value = useBuilding(user)
    return <BuildingContext.Provider value={value}>{children}</BuildingContext.Provider>
}

export function useBuildingContext(): BuildingContextValue {
    const ctx = useContext(BuildingContext)
    if (!ctx) throw new Error('useBuildingContext must be used within <BuildingProvider>')
    return ctx
}
