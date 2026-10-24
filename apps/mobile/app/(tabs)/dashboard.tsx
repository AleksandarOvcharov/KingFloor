import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Activity, Bot, MessageSquare, Send } from 'lucide-react-native';
import { useSession } from '../../hooks/useSession';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';
import { StatCard } from '../../components/dashboard/StatCard';
import { ActivityChart } from '../../components/dashboard/ActivityChart';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';

export default function DashboardScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { stats, loading: statsLoading, refreshStats } = useDashboardStats();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (session) refreshStats();
  }, [session, refreshStats]);

  if (sessionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>{t.dashboard.signInRequired}</Text>
        <Text style={styles.subtitle}>{t.dashboard.signInRequiredDescription}</Text>
        <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
          <Text style={styles.buttonText}>{t.common.signIn}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={statsLoading} onRefresh={refreshStats} tintColor={colors.primary} />
      }
    >
      <View style={styles.statsGrid}>
        <StatCard
          title={t.dashboard.statConversations}
          value={stats?.totalConversations ?? 0}
          icon={MessageSquare}
          subtitle={t.dashboard.statConversationsSubtitle}
        />
        <StatCard
          title={t.dashboard.statMessagesSent}
          value={stats?.userMessages ?? 0}
          icon={Send}
          subtitle={t.dashboard.statMessagesSentSubtitle}
        />
        <StatCard
          title={t.dashboard.statAiResponses}
          value={stats?.modelMessages ?? 0}
          icon={Bot}
          subtitle={t.dashboard.statAiResponsesSubtitle}
        />
        <StatCard
          title={t.dashboard.statTotalActivity}
          value={stats?.recentEvents?.length ?? 0}
          icon={Activity}
          subtitle={t.dashboard.statTotalActivitySubtitle}
        />
      </View>

      <ActivityChart data={stats?.dailyMessages ?? []} />
      <ActivityFeed events={stats?.recentEvents ?? []} />
    </ScrollView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 32,
      marginTop: 20,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
  });
}
