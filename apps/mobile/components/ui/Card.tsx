import { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewProps, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/card.tsx's compound-component shape (Card +
// CardHeader/CardTitle/CardDescription/CardContent/CardFooter) with RN
// View/Text instead of div/h3/p.
export function Card({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]} {...props} />;
}

export function CardHeader({ style, ...props }: ViewProps) {
  const styles = useMemo(() => createStyles(null), []);
  return <View style={[styles.header, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={[styles.title, style]} {...props} />;
}

export function CardDescription({ style, ...props }: TextProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={[styles.description, style]} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  const styles = useMemo(() => createStyles(null), []);
  return <View style={[styles.content, style]} {...props} />;
}

export function CardFooter({ style, ...props }: ViewProps) {
  const styles = useMemo(() => createStyles(null), []);
  return <View style={[styles.footer, style]} {...props} />;
}

function createStyles(colors: ColorTokens | null) {
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors?.border ?? 'transparent',
      backgroundColor: colors?.card ?? 'transparent',
    },
    header: {
      flexDirection: 'column',
      gap: 6,
      padding: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors?.foreground,
    },
    description: {
      fontSize: 13,
      color: colors?.mutedForeground,
    },
    content: {
      padding: 16,
      paddingTop: 0,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 0,
    },
  });
}
