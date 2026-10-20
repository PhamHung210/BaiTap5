import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, TOUCH_TARGET, useTheme } from '../theme';

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Chip lọc danh mục trên màn danh sách khóa học */
export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TOUCH_TARGET - 6,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
});
