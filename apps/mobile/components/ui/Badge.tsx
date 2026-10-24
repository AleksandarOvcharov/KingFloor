import { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/badge.tsx's variant names exactly.
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

export function Badge({ variant = 'default', style, children, ...props }: BadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.base, styles[`variant_${variant}`], style]} {...props}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    base: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    variant_default: {
      backgroundColor: colors.primary,
    },
    variant_secondary: {
      backgroundColor: colors.secondary,
    },
    variant_destructive: {
      backgroundColor: colors.destructive,
    },
    variant_outline: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    text: {
      fontSize: 11,
      fontWeight: '600',
    },
    text_default: { color: colors.primaryForeground },
    text_secondary: { color: colors.secondaryForeground },
    text_destructive: { color: colors.destructiveForeground },
    text_outline: { color: colors.foreground },
  });
}
