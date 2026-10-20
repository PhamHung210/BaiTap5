import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { useTheme } from '../theme';
import { AppButton } from './AppButton';
import { stateStyles as styles } from './stateStyles';

interface EmptyViewProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
}

/** Trạng thái danh sách rỗng */
export function EmptyView({ title, message, icon = 'file-tray-outline', actionTitle, onAction }: EmptyViewProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} variant="secondary" onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}
