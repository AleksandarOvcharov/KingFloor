// Mirrors apps/web/app/globals.css's shadcn/ui design tokens (the :root and
// .dark HSL variables), converted to hex so React Native's StyleSheet can
// consume them directly. Keep these in sync if the web tokens ever change —
// they're deliberately not derived from Tailwind at build time since mobile
// doesn't run Tailwind.
export type Theme = 'light' | 'dark';

export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  border: string;
  ring: string;
}

const light: ColorTokens = {
  background: '#ffffff',
  foreground: '#020817',
  card: '#ffffff',
  cardForeground: '#020817',
  primary: '#2563eb',
  primaryForeground: '#f8fafc',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  accent: '#f1f5f9',
  accentForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#f8fafc',
  success: '#16a249',
  successForeground: '#f8fafc',
  border: '#e2e8f0',
  ring: '#2563eb',
};

const dark: ColorTokens = {
  background: '#020817',
  foreground: '#f8fafc',
  card: '#020817',
  cardForeground: '#f8fafc',
  primary: '#3b82f6',
  primaryForeground: '#0f172a',
  secondary: '#1e293b',
  secondaryForeground: '#f8fafc',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  accent: '#1e293b',
  accentForeground: '#f8fafc',
  destructive: '#7f1d1d',
  destructiveForeground: '#f8fafc',
  success: '#22c35d',
  successForeground: '#0f172a',
  border: '#1e293b',
  ring: '#1d4ed8',
};

export const palettes: Record<Theme, ColorTokens> = { light, dark };
