import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../hooks/useSession';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, tFormat } from '../../hooks/useI18n';
import { apiFetch } from '../../lib/api-client';
import { supabase } from '../../lib/supabase';
import type { ColorTokens } from '../../lib/theme';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Separator, Switch, Badge } from '../../components/ui';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageToggle } from '../../components/LanguageToggle';

export default function SettingsScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading, updateUsername, updateBio, updateExtended, updateVisibility } = useProfile(session);
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? '');
    setBio(profile.bio ?? '');
    setDisplayName(profile.display_name ?? '');
    setLocation(profile.location ?? '');
    setWebsite(profile.website ?? '');
    setTwitter(profile.twitter_handle ?? '');
    setGithub(profile.github_handle ?? '');
  }, [profile]);

  const handleSaveUsername = async () => {
    setSavingField('username');
    const result = await updateUsername(username.trim());
    setSavingField(null);
    if (!result.success) Alert.alert(t.status.error, result.error ?? t.settings.usernameUpdateFailed);
  };

  const handleSaveBio = async () => {
    setSavingField('bio');
    const result = await updateBio(bio.trim());
    setSavingField(null);
    if (!result.success) Alert.alert(t.status.error, result.error ?? t.settings.bioUpdateFailed);
  };

  const handleSaveExtended = async () => {
    setSavingField('extended');
    const result = await updateExtended({
      display_name: displayName.trim() || null,
      location: location.trim() || null,
      website: website.trim() || null,
      twitter_handle: twitter.trim() || null,
      github_handle: github.trim() || null,
    });
    setSavingField(null);
    if (!result.success) Alert.alert(t.status.error, result.error ?? t.settings.profileInfoUpdateFailed);
  };

  const handleToggleVisibility = async (value: boolean) => {
    const result = await updateVisibility(value);
    if (!result.success) Alert.alert(t.status.error, result.error ?? t.settings.visibilityUpdateFailed);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t.settings.deleteConfirmTitle, t.settings.deleteAccountDescription, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.deleteMyAccount,
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const response = await apiFetch('/api/auth/delete-account', { method: 'DELETE' });
          const json = await response.json();
          if (!response.ok) {
            setDeleting(false);
            Alert.alert(t.status.error, json.error ?? 'Failed to delete account');
            return;
          }
          await supabase.auth.signOut();
          setDeleting(false);
        },
      },
    ]);
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
        <Pressable style={styles.signInButton} onPress={() => router.push('/sign-in')}>
          <Text style={styles.signInButtonText}>{t.common.signIn}</Text>
        </Pressable>
      </View>
    );
  }

  const authProvider = session.user.app_metadata?.provider ?? 'email';
  const memberSince = new Date(profile?.created_at ?? session.user.created_at).toLocaleDateString(
    locale === 'bg' ? 'bg-BG' : 'en-US',
    { month: 'long', year: 'numeric' },
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {profileLoading && !profile ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.accountCardTitle}</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: 10 }}>
              <Row label={t.auth.email} value={session.user.email ?? ''} colors={colors} />
              <Separator />
              <Row label={t.settings.authProviderLabel} value={authProvider} colors={colors} />
              <Separator />
              <Row label={t.settings.memberSinceLabel} value={memberSince} colors={colors} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.username}</CardTitle>
              <CardDescription>{t.settings.usernameCardDescription}</CardDescription>
            </CardHeader>
            <CardContent style={{ gap: 10 }}>
              <Input value={username} onChangeText={setUsername} placeholder={t.settings.usernamePlaceholder} autoCapitalize="none" />
              <Button onPress={handleSaveUsername} loading={savingField === 'username'} size="sm">
                {t.common.save}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settings.bioCardTitle}</CardTitle>
              <CardDescription>{t.settings.bioCardDescription}</CardDescription>
            </CardHeader>
            <CardContent style={{ gap: 10 }}>
              <Input
                value={bio}
                onChangeText={setBio}
                placeholder={t.settings.bioPlaceholder}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
              />
              <Button onPress={handleSaveBio} loading={savingField === 'bio'} size="sm">
                {t.settings.saveBio}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settings.extendedCardTitle}</CardTitle>
              <CardDescription>{t.settings.extendedCardDescription}</CardDescription>
            </CardHeader>
            <CardContent style={{ gap: 10 }}>
              <Field label={t.settings.displayNameLabel} value={displayName} onChangeText={setDisplayName} placeholder={t.settings.displayNamePlaceholder} />
              <Field label={t.settings.locationLabel} value={location} onChangeText={setLocation} placeholder={t.settings.locationPlaceholder} />
              <Field label={t.settings.websiteLabel} value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
              <Field label={t.settings.twitterLabel} value={twitter} onChangeText={setTwitter} autoCapitalize="none" />
              <Field label={t.settings.githubLabel} value={github} onChangeText={setGithub} autoCapitalize="none" />
              <Button onPress={handleSaveExtended} loading={savingField === 'extended'} size="sm">
                {t.settings.saveInfo}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settings.visibilityCardTitle}</CardTitle>
              <CardDescription>{t.settings.visibilityCardDescription}</CardDescription>
            </CardHeader>
            <CardContent style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>{profile?.is_public ? t.settings.publicProfile : t.settings.privateProfile}</Text>
                <Text style={styles.switchDescription}>
                  {profile?.is_public ? t.settings.publicProfileDescription : t.settings.privateProfileDescription}
                </Text>
              </View>
              <Switch value={!!profile?.is_public} onValueChange={handleToggleVisibility} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.settings.appearanceCardTitle}</CardTitle>
              <CardDescription>{t.settings.appearanceCardDescription}</CardDescription>
            </CardHeader>
            <CardContent style={{ gap: 14 }}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t.settings.darkMode}</Text>
                <ThemeToggle />
              </View>
              <Separator />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t.settings.languageDescription}</Text>
                <LanguageToggle />
              </View>
            </CardContent>
          </Card>

          <Card style={{ borderColor: colors.destructive }}>
            <CardHeader>
              <CardTitle style={{ color: colors.destructive }}>{t.settings.dangerZone}</CardTitle>
              <CardDescription>{t.settings.dangerZoneDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onPress={handleDeleteAccount} loading={deleting}>
                {t.settings.deleteAccount}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ColorTokens }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground }}>{value}</Text>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'default' | 'url';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{props.label}</Label>
      <Input
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
    title: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 },
    signInButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
    signInButtonText: { color: colors.primaryForeground, fontSize: 15, fontWeight: '600' },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground },
    switchDescription: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  });
}
