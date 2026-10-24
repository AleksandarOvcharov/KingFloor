import { useMemo, useState } from 'react';
import { View, Image, Text, StyleSheet, type ViewProps, type ImageProps, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/avatar.tsx's Avatar/AvatarImage/AvatarFallback
// compound shape — RN has no automatic image-load-failure fallback like
// Radix's Avatar, so AvatarImage reports load failure up via onError and
// the screen is expected to swap to AvatarFallback itself (see Settings
// screen for the pattern), same as how web's Avatar actually behaves.
export function Avatar({ style, ...props }: ViewProps) {
  const styles = useMemo(() => createStyles(null), []);
  return <View style={[styles.base, style]} {...props} />;
}

export function AvatarImage({ style, ...props }: ImageProps) {
  const styles = useMemo(() => createStyles(null), []);
  return <Image style={[styles.image, style]} {...props} />;
}

export function AvatarFallback({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.fallback, style]} {...props}>
      {typeof children === 'string' ? <Text style={styles.fallbackText}>{children}</Text> : children}
    </View>
  );
}

// Convenience: load-with-fallback in one component, since RN needs the
// onError wiring that Radix's Avatar does internally.
export function AvatarWithFallback({
  uri,
  fallback,
  size = 40,
}: {
  uri?: string | null;
  fallback: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = uri && !failed;

  return (
    <Avatar style={{ width: size, height: size }}>
      {showImage ? (
        <AvatarImage source={{ uri }} onError={() => setFailed(true)} />
      ) : (
        <AvatarFallback>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}

function createStyles(colors: ColorTokens | null) {
  return StyleSheet.create({
    base: {
      width: 40,
      height: 40,
      borderRadius: 999,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors?.muted,
    },
    fallbackText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors?.mutedForeground,
    },
  });
}
