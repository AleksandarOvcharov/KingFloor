'use client'

import { useContext } from 'react'
import { SmoothScrollContext, SmoothScrollContextType } from '@/components/smooth-scroll-provider'

export function useSmoothScroll(): SmoothScrollContextType {
  const context = useContext(SmoothScrollContext)
  if (!context) {
    throw new Error('useSmoothScroll must be used within a SmoothScrollProvider')
  }
  return context
}
