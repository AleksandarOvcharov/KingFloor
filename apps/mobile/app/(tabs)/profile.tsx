import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import type { UserProfile } from '@workspace/shared';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';

export default function ProfileScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Mirrors apps/web's useProfile(): fetch the `profiles` row for the
  // signed-in user once a session exists.
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data);
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  if (sessionLoading || profileLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {profile?.display_name || profile?.username || t.common.guestUser}
      </Text>
      <Text style={styles.subtitle}>
        {session ? session.user.email : t.profile.signInToSeeProfile}
      </Text>

      {session ? (
        <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.buttonText}>{t.common.logout}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
          <Text style={styles.buttonText}>{t.common.signIn}</Text>
        </Pressable>
      )}
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
  });
}
