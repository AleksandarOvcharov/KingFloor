import { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import type { DailyMessageStat } from '@workspace/shared';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';

interface ActivityChartProps {
  data: DailyMessageStat[];
}

const CHART_HEIGHT = 140;
const BAR_GAP = 4;

// Mirrors apps/web's ActivityChart (Recharts), redrawn with react-native-svg
// since Recharts is DOM-based and can't render on native. Stacks sent
// (primary) under received (muted) per day, same two series as the web
// version.
export function ActivityChart({ data }: ActivityChartProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const chartWidth = width - 24 * 2 - 14 * 2; // screen padding + card padding
  const barWidth = Math.max((chartWidth - BAR_GAP * (data.length - 1)) / data.length, 2);
  const max = Math.max(1, ...data.map((d) => d.sent + d.received));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.activity.aiUsage}</Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>{t.activity.sent}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.mutedForeground }]} />
          <Text style={styles.legendLabel}>{t.activity.received}</Text>
        </View>
      </View>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {data.map((day, i) => {
          const sentHeight = (day.sent / max) * CHART_HEIGHT;
          const receivedHeight = (day.received / max) * CHART_HEIGHT;
          const x = i * (barWidth + BAR_GAP);
          return (
            <G key={day.date}>
              <Rect
                x={x}
                y={CHART_HEIGHT - sentHeight - receivedHeight}
                width={barWidth}
                height={receivedHeight}
                fill={colors.mutedForeground}
                rx={1}
              />
              <Rect
                x={x}
                y={CHART_HEIGHT - sentHeight}
                width={barWidth}
                height={sentHeight}
                fill={colors.primary}
                rx={1}
              />
            </G>
          );
        })}
      </Svg>
      <View style={styles.labelRow}>
        <Text style={styles.axisLabel}>{data[0]?.label}</Text>
        <Text style={styles.axisLabel}>{data[data.length - 1]?.label}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    title: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
    },
    legendRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    axisLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
    },
  });
}
