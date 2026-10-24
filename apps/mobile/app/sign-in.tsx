import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { loginSchema } from '@workspace/shared';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import type { ColorTokens } from '../lib/theme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid email or password');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword(result.data);
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // profile.tsx's onAuthStateChange listener picks up the new session
    // and refetches the profile automatically once we go back to it.
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.label}>{t.auth.email}</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={!loading}
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={styles.label}>{t.auth.password}</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        editable={!loading}
        placeholderTextColor={colors.mutedForeground}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>{t.common.signIn}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      justifyContent: 'center',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedForeground,
      marginBottom: 6,
      marginTop: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.card,
    },
    error: {
      color: colors.destructive,
      fontSize: 13,
      marginTop: 16,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
