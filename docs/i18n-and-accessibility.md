# Internationalization (BG/EN) & Accessibility

This document covers the translation system — now shared by both `apps/web` and `apps/mobile` via `packages/shared/src/i18n.ts` — and the colorblind-friendly accessibility mode (`apps/web/hooks/useAccessibility.ts`, web only). Web's locale handling is cookie/SSR-aware by design — read the architecture section before changing it, since this is the exact area where a previous version of this template had a real hydration bug (see `docs/CHANGELOG.md`).

---

## Adding or editing a translated string

Every string lives in one place: **`packages/shared/src/i18n.ts`** — not `apps/web/lib/i18n/dictionaries.ts`, which is now just a thin re-export (`export {LOCALES, LOCALE_COOKIE, isLocale, LANGUAGE_META, dictionaries, tFormat} from '@workspace/shared'`) kept around so every existing `from '@/lib/i18n/dictionaries'` import across `apps/web` keeps working unchanged. Add a string in `packages/shared`, and both apps see it — `apps/mobile`'s `useI18n()` imports the exact same `dictionaries` export, it isn't a separate copy.

There are no parallel `en`/`bg` objects to keep in sync — each string is written once, with both languages side by side:

```ts
const strings = {
    common: {
        save: {en: 'Save', bg: 'Запази'},
        cancel: {en: 'Cancel', bg: 'Отказ'},
    },
    // ...
} satisfies StringTree
```

To add a new string:

1. Find the namespace it belongs to (`common`, `nav`, `status`, `errors`, `ai`, `auth`, `home`, `dashboard`, `settings`, `profile`, `features`, `upload`, `modal`, `speech`, `export`, `accessibility`, ...) — or add a new namespace if none fits.
2. Add `myKey: {en: '...', bg: '...'}` on its own line.
3. That's it. TypeScript's `satisfies StringTree` check flags it **immediately, at that exact line**, if either language is missing — there is nothing else to update, no second file to remember.

For a string with a dynamic value (a username, a count, a date), write a `{placeholder}` into both translations and fill it in with `tFormat` at the call site:

```tsx
import {useI18n, tFormat} from '@/lib/i18n/provider'

const {t} = useI18n()
<p>{tFormat(t.home.welcomeBack, {name: username})}</p>
```

### Using a translated string in a component

Web:
```tsx
'use client'
import {useI18n} from '@/lib/i18n/provider'

export function MyComponent() {
    const {t, locale, setLocale} = useI18n()
    return <button>{t.common.save}</button>
}
```

Mobile — same shape, different import, from `apps/mobile/hooks/useI18n.tsx`:
```tsx
import {useI18n} from '../hooks/useI18n'

export function MyComponent() {
  const {t, locale, setLocale} = useI18n()
  return <Text>{t.common.save}</Text>
}
```

Both only work inside a component that renders under their respective `I18nProvider` — web's wraps the whole app in `app/layout.tsx`; mobile's wraps the whole app in `app/_layout.tsx`. Both throw a clear error if called outside that tree.

### Mobile-only strings

A handful of strings exist for copy that has no web equivalent — mobile's stricter sign-in gates (e.g. `ai.signInRequired`, `dashboard.signInRequired`, framed as "no account at all" rather than web's "sign in to save your history"), a generic `common.signIn` label (web only has `common.login`, worded differently), and a few `mobile`-namespaced strings for screens with no web counterpart (the Home tab's placeholder copy). Add new mobile-only strings the same way as any other string — in the most fitting existing namespace, a new one only if nothing fits — they live in the same `packages/shared/src/i18n.ts` file, just unused by `apps/web`.

### What's intentionally **not** translated

The `/features` showcase page is a kitchen-sink catalog of every UI component in the template. Its page chrome (hero, tabs, card titles/descriptions, feature bullet lists) is translated, but the deeply-nested *interactive widget demo content* — accordion/alert-dialog/table/calendar/command-palette sample copy, which is mostly verbatim shadcn/ui upstream documentation examples, plus joke/seed data and literal code snippets — is left in English. That's demonstration filler, not real UI, and translating it wouldn't help anyone evaluating the template. Don't feel obligated to match that pattern when translating your own new pages.

---

## Architecture: why locale is a cookie, not just localStorage (web)

This is the part worth understanding before touching `apps/web/lib/i18n/provider.tsx` or `apps/web/app/layout.tsx`. Mobile doesn't have this problem (and doesn't need the cookie trick) — there's no SSR render to agree with, so `apps/mobile/hooks/useI18n.tsx` just persists to `AsyncStorage` and reads it back in a `useEffect` on mount, same as any other mobile preference.

**The bug this avoids:** the server has no access to `localStorage`, so if the active locale were only ever read from `localStorage` on the client, the server would always render the default language (`en`) while a returning visitor's browser immediately re-renders in their saved language (say, `bg`) on hydration. React detects the mismatch between the server-sent HTML and what the client computes on its first render pass and throws a hydration error, discarding and re-rendering the whole tree. This is exactly what happened before this was fixed — every single translated string on every page mismatched for any visitor who wasn't using the default locale.

**The fix:** the locale preference lives in a cookie (`locale`), not just `localStorage`.

- `app/layout.tsx` is a **Server Component**. It calls `cookies()` from `next/headers`, reads the `locale` cookie, and renders `<html lang={locale}>` plus `<I18nProvider initialLocale={locale}>` directly from that value.
- `I18nProvider` (in `lib/i18n/provider.tsx`, a client module) initializes its React state from that `initialLocale` prop — **not** from `localStorage` — so the client's very first render already matches exactly what the server sent. No mismatch, and (as a bonus over the old approach) no flash of the wrong language either.
- `setLocale()` writes the new value to the cookie (so the *next* request from this browser renders correctly server-side too) and updates `document.documentElement.lang` directly.
- A one-time migration effect in `I18nProvider` checks `localStorage` for visitors who only have the old pre-cookie preference, and promotes it to a cookie on their next visit.

`isLocale()` and the `LOCALE_COOKIE` name live in `packages/shared/src/i18n.ts` (re-exported through `apps/web/lib/i18n/dictionaries.ts`), **not** in `provider.tsx`, even though they're clearly i18n-provider-shaped helpers. That's deliberate: `provider.tsx` has `'use client'` at the top, and a Server Component (`app/layout.tsx`) cannot call a function exported from a `'use client'` module directly — only render it as a component. Keeping these two small helpers in the plain-data, directive-free `packages/shared` module lets both the server and the client import them safely — and lets `apps/mobile` import the exact same `isLocale()` too (it uses `LOCALE_COOKIE`'s string value as its `AsyncStorage` key, just so both apps' "what does the persisted value look like" stay conceptually aligned, not because mobile has an actual cookie).

**Trade-off:** calling `cookies()` in the root layout is a dynamic API, which forces every route in the app to be dynamically (server-)rendered instead of statically prerendered — that's an App Router constraint, not something this template chose. Every page here is already client-side/auth-gated and personalized, so the practical cost is small, but if you're chasing static-export performance, know that this is the reason you won't get it with this i18n setup in place.

### The same pattern applies to colorblind mode — but accepts a tiny flash instead

`hooks/useAccessibility.ts` has the identical risk (its boolean state is read directly in rendered JSX — the toggle icon's class/`aria-pressed`, the Settings page's `Switch`), but there's no server-side source for that one preference (no cookie plumbing was added for it). Instead, it follows the simpler, standard "theme flash" pattern already used elsewhere in this codebase for dark mode: the state always starts at the server-matched default (`false`), and a `useEffect` corrects it from `localStorage` right after mount. That's a one-frame, purely cosmetic flash for a single icon/switch — not a hydration error — and is the accepted trade-off for a preference that isn't worth the cookie plumbing. The actual CSS color remapping (the `.colorblind` class on `<html>`) still applies before paint via the inline script in `app/layout.tsx`, so there's no flash of the *wrong colors* — just a brief moment where that one toggle hasn't visually caught up yet.

If you add a new persisted, visually-rendered preference of your own, default to the colorblind-mode pattern (simple, one `useEffect`, accepts a tiny flash) unless the flash is genuinely unacceptable for that specific feature — in which case, follow the locale/cookie pattern instead.

---

## Colorblind-friendly mode (web only)

Not ported to `apps/mobile` yet — there's no equivalent toggle or color remapping there. `apps/web/hooks/useAccessibility.ts` exposes:

```typescript
interface UseAccessibilityReturn {
  colorblindMode: boolean
  setColorblindMode: (enabled: boolean) => void
  toggleColorblindMode: () => void
}
```

Toggling it adds/removes a `.colorblind` class on `<html>` (persisted to `localStorage`, read back on the next visit). `app/globals.css` defines what that class actually changes:

- `--success` and `--destructive` are remapped from the usual green/red to a **blue/amber** pairing — red/green is the one pairing a large share of colorblind users can't reliably distinguish; blue/amber is a well-established colorblind-safe substitute.
- `--border` (and `--input`) are darkened to clear the WCAG 1.4.11 non-text contrast minimum (3:1), per WebAIM guidance — the default border is intentionally subtle for aesthetics and doesn't meet that bar on its own.

Both overrides are defined for light and dark mode separately (`.colorblind` and `.dark.colorblind`).

**If you add a new status/success/error color somewhere**, route it through the `success` / `destructive` Tailwind tokens (`text-success`, `bg-destructive/10`, etc.) instead of hardcoding `text-emerald-500` or `text-red-500` directly — otherwise colorblind mode silently won't affect it. Also don't rely on color alone to convey status: pair it with an icon and/or a label (this template already does this everywhere — e.g. the dashboard's `CheckCircle2`/`XCircle` pairing — never just a colored dot by itself).

- `<AccessibilityToggle />` (`components/accessibility-toggle.tsx`) — icon-button toggle in the desktop header. Uses lucide's `Glasses` icon (color-vision correction is literally what glasses like EnChroma do — a clearer metaphor than a generic accessibility icon).
- A `Switch` wired to the same hook also lives in the Settings page's Preferences tab.

---

## Language switcher

Web's `<LanguageToggle />` (`apps/web/components/language-toggle.tsx`) is a dropdown showing a flag + language code in its trigger, and flag + native name + a checkmark on the active option when open. It lives in the desktop header and in Settings. Mobile's `<LanguageToggle/>` (`apps/mobile/components/LanguageToggle.tsx`) is simplified to tap-to-cycle instead — a dropdown is overkill for exactly 2 locales on a phone-width header — and lives in every tab's header. `LANGUAGE_META` (now in `packages/shared/src/i18n.ts`) holds each locale's flag and native name, shared by both; these are **not** translated per-locale (a language always names itself, e.g. "Български" stays "Български" regardless of which language is currently active).

Adding a third language later means: add it to `LOCALES` and `LANGUAGE_META` in `packages/shared/src/i18n.ts`, then add its `{en: ..., bg: ..., fr: ...}` (etc.) entry to every existing string — TypeScript's `StringTree` check will immediately point out every single string missing the new language, across the whole file, so there's no risk of silently shipping a partially-translated locale. Both apps pick up the new language automatically once the dictionary compiles — `apps/mobile`'s tap-to-cycle toggle already iterates `LOCALES` generically, no mobile-side change needed beyond the dictionary itself.
