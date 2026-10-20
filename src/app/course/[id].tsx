import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { categoryApi } from '../../src/api/categoryApi';
import { getErrorMessage, isNotFoundError } from '../../src/api/client';
import { courseApi } from '../../src/api/courseApi';
import { AppButton } from '../../src/components/AppButton';
import { alertAsync, confirmAsync } from '../../src/components/ConfirmDialog';
import { CourseImage } from '../../src/components/CourseImage';
import { EmptyView } from '../../src/components/EmptyView';
import { ErrorView } from '../../src/components/ErrorView';
import { LoadingView } from '../../src/components/LoadingView';
import { radius, spacing, useTheme } from '../../src/theme';
import type { Category, Course } from '../../src/types';
import { formatDate, formatDuration, formatPrice } from '../../src/utils/format';

/** Màn 2 — Chi tiết khóa học */
export default function CourseDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = String(id ?? '');

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        // Gọi song song GET /courses/{id} và GET /categories
        const [courseData, categoryList] = await Promise.all([
          courseApi.getById(courseId),
          categoryApi.getAll(),
        ]);
        setCourse(courseData);
        setCategories(categoryList);
        setNotFound(false);
        setError(null);
      } catch (e) {
        // 404 => khóa học không tồn tại hoặc đã bị xóa
        if (isNotFoundError(e)) {
          setNotFound(true);
          setCourse(null);
        } else {
          setError(getErrorMessage(e));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [courseId]
  );

  // Tải lại mỗi khi quay về màn này (ví dụ sau khi sửa ở màn form)
  useFocusEffect(
    useCallback(() => {
      load(hasLoadedRef.current ? 'silent' : 'initial');
      hasLoadedRef.current = true;
    }, [load])
  );

  const handleDelete = useCallback(async () => {
    if (!course || deleting) return;
    const ok = await confirmAsync({
      title: 'Xóa khóa học',
      message: `Bạn chắc chắn muốn xóa khóa học "${course.title}"?`,
      confirmText: 'Xóa',
      destructive: true,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      // DELETE /courses/{id}
      await courseApi.remove(course.id);
      await alertAsync('Thành công', 'Đã xóa khóa học.');
      // Quay lại danh sách — màn danh sách tự refetch khi được focus
      router.back();
    } catch (e) {
      if (isNotFoundError(e)) {
        await alertAsync('Thông báo', 'Khóa học này đã bị xóa trước đó.');
        router.back();
      } else {
        Alert.alert('Xóa thất bại', getErrorMessage(e));
      }
    } finally {
      setDeleting(false);
    }
  }, [course, deleting]);

  const header = <Stack.Screen options={{ title: 'Chi tiết khóa học' }} />;

  if (loading && !course) return (<>{header}<LoadingView /></>);

  if (notFound) {
    return (
      <>
        {header}
        <EmptyView
          icon="alert-circle-outline"
          title="Không tìm thấy khóa học"
          message="Khóa học này không tồn tại hoặc đã bị xóa."
          actionTitle="Quay lại danh sách"
          onAction={() => router.back()}
        />
      </>
    );
  }

  if (error && !course) return (<>{header}<ErrorView message={error} onRetry={() => load('initial')} /></>);
  if (!course) return header;

  // Tra tên danh mục từ categoryId (so sánh String === String)
  const category = categories.find((c) => String(c.id) === String(course.categoryId));
  const hasTrailer = course.trailerUrl.trim() !== '';

  return (
    <>
      {header}
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <CourseImage uri={course.thumbnail} errorText="Không tải được ảnh bìa" />

        <View style={styles.body}>
          <View style={[styles.badge, { backgroundColor: category ? colors.primarySoft : colors.dangerSoft }]}>
            <Text style={[styles.badgeText, { color: category ? colors.primary : colors.danger }]}>
              {category ? category.name : 'Danh mục không tồn tại'}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{course.title}</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InfoRow icon="person-outline" label="Giảng viên" value={course.instructor} />
            <InfoRow
              icon="pricetag-outline"
              label="Học phí"
              value={formatPrice(course.price)}
              valueColor={course.price <= 0 ? colors.success : colors.primary}
            />
            <InfoRow icon="time-outline" label="Thời lượng" value={formatDuration(course.duration)} />
            <InfoRow icon="calendar-outline" label="Ngày tạo" value={formatDate(course.createdAt)} last />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{course.description}</Text>

          <View style={styles.actions}>
            <AppButton
              title={hasTrailer ? 'Xem trailer' : 'Chưa có trailer'}
              icon="play-circle"
              disabled={!hasTrailer}
              onPress={() =>
                router.push({ pathname: '/trailer', params: { url: course.trailerUrl, title: course.title } })
              }
            />
            <View style={styles.actionRow}>
              <AppButton
                title="Sửa"
                icon="create-outline"
                variant="secondary"
                style={styles.flex}
                disabled={deleting}
                onPress={() => router.push({ pathname: '/course/form', params: { id: course.id } })}
              />
              <AppButton
                title="Xóa"
                icon="trash-outline"
                variant="danger"
                style={styles.flex}
                loading={deleting}
                onPress={handleDelete}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}

function InfoRow({ icon, label, value, valueColor, last }: InfoRowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.md },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 29 },
  infoCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 50, paddingVertical: spacing.sm },
  infoLabel: { fontSize: 15, width: 92 },
  infoValue: { flex: 1, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: spacing.sm },
  description: { fontSize: 15, lineHeight: 23 },
  actions: { gap: spacing.md, marginTop: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
