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
import type { ChatMessage } from '@workspace/shared';
import { apiFetch } from '../../lib/api-client';
import { useSession } from '../../hooks/useSession';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';

export default function AiScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setInput('');

    // Matches apps/web's useAI().sendMessage: show the user's message
    // immediately, send the prior history + new message, append the
    // reply on success, and roll the optimistic message back on failure
    // so the user can retry without losing their draft.
    const history = messages;
    const userMsg: ChatMessage = { role: 'user', parts: [{ text }] };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: history, message: text }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || t.ai.failedSendMessage);
      }

      const modelMsg: ChatMessage = { role: 'model', parts: [{ text: json.data ?? '' }] };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.generic);
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
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
        <Text style={styles.title}>{t.ai.signInRequired}</Text>
        <Text style={styles.subtitle}>{t.ai.signInRequiredDescription}</Text>
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
      <FlatList
        ref={listRef}
        style={styles.flex}
        contentContainerStyle={styles.list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.subtitle}>{t.ai.howCanIHelp}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.bubbleUser : styles.bubbleModel,
            ]}
          >
            <Text style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextModel}>
              {item.parts.map((p: { text: string }) => p.text).join('')}
            </Text>
          </View>
        )}
      />

      {sending && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t.ai.placeholder}
          placeholderTextColor={colors.mutedForeground}
          multiline
          editable={!sending}
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendButtonText}>{t.ai.send}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 10,
    },
    bubbleUser: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
    },
    bubbleModel: {
      backgroundColor: colors.secondary,
      alignSelf: 'flex-start',
    },
    bubbleTextUser: {
      color: colors.primaryForeground,
      fontSize: 15,
    },
    bubbleTextModel: {
      color: colors.secondaryForeground,
      fontSize: 15,
    },
    typingRow: {
      paddingHorizontal: 16,
      paddingBottom: 4,
      alignItems: 'flex-start',
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
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    sendButtonDisabled: {
      backgroundColor: colors.mutedForeground,
      opacity: 0.5,
    },
    sendButtonText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
