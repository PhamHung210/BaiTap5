import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

interface CourseImageProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  /** Dòng chữ hiển thị khi ảnh lỗi */
  errorText?: string;
  onLoadResult?: (ok: boolean) => void;
}

/**
 * Ảnh bìa tải từ URL bằng expo-image (có cache bộ nhớ + đĩa).
 * Nếu URL rỗng hoặc tải lỗi => hiện khung placeholder thay vì ảnh vỡ.
 */
export function CourseImage({ uri, style, errorText, onLoadResult }: CourseImageProps) {
  const { colors } = useTheme();
  // Lưu URL bị lỗi: khi người dùng đổi sang URL khác thì tự hết trạng thái lỗi
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;

  const showPlaceholder = !uri || failed;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surfaceAlt }, style]}>
      {showPlaceholder ? (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={32} color={colors.placeholder} />
          {errorText ? (
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorText}</Text>
          ) : null}
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          onLoad={() => onLoadResult?.(true)}
          onError={() => {
            setFailedUri(uri);
            onLoadResult?.(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  errorText: { marginTop: 6, fontSize: 13, textAlign: 'center' },
});
