import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dictionaries, isLocale, LOCALE_COOKIE, tFormat, type Dictionary, type Locale } from '@workspace/shared';

export { tFormat };

const DEFAULT_LOCALE: Locale = 'bg';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Mirrors apps/web's I18nProvider: same dictionaries/isLocale from
// @workspace/shared, same default locale and storage key (LOCALE_COOKIE,
// just written to AsyncStorage instead of a cookie since there's no SSR
// render to match on mobile).
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_COOKIE).then((stored) => {
      if (isLocale(stored)) setLocaleState(stored);
    });
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_COOKIE, next);
  };

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
