import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { I18nProvider, useI18n } from '../hooks/useI18n';

function RootStack() {
  const { theme, colors } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="sign-in"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: t.auth.signInTitle,
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.foreground },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
