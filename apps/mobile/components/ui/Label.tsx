import { useMemo } from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/label.tsx's text style.
export function Label({ style, ...props }: TextProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={[styles.label, style]} {...props} />;
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
    },
  });
}
