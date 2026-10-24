import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.mobile.homeWelcome}</Text>
      <Text style={styles.subtitle}>{t.mobile.homeSubtitle}</Text>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
