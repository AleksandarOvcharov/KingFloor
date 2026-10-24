# Mobile & Cross-Device Responsiveness Guidelines

**This is about `apps/web`'s responsive layout on narrow browser viewports — not the Expo mobile app.** For the actual native mobile app (`apps/mobile`), see [`docs/mobile.md`](./mobile.md). All paths below are relative to `apps/web/`.

This guide details the mobile-first architecture, sub-768px layout defenses, and responsive best practices implemented in `apps/web`.

---

## Universal Viewport Standards

All pages, features, and UI components are tested and optimized to run seamlessly across all display form factors:
- **Ultra-narrow mobile**: 320px – 375px (iPhone SE, older Galaxy devices)
- **Standard mobile**: 390px – 430px (iPhone 14/15/16 Pro Max, Pixel)
- **Tablets & Foldables**: 768px – 1024px (iPad, Surface)
- **Desktop & Widescreen**: 1280px – 4K UHD (1920px+)

---

## 1. Mobile Header & Navigation Drawer (`components/header.tsx`)

### Architecture
- **Desktop (`>= 768px`)**: Inline navigation links, theme toggle, and user avatar dropdown menu.
- **Mobile (`< 768px`)**: Animated hamburger toggle with a full-width sliding drawer overlay and backdrop blur.

### Key Implementation Details
1. **Body Scroll Locking**:
   When the mobile menu opens, page background scrolling is disabled to prevent disorienting double-scroll behaviors:
   ```typescript
   useEffect(() => {
     if (mobileMenuOpen) {
       document.body.style.overflow = 'hidden'
     } else {
       document.body.style.overflow = ''
     }
     return () => {
       document.body.style.overflow = ''
     }
   }, [mobileMenuOpen])
   ```

2. **Valid HTML5 Link Styling**:
   Avoid placing `<button>` or `<Button>` inside Next.js `<Link>` components. Instead, apply `buttonVariants(...)` directly on `<Link>`:
   ```tsx
   import { buttonVariants } from '@workspace/ui/ui/button'
   import { cn } from '@/lib/utils'
   import Link from 'next/link'

   <Link
     href="/login"
     className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
   >
     Log in
   </Link>
   ```

---

## 2. Defensive Container & Card Boundaries

To prevent nested code blocks, tables, carousels, or long strings from overflowing beyond screen edges on mobile:

### 1. Enforce `max-w-full overflow-hidden` on Cards
```tsx
// components/ui/card.tsx
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm max-w-full overflow-hidden',
        className
      )}
      {...props}
    />
  )
}
```

### 2. Horizontally Scrollable Tabs & Chips
For navigation tabs, pill filters, and file headers, use touch-friendly horizontal panning:
```tsx
<div className="overflow-x-auto no-scrollbar touch-pan-x flex items-center gap-2">
  {chips.map(chip => (
    <button key={chip} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-muted">
      {chip}
    </button>
  ))}
</div>
```

---

## 3. Responsive Overlays, Modals & Sheets

When rendering dialogs, sheets, or popovers:
- **Max Width**: Use `max-w-[calc(100vw-2rem)]` or `w-[85vw]` on mobile and constrain to standard widths (`sm:max-w-lg`) on desktop.
- **Max Height & Scrolling**: Set `max-h-[85vh] sm:max-h-[90vh] overflow-y-auto` so users on small screens with virtual keyboards can scroll through long forms.
- **Lenis Smooth Scroll Isolation**: Add `data-lenis-prevent` on scrollable modal bodies to prevent wheel events from bubbling to the background page.

---

## 4. Touch Target & Accessibility Guidelines

- **Minimum Touch Targets**: Interactive buttons, icons, and switch toggles maintain a minimum interactive hit area of 36px–44px.
- **Responsive Padding Tokens**: Use responsive padding classes such as `py-8 sm:py-16` or `px-4 sm:px-6 md:px-8` to maximize usable screen real estate on mobile devices.
- **Input OTP Auto-Scaling**: Constrain OTP slot width with `w-8 sm:w-10 h-10 sm:h-12` so 6-digit codes fit within 320px screens.
