import { useMemo } from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/input.tsx — same visual intent (bordered
// field, muted placeholder), native TextInput instead of <input>.
export function Input({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
  });
}
