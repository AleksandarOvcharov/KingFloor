import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type ColorTokens, type Theme } from '../lib/theme';

const STORAGE_KEY = 'theme';

interface ThemeContextValue {
  theme: Theme;
  colors: ColorTokens;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Mirrors apps/web's useTheme(): defaults to the system color scheme, then
// an explicit toggle overrides and persists (AsyncStorage here instead of
// localStorage). A context, not a plain hook like web's, so every screen
// and the tab bar share one toggle instead of drifting independently.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else if (systemScheme) {
        setTheme(systemScheme === 'dark' ? 'dark' : 'light');
      }
    });
    // Only re-derive from the stored/system value once, on mount — a later
    // systemScheme change shouldn't fight an explicit toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(() => ({ theme, colors: palettes[theme], toggle }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
