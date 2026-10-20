import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { stateStyles as styles } from './stateStyles';

/** Trạng thái đang tải */
export function LoadingView({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}
