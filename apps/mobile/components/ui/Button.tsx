import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type PressableProps, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/button.tsx's variant/size names exactly (same
// API, native markup) — cva/Tailwind can't run on React Native, so this is
// a from-scratch implementation, not a port of that file's code.
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  style,
  textStyle,
  children,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColorFor(variant, colors)} size="small" />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function textColorFor(variant: ButtonVariant, colors: ColorTokens): string {
  switch (variant) {
    case 'default':
      return colors.primaryForeground;
    case 'destructive':
      return colors.destructiveForeground;
    case 'secondary':
      return colors.secondaryForeground;
    case 'outline':
    case 'ghost':
      return colors.foreground;
    case 'link':
      return colors.primary;
  }
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 10,
    },
    pressed: {
      opacity: 0.8,
    },
    disabled: {
      opacity: 0.5,
    },
    // Variants
    variant_default: {
      backgroundColor: colors.primary,
    },
    variant_destructive: {
      backgroundColor: colors.destructive,
    },
    variant_outline: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    variant_secondary: {
      backgroundColor: colors.secondary,
    },
    variant_ghost: {
      backgroundColor: 'transparent',
    },
    variant_link: {
      backgroundColor: 'transparent',
    },
    // Sizes
    size_default: {
      height: 40,
      paddingHorizontal: 16,
    },
    size_sm: {
      height: 34,
      paddingHorizontal: 12,
    },
    size_lg: {
      height: 46,
      paddingHorizontal: 28,
    },
    size_icon: {
      height: 40,
      width: 40,
      paddingHorizontal: 0,
    },
    // Text
    text: {
      fontSize: 14,
      fontWeight: '600',
    },
    text_default: { color: colors.primaryForeground },
    text_destructive: { color: colors.destructiveForeground },
    text_outline: { color: colors.foreground },
    text_secondary: { color: colors.secondaryForeground },
    text_ghost: { color: colors.foreground },
    text_link: { color: colors.primary, textDecorationLine: 'underline' },
  });
}
