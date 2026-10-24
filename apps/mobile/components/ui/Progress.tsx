import { useMemo } from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/progress.tsx: a track + filled indicator
// sized by `value` (0-100).
export interface ProgressProps extends ViewProps {
  value?: number;
}

export function Progress({ value = 0, style, ...props }: ProgressProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={[styles.track, style]} {...props}>
      <View style={[styles.indicator, { width: `${clamped}%` }]} />
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    track: {
      height: 8,
      width: '100%',
      borderRadius: 999,
      backgroundColor: colors.secondary,
      overflow: 'hidden',
    },
    indicator: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
  });
}
