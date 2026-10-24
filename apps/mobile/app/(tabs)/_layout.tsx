import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { BarChart3, Home, Map as MapIcon, Settings as SettingsIcon, Sparkles, User } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageToggle } from '../../components/LanguageToggle';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.foreground },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LanguageToggle />
            <ThemeToggle />
          </View>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.common.home,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: t.dashboard.aiChat,
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.common.dashboard,
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t.common.map,
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.settings.tabProfile,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.common.settings,
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
