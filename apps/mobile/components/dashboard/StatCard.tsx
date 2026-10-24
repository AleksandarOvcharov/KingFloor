import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTokens } from '../../lib/theme';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle: string;
}

export function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Icon color={colors.primary} size={16} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      flexBasis: '48%',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    value: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      marginTop: 8,
    },
    subtitle: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });
}
