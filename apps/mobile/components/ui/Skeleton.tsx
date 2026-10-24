import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

// Mirrors packages/ui/src/ui/skeleton.tsx's `animate-pulse` with an RN
// Animated loop instead of a CSS keyframe.
export function Skeleton({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, { opacity }, style]} {...props} />;
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    base: {
      borderRadius: 8,
      backgroundColor: colors.mutedForeground,
    },
  });
}
