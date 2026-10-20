import { Picker } from '@react-native-picker/picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { categoryApi } from '../../src/api/categoryApi';
import { getErrorMessage, isNotFoundError } from '../../src/api/client';
import { courseApi } from '../../src/api/courseApi';
import { AppButton } from '../../src/components/AppButton';
import { alertAsync } from '../../src/components/ConfirmDialog';
import { CourseImage } from '../../src/components/CourseImage';
import { EmptyView } from '../../src/components/EmptyView';
import { ErrorView } from '../../src/components/ErrorView';
import { FormField } from '../../src/components/FormField';
import { LoadingView } from '../../src/components/LoadingView';
import { radius, spacing, useTheme } from '../../src/theme';
import type { Category, CourseInput } from '../../src/types';
import { todayISO } from '../../src/utils/format';
import {
  hasErrors,
  isValidUrl,
  parseDuration,
  parsePrice,
  validateCourse,
  type CourseFormErrors,
  type CourseFormValues,
} from '../../src/utils/validation';

const EMPTY_VALUES: CourseFormValues = {
  title: '',
  description: '',
  instructor: '',
  categoryId: '',
  price: '',
  duration: '',
  thumbnail: '',
  trailerUrl: '',
};

/** Màn 3 — Form thêm / sửa khóa học (có param ?id= là chế độ sửa) */
export default function CourseFormScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? String(params.id) : undefined;
  const isEdit = Boolean(editId);

  const [values, setValues] = useState<CourseFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalCreatedAt, setOriginalCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // URL ảnh dùng để preview — debounce để không tải ảnh sau mỗi ký tự gõ
  const [previewUrl, setPreviewUrl] = useState('');

  // Tăng reloadKey để chạy lại effect tải dữ liệu (nút "Thử lại")
  const [reloadKey, setReloadKey] = useState(0);

  // Tải dữ liệu ban đầu: danh mục cho Picker (+ khóa học nếu đang sửa)
  useEffect(() => {
    let cancelled = false; // bỏ qua kết quả nếu người dùng đã rời màn hình
    (async () => {
      try {
        // Gọi song song GET /categories và GET /courses/{id} (chỉ khi đang sửa)
        const [categoryList, course] = await Promise.all([
          categoryApi.getAll(),
          editId ? courseApi.getById(editId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCategories(categoryList);
        if (course) {
          // Điền sẵn dữ liệu cũ vào form (number => string để hiển thị trong TextInput)
          setValues({
            title: course.title,
            description: course.description,
            instructor: course.instructor,
            categoryId: String(course.categoryId),
            price: String(course.price),
            duration: String(course.duration),
            thumbnail: course.thumbnail,
            trailerUrl: course.trailerUrl,
          });
          setPreviewUrl(course.thumbnail);
          setOriginalCreatedAt(course.createdAt);
        }
      } catch (e) {
        if (cancelled) return;
        if (isNotFoundError(e)) setNotFound(true);
        else setLoadError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, reloadKey]);

  const retryLoad = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPreviewUrl(values.thumbnail.trim()), 400);
    return () => clearTimeout(timer);
  }, [values.thumbnail]);

  /** Cập nhật 1 field và xóa lỗi của field đó */
  const setField = useCallback((key: keyof CourseFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const handleSubmit = async () => {
    if (submitting) return; // chống double-submit
    Keyboard.dismiss();
    setSubmitError(null);

    // Bước 1: kiểm tra nhanh ở client (không cần mạng) — ví dụ giá âm bị chặn ngay
    const localErrors = validateCourse(values, categories);
    if (hasErrors(localErrors)) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Bước 2: tải lại GET /categories ngay lúc submit để chắc chắn danh mục
      // vẫn tồn tại (MockAPI không có foreign key, danh mục có thể vừa bị xóa)
      const latestCategories = await categoryApi.getAll();
      setCategories(latestCategories);
      const freshErrors = validateCourse(values, latestCategories);
      if (hasErrors(freshErrors)) {
        setErrors(freshErrors);
        return;
      }

      // Bước 3: tạo body — price/duration là number, không gửi id
      const input: CourseInput = {
        title: values.title,
        description: values.description,
        instructor: values.instructor,
        categoryId: String(values.categoryId),
        price: parsePrice(values.price),
        duration: parseDuration(values.duration),
        thumbnail: values.thumbnail,
        trailerUrl: values.trailerUrl,
        // Thêm mới: ngày hôm nay; Sửa: giữ nguyên createdAt cũ
        createdAt: isEdit ? originalCreatedAt || todayISO() : todayISO(),
      };

      // Bước 4: gọi PUT (sửa) hoặc POST (thêm mới)
      if (editId) {
        await courseApi.update(editId, input);
      } else {
        await courseApi.create(input);
      }

      await alertAsync('Thành công', isEdit ? 'Đã cập nhật khóa học.' : 'Đã thêm khóa học mới.');
      router.back();
    } catch (e) {
      // Lỗi: hiện thông báo, giữ nguyên dữ liệu đã nhập để người dùng thử lại
      const message = getErrorMessage(e);
      setSubmitError(message);
      Alert.alert('Không lưu được', message);
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit ? 'Sửa khóa học' : 'Thêm khóa học';
  const header = <Stack.Screen options={{ title }} />;

  if (loading) return (<>{header}<LoadingView message="Đang tải biểu mẫu..." /></>);
  if (notFound) {
    return (
      <>
        {header}
        <EmptyView
          icon="alert-circle-outline"
          title="Không tìm thấy khóa học"
          message="Khóa học cần sửa không tồn tại hoặc đã bị xóa."
          actionTitle="Quay lại"
          onAction={() => router.back()}
        />
      </>
    );
  }
  if (loadError) return (<>{header}<ErrorView message={loadError} onRetry={retryLoad} /></>);

  const showPreview = isValidUrl(previewUrl);

  return (
    <>
      {header}
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submitError ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
              <Text style={{ color: colors.danger }}>Lỗi: {submitError}</Text>
            </View>
          ) : null}

          <FormField
            label="Tên khóa học"
            required
            value={values.title}
            onChangeText={(t) => setField('title', t)}
            placeholder="VD: Lập trình React Native"
            error={errors.title}
          />
          <FormField
            label="Mô tả"
            required
            multiline
            value={values.description}
            onChangeText={(t) => setField('description', t)}
            placeholder="Nội dung chính của khóa học"
            error={errors.description}
          />
          <FormField
            label="Giảng viên"
            required
            value={values.instructor}
            onChangeText={(t) => setField('instructor', t)}
            placeholder="VD: Nguyễn Văn A"
            error={errors.instructor}
          />

          {/* Picker danh mục: dữ liệu lấy từ GET /categories */}
          <FormField label="Danh mục" required error={errors.categoryId}>
            <Picker
              selectedValue={values.categoryId}
              onValueChange={(v) => setField('categoryId', String(v))}
              style={{ color: colors.text }}
              dropdownIconColor={colors.textSecondary}
              prompt="Chọn danh mục"
            >
              <Picker.Item label="-- Chọn danh mục --" value="" color={colors.placeholder} />
              {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={String(c.id)} />
              ))}
            </Picker>
          </FormField>
          {categories.length === 0 ? (
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Chưa có danh mục nào. Hãy tạo danh mục ở tab “Danh mục” trước.
            </Text>
          ) : null}

          <View style={styles.row}>
            <View style={styles.flex}>
              <FormField
                label="Học phí (VNĐ)"
                required
                keyboardType="numeric"
                value={values.price}
                onChangeText={(t) => setField('price', t)}
                placeholder="0 = miễn phí"
                error={errors.price}
              />
            </View>
            <View style={styles.flex}>
              <FormField
                label="Thời lượng (giờ)"
                required
                keyboardType="numeric"
                value={values.duration}
                onChangeText={(t) => setField('duration', t)}
                placeholder="VD: 30"
                error={errors.duration}
              />
            </View>
          </View>

          <FormField
            label="URL ảnh bìa"
            required
            value={values.thumbnail}
            onChangeText={(t) => setField('thumbnail', t)}
            placeholder="https://..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={errors.thumbnail}
          />
          {/* Preview ảnh ngay khi URL hợp lệ; tải lỗi => hiện thông báo trong khung */}
          {showPreview ? (
            <View style={[styles.preview, { borderColor: colors.border }]}>
              <CourseImage uri={previewUrl} errorText="Không tải được ảnh từ URL này" />
            </View>
          ) : null}

          <FormField
            label="URL trailer (MP4 hoặc YouTube)"
            required
            value={values.trailerUrl}
            onChangeText={(t) => setField('trailerUrl', t)}
            placeholder="https://...mp4 hoặc https://youtu.be/..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={errors.trailerUrl}
          />

          {hasErrors(errors) ? (
            <Text style={[styles.note, { color: colors.danger }]}>
              Vui lòng kiểm tra lại các trường được đánh dấu đỏ.
            </Text>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title="Hủy"
              variant="ghost"
              style={styles.flex}
              disabled={submitting}
              onPress={() => router.back()}
            />
            <AppButton
              title={submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm khóa học'}
              icon="checkmark"
              style={styles.flex2}
              loading={submitting}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  row: { flexDirection: 'row', gap: spacing.md },
  preview: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  note: { fontSize: 13, marginTop: -spacing.sm, marginBottom: spacing.lg },
  errorBox: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
