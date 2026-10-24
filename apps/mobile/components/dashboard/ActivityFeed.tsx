import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bot, Image, LogIn, MessageSquare, Trash2, UserCog, type LucideIcon } from 'lucide-react-native';
import type { AnalyticsEvent, Dictionary } from '@workspace/shared';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, tFormat } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';

interface EventConfig {
  icon: LucideIcon;
  label: (t: Dictionary) => string;
  color: (colors: ColorTokens) => string;
}

// Mirrors apps/web's ActivityFeed event-type map and labels exactly
// (t.activity.event*), just rendered with lucide-react-native instead of
// lucide-react. success/destructive events resolve through the theme; the
// rest keep the same fixed hues web uses (text-blue-500, text-violet-500,
// etc.) since those aren't theme tokens on web either.
const EVENT_CONFIG: Record<string, EventConfig> = {
  page_view: { icon: LogIn, label: (t) => t.activity.eventPageView, color: () => '#3b82f6' },
  chat_message: { icon: MessageSquare, label: (t) => t.activity.eventChatMessage, color: (c) => c.success },
  chat_created: { icon: Bot, label: (t) => t.activity.eventChatCreated, color: () => '#8b5cf6' },
  chat_deleted: { icon: Trash2, label: (t) => t.activity.eventChatDeleted, color: (c) => c.destructive },
  profile_updated: { icon: UserCog, label: (t) => t.activity.eventProfileUpdated, color: () => '#f59e0b' },
  avatar_uploaded: { icon: Image, label: (t) => t.activity.eventAvatarUploaded, color: () => '#ec4899' },
  login: { icon: LogIn, label: (t) => t.activity.eventSignedIn, color: (c) => c.success },
  logout: { icon: LogIn, label: (t) => t.activity.eventSignedOut, color: (c) => c.mutedForeground },
};

function formatTimeAgo(dateString: string, t: Dictionary): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t.activity.justNow;
  if (minutes < 60) return tFormat(t.activity.minutesAgo, { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return tFormat(t.activity.hoursAgo, { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return tFormat(t.activity.daysAgo, { n: days });
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ActivityFeedProps {
  events: AnalyticsEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.activity.recentActivity}</Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>{t.activity.noActivity}</Text>
      ) : (
        events.slice(0, 10).map((event) => {
          const config = EVENT_CONFIG[event.event_type] ?? {
            icon: MessageSquare,
            label: () => event.event_type.replace(/_/g, ' '),
            color: (c: ColorTokens) => c.mutedForeground,
          };
          const Icon = config.icon;
          const detail =
            (event.event_data as Record<string, string>)?.detail ||
            (event.event_data as Record<string, string>)?.page ||
            '';

          return (
            <View key={event.id} style={styles.row}>
              <Icon color={config.color(colors)} size={16} />
              <View style={styles.rowText}>
                <Text style={styles.label}>{config.label(t)}</Text>
                {detail ? (
                  <Text style={styles.detail} numberOfLines={1}>
                    {detail}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.time}>{formatTimeAgo(event.created_at, t)}</Text>
            </View>
          );
        })
      )}
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
      marginBottom: 10,
    },
    empty: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: 'center',
      paddingVertical: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowText: {
      flex: 1,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.foreground,
    },
    detail: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    time: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
  });
}
