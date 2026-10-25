import { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useSession } from '../../hooks/useSession';
import { useChat } from '../../hooks/useChat';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';
import { AvatarWithFallback } from '../../components/ui';
import type { BuildingChatMessage } from '@workspace/shared';

export default function ChatScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { messages, loading, error, sendMessage } = useChat(!!session);
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    const result = await sendMessage(body);
    setSending(false);
    if (!result.success) setDraft(body);
  };

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.subtitle}>{t.building.noMessagesYet}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble message={item} isMine={item.sender_id === session.user.id} styles={styles} locale={locale} />
          )}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t.building.chatPlaceholder}
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel={t.building.sendMessage}
        >
          {sending ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Send color={colors.primaryForeground} size={18} />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  isMine,
  styles,
  locale,
}: {
  message: BuildingChatMessage;
  isMine: boolean;
  styles: ReturnType<typeof createStyles>;
  locale: string;
}) {
  const initials = (message.sender_name || '?').substring(0, 2).toUpperCase();
  const time = new Date(message.created_at).toLocaleTimeString(locale === 'bg' ? 'bg-BG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      {!isMine && (
        <View style={styles.avatar}>
          <AvatarWithFallback uri={message.sender_avatar_url} fallback={initials} size={28} />
        </View>
      )}
      <View style={[styles.bubbleGroup, isMine && styles.bubbleGroupMine]}>
        {!isMine && <Text style={styles.senderName}>{message.sender_name ?? ''}</Text>}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextOther}>{message.body}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
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
    list: {
      padding: 16,
      flexGrow: 1,
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    rowMine: {
      flexDirection: 'row-reverse',
    },
    avatar: {
      marginBottom: 18,
    },
    bubbleGroup: {
      maxWidth: '78%',
      gap: 2,
    },
    bubbleGroupMine: {
      alignItems: 'flex-end',
    },
    senderName: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginLeft: 4,
    },
    bubble: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
    },
    bubbleOther: {
      backgroundColor: colors.secondary,
    },
    bubbleTextMine: {
      color: colors.primaryForeground,
      fontSize: 15,
    },
    bubbleTextOther: {
      color: colors.secondaryForeground,
      fontSize: 15,
    },
    time: {
      fontSize: 10,
      color: colors.mutedForeground,
      marginHorizontal: 4,
    },
    error: {
      color: colors.destructive,
      fontSize: 13,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.card,
      maxHeight: 120,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      height: 44,
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
}
