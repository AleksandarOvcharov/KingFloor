import { Pressable, Text, StyleSheet } from 'react-native';
import { LOCALES, LANGUAGE_META } from '@workspace/shared';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';

// Mirrors apps/web's LanguageToggle, simplified to a tap-to-cycle button
// (web uses a dropdown menu) since LOCALES only has two entries — a picker
// would be overkill on a phone-width header.
export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const { colors } = useTheme();
  const current = LANGUAGE_META[locale];

  const cycle = () => {
    const index = LOCALES.indexOf(locale);
    setLocale(LOCALES[(index + 1) % LOCALES.length]);
  };

  return (
    <Pressable
      onPress={cycle}
      style={styles.button}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={`Change language, currently ${current.nativeName}`}
    >
      <Text style={styles.flag}>{current.flag}</Text>
      <Text style={[styles.code, { color: colors.foreground }]}>{locale.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  flag: {
    fontSize: 16,
  },
  code: {
    fontSize: 12,
    fontWeight: '600',
  },
});
