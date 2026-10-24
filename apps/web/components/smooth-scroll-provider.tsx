'use client'

import { createContext, useEffect, useState, ReactNode } from 'react'
import Lenis from 'lenis'

export interface SmoothScrollContextType {
  isEnabled: boolean
  toggle: () => void
  enable: () => void
  disable: () => void
  setSmoothScroll: (enabled: boolean) => void
  lenis: Lenis | null
}

export const SmoothScrollContext = createContext<SmoothScrollContextType | undefined>(undefined)

interface SmoothScrollProviderProps {
  children: ReactNode
  defaultEnabled?: boolean
}

export function SmoothScrollProvider({
  children,
  defaultEnabled = true,
}: SmoothScrollProviderProps) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled)
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null)

  useEffect(() => {
    if (!isEnabled) {
      setLenisInstance(null)
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoResize: true,
      prevent: (node) => {
        return (
          node.hasAttribute('data-lenis-prevent') ||
          node.closest('[data-lenis-prevent]') !== null
        )
      },
    })

    setLenisInstance(lenis)

    let animationFrameId: number

    function raf(time: number) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    // Watch for DOM size changes (tab switching, accordions, dynamic lists) to recalculate scroll bounds
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize()
    })

    if (document.body) {
      resizeObserver.observe(document.body)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      lenis.destroy()
      setLenisInstance(null)
    }
  }, [isEnabled])

  const toggle = () => setIsEnabled((prev) => !prev)
  const enable = () => setIsEnabled(true)
  const disable = () => setIsEnabled(false)
  const setSmoothScroll = (enabled: boolean) => setIsEnabled(enabled)

  return (
    <SmoothScrollContext.Provider
      value={{
        isEnabled,
        toggle,
        enable,
        disable,
        setSmoothScroll,
        lenis: lenisInstance,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  )
}
