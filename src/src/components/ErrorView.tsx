import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { useTheme } from '../theme';
import { AppButton } from './AppButton';
import { stateStyles as styles } from './stateStyles';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Trạng thái lỗi, có nút "Thử lại" để gọi lại API */
export function ErrorView({ message, onRetry, title = 'Đã có lỗi xảy ra', icon = 'cloud-offline-outline' }: ErrorViewProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={36} color={colors.danger} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry ? <AppButton title="Thử lại" icon="refresh" onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}
