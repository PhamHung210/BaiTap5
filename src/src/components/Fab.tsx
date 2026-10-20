import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../theme';

/** Nút nổi (Floating Action Button) góc dưới phải */
export function Fab({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: pressed ? colors.primaryPressed : colors.primary, shadowColor: colors.primary },
      ]}
    >
      <Ionicons name="add" size={30} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
