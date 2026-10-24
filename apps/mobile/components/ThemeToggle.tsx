import { Pressable, StyleSheet } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, colors, toggle } = useTheme();

  return (
    <Pressable onPress={toggle} style={styles.button} hitSlop={8}>
      {theme === 'dark' ? <Moon color={colors.foreground} size={20} /> : <Sun color={colors.foreground} size={20} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
  },
});
