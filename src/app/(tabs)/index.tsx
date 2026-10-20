import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '../../src/components/AppButton';
import { CategoryChip } from '../../src/components/CategoryChip';
import { CourseCard } from '../../src/components/CourseCard';
import { EmptyView } from '../../src/components/EmptyView';
import { ErrorView } from '../../src/components/ErrorView';
import { Fab } from '../../src/components/Fab';
import { LoadingView } from '../../src/components/LoadingView';
import { useCourses } from '../../src/hooks/useCourses';
import { radius, spacing, TOUCH_TARGET, useTheme } from '../../src/theme';
import type { Course } from '../../src/types';
import { normalizeVN } from '../../src/utils/text';

/** Màn 1 — Danh sách khóa học */
export default function CourseListScreen() {
  const { colors } = useTheme();
  // Hook gọi song song GET /courses + GET /categories và tự refetch khi màn hình focus lại
  const { courses, categories, categoryMap, loading, refreshing, error, refetch, retry } = useCourses();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  // null = "Tất cả"
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Debounce 300ms: chỉ lọc lại sau khi người dùng ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Nếu danh mục đang chọn vừa bị xóa (không còn trong API) thì coi như đang chọn "Tất cả"
  const activeCategoryId =
    selectedCategoryId && categories.some((c) => String(c.id) === selectedCategoryId)
      ? selectedCategoryId
      : null;

  // Search + filter làm ở CLIENT trên danh sách đã tải (filter của MockAPI so khớp chuỗi, không chính xác)
  const filteredCourses = useMemo(() => {
    const keyword = normalizeVN(debouncedQuery);
    return courses.filter((course) => {
      const matchCategory =
        activeCategoryId === null || String(course.categoryId) === String(activeCategoryId);
      const matchKeyword = !keyword || normalizeVN(course.title).includes(keyword);
      return matchCategory && matchKeyword;
    });
  }, [courses, debouncedQuery, activeCategoryId]);

  const isFiltering = debouncedQuery.trim() !== '' || activeCategoryId !== null;

  const openCourse = useCallback((course: Course) => {
    router.push({ pathname: '/course/[id]', params: { id: course.id } });
  }, []);

  const openCreateForm = useCallback(() => router.push('/course/form'), []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedCategoryId(null);
  }, []);

  // ----- Các trạng thái toàn màn hình -----
  if (loading && courses.length === 0) return <LoadingView message="Đang tải danh sách khóa học..." />;
  if (error && courses.length === 0) return <ErrorView message={error} onRetry={retry} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ô tìm kiếm */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.placeholder} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm theo tên khóa học..."
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Xóa từ khóa">
              <Ionicons name="close-circle" size={20} color={colors.placeholder} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Hàng chip lọc danh mục — lấy từ API, không hardcode */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          <CategoryChip
            label="Tất cả"
            selected={activeCategoryId === null}
            onPress={() => setSelectedCategoryId(null)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              selected={activeCategoryId === String(category.id)}
              onPress={() => setSelectedCategoryId(String(category.id))}
            />
          ))}
        </ScrollView>
      </View>

      {/* Lỗi khi tải lại ngầm nhưng vẫn còn dữ liệu cũ => hiện banner nhỏ */}
      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.dangerSoft }]}>
          <Text style={[styles.bannerText, { color: colors.danger }]} numberOfLines={2}>
            Không cập nhật được: {error}
          </Text>
          <AppButton title="Thử lại" variant="ghost" onPress={refetch} style={styles.bannerButton} />
        </View>
      ) : null}

      <Text style={[styles.count, { color: colors.textSecondary }]}>{filteredCourses.length} khóa học</Text>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourseCard course={item} categoryName={categoryMap[String(item.categoryId)]} onPress={openCourse} />
        )}
        contentContainerStyle={[styles.listContent, filteredCourses.length === 0 && styles.listEmpty]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          courses.length === 0 ? (
            <EmptyView
              icon="school-outline"
              title="Chưa có khóa học nào"
              message="Bấm nút + để thêm khóa học đầu tiên."
              actionTitle="Thêm khóa học"
              onAction={openCreateForm}
            />
          ) : isFiltering ? (
            <EmptyView
              icon="search-outline"
              title="Không tìm thấy kết quả phù hợp"
              message="Thử từ khóa khác hoặc chọn danh mục khác."
              actionTitle="Xóa bộ lọc"
              onAction={clearFilters}
            />
          ) : null
        }
      />

      <Fab onPress={openCreateForm} accessibilityLabel="Thêm khóa học" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH_TARGET + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: spacing.sm },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerText: { flex: 1, fontSize: 13 },
  bannerButton: { borderWidth: 0 },
  count: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },
});
