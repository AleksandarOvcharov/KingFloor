import { useMemo } from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/separator.tsx.
export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ orientation = 'horizontal', style, ...props }: SeparatorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[orientation === 'horizontal' ? styles.horizontal : styles.vertical, style]} {...props} />;
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    horizontal: {
      height: 1,
      width: '100%',
      backgroundColor: colors.border,
    },
    vertical: {
      width: 1,
      height: '100%',
      backgroundColor: colors.border,
    },
  });
}
