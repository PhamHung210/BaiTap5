import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, TOUCH_TARGET, useTheme } from '../theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  /** Thông báo lỗi hiển thị màu đỏ ngay dưới field */
  error?: string;
  hint?: string;
  /** Truyền children để thay TextInput bằng input khác (ví dụ Picker) */
  children?: ReactNode;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, required, error, hint, children, style, multiline, ...inputProps },
  ref
) {
  const { colors } = useTheme();
  const borderColor = error ? colors.danger : colors.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>

      {children ? (
        <View style={[styles.box, { borderColor, backgroundColor: colors.surface }]}>{children}</View>
      ) : (
        <TextInput
          ref={ref}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            styles.input,
            { borderColor, backgroundColor: colors.surface, color: colors.text },
            multiline && styles.multiline,
            style,
          ]}
          {...inputProps}
        />
      )}

      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    minHeight: TOUCH_TARGET + 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  multiline: { minHeight: 110, paddingTop: spacing.md },
  box: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden', minHeight: TOUCH_TARGET + 4, justifyContent: 'center' },
  error: { marginTop: 4, fontSize: 13 },
  hint: { marginTop: 4, fontSize: 12 },
});
