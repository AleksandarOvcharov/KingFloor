import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

// Leaflet/OpenStreetMap (apps/web/components/map/map-view.tsx) is DOM-based
// and can't run directly inside React Native — there's no react-native-maps
// here either, since that needs a custom dev client, not Expo Go. A WebView
// is a real browser, so it loads the actual web MapView component at
// apps/web/app/embed/map, reusing it instead of reimplementing the map.
export default function MapScreen() {
  const { theme, colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (!API_URL) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>EXPO_PUBLIC_API_URL is not set</Text>
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{t.errors.network}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <WebView
        // key forces a full remount (and reload) when the theme toggles —
        // the WebView is a separate browser context with its own
        // localStorage, so it has no way to know apps/mobile's theme
        // changed otherwise. See apps/web/app/embed/map/page.tsx for the
        // other half of this (reads ?theme= and applies the .dark class).
        key={theme}
        source={{ uri: `${API_URL}/embed/map?theme=${theme}` }}
        style={styles.flex}
        // Enables the web geolocation API inside the WebView for the map's
        // "my location" button. Android additionally needs a location
        // permission + onGeolocationPermissionsShowPrompt handler to grant
        // it at runtime — without that it degrades to the same "denied"
        // state the web app already handles gracefully. Search and
        // click-to-reverse-geocode work regardless, no GPS needed.
        geolocationEnabled
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.message}>{t.map.loadingInteractiveMap}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.background,
    },
    message: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center' },
  });
}
