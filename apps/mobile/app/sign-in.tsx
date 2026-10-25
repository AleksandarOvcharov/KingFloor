import { useMemo, useRef, useState } from 'react';
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
import { signInWithOAuth, type OAuthProvider } from '../lib/oauth';
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
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.errors.validation);
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

  const handleOAuth = async (provider: OAuthProvider) => {
    if (loading || oauthLoading) return;
    setError(null);
    setOauthLoading(provider);
    const { error: oauthError } = await signInWithOAuth(provider);
    setOauthLoading(null);
    if (oauthError) {
      setError(oauthError);
      return;
    }
    // setSession() inside signInWithOAuth fires onAuthStateChange itself;
    // if the user dismissed the browser instead, there's no session yet
    // and we simply stay on this screen.
    const { data } = await supabase.auth.getSession();
    if (data.session) router.back();
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
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!loading && !oauthLoading}
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={styles.label}>{t.auth.password}</Text>
      <TextInput
        ref={passwordRef}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
        editable={!loading && !oauthLoading}
        placeholderTextColor={colors.mutedForeground}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading || !!oauthLoading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading || !!oauthLoading, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>{t.common.signIn}</Text>
        )}
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t.auth.orContinueWith}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.oauthRow}>
        <Pressable
          style={styles.oauthButton}
          onPress={() => handleOAuth('google')}
          disabled={loading || !!oauthLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: loading || !!oauthLoading, busy: oauthLoading === 'google' }}
        >
          {oauthLoading === 'google' ? (
            <ActivityIndicator color={colors.foreground} size="small" />
          ) : (
            <Text style={styles.oauthButtonText}>Google</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.oauthButton}
          onPress={() => handleOAuth('github')}
          disabled={loading || !!oauthLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue with GitHub"
          accessibilityState={{ disabled: loading || !!oauthLoading, busy: oauthLoading === 'github' }}
        >
          {oauthLoading === 'github' ? (
            <ActivityIndicator color={colors.foreground} size="small" />
          ) : (
            <Text style={styles.oauthButtonText}>GitHub</Text>
          )}
        </Pressable>
      </View>
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
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 11,
      textTransform: 'uppercase',
      color: colors.mutedForeground,
    },
    oauthRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    oauthButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    oauthButtonText: {
      color: colors.foreground,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
