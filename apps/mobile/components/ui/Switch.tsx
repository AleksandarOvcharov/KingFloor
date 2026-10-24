import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// RN already ships a real native Switch (unlike Button/Card/etc., there's
// no DOM/Radix primitive to re-derive from) — this just themes it to match
// packages/ui/src/ui/switch.tsx's on/off colors (primary track when
// checked, muted border when unchecked).
export function Switch({ value, onValueChange, ...props }: RNSwitchProps) {
  const { colors } = useTheme();

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.background}
      ios_backgroundColor={colors.border}
      {...props}
    />
  );
}
