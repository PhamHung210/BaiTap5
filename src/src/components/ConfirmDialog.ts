import { Alert } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Nút xác nhận màu đỏ (hành động phá hủy như xóa) */
  destructive?: boolean;
}

/**
 * Hiện hộp thoại xác nhận và trả về Promise<boolean>:
 * true nếu người dùng bấm xác nhận, false nếu bấm hủy / bấm ra ngoài.
 * Giúp viết code tuần tự: `if (await confirmAsync(...)) { await api.remove(...) }`
 */
export function confirmAsync({
  title,
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/** Hiện thông báo 1 nút, trả về Promise khi người dùng đóng */
export function alertAsync(title: string, message?: string): Promise<void> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }], {
      cancelable: true,
      onDismiss: () => resolve(),
    });
  });
}
