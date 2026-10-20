import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, TOUCH_TARGET, useTheme } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Đang xử lý: hiện spinner và chặn bấm (chống double-submit) */
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.primarySoft, fg: colors.primary, border: colors.primarySoft },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: colors.border },
  };
  const { bg, fg, border } = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={fg} />
      ) : null}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  text: { fontSize: 16, fontWeight: '600' },
});
