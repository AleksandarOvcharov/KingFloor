# Smooth Scrolling with Lenis

`apps/web`-only (paths below relative to `apps/web/`) — a DOM/CSS-scroll concept with no mobile equivalent; React Native's scroll views don't need this kind of library.

Physics-based inertial smooth scrolling powered by `@studio-freight/lenis` / `lenis` with nested scroll isolation and runtime controls.

---

## Overview

Lenis provides smooth scrolling across desktop browsers, synchronizing scroll animations with the display refresh rate via `requestAnimationFrame`.

### Key Features
- **Inertial Physics**: Smooth deceleration curves for mouse wheels and trackpads.
- **Scroll Isolation (`data-lenis-prevent`)**: Prevents smooth scroll interference inside nested containers (e.g. modals, code blocks, chat message feeds, map views).
- **User Preference Toggle**: Global toggle hook (`useSmoothScroll`) and header/footer switch (`SmoothScrollToggle`).
- **Automatic Disable on Native Touch**: Automatically defers to hardware touch scrolling on mobile devices to preserve touch gestures.

---

## 1. Using the `useSmoothScroll` Hook

```tsx
'use client'

import { useSmoothScroll } from '@/hooks/useSmoothScroll'

export function ScrollControls() {
  const { isEnabled, toggle, enable, disable, lenis } = useSmoothScroll()

  const handleScrollToTop = () => {
    lenis?.scrollTo(0, { duration: 1.2 })
  }

  const handleScrollToSection = (targetId: string) => {
    lenis?.scrollTo(`#${targetId}`, { offset: -80, duration: 1.5 })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className="px-3 py-1.5 rounded-lg border text-sm"
      >
        Smooth Scroll: {isEnabled ? 'ON' : 'OFF'}
      </button>

      <button
        onClick={handleScrollToTop}
        className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm"
      >
        Scroll to Top
      </button>
    </div>
  )
}
```

---

## 2. Scroll Isolation with `data-lenis-prevent`

When a nested element (such as an AI chat window, code block, or modal) has internal scrollbars, Lenis might intercept wheel events if not marked. 

Add `data-lenis-prevent` to the scrollable element:

```tsx
// Inside AI Chat or Code Viewer:
<div
  data-lenis-prevent
  className="h-[400px] overflow-y-auto p-4 border rounded-lg"
>
  {messages.map(msg => (
    <div key={msg.id}>{msg.content}</div>
  ))}
</div>
```

---

## 3. SmoothScrollToggle Component

```tsx
import { SmoothScrollToggle } from '@/components/smooth-scroll-toggle'

export function SettingsBar() {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-medium">Smooth Scrolling</p>
        <p className="text-sm text-muted-foreground">Inertial physics scroll animation</p>
      </div>
      <SmoothScrollToggle />
    </div>
  )
}
```
