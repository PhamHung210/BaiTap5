import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { categoryApi } from '../../src/api/categoryApi';
import { getErrorMessage } from '../../src/api/client';
import { courseApi } from '../../src/api/courseApi';
import { AppButton } from '../../src/components/AppButton';
import { confirmAsync } from '../../src/components/ConfirmDialog';
import { EmptyView } from '../../src/components/EmptyView';
import { ErrorView } from '../../src/components/ErrorView';
import { Fab } from '../../src/components/Fab';
import { FormField } from '../../src/components/FormField';
import { LoadingView } from '../../src/components/LoadingView';
import { useCategories } from '../../src/hooks/useCategories';
import { radius, spacing, TOUCH_TARGET, useTheme } from '../../src/theme';
import type { Category } from '../../src/types';
import {
  hasErrors,
  validateCategory,
  type CategoryFormErrors,
  type CategoryFormValues,
} from '../../src/utils/validation';

/** Màn 4 — Quản lý danh mục */
export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { categories, courseCountMap, loading, refreshing, error, refetch, retry, reload } = useCategories();

  // State của Modal form thêm/sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormValues>({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [saving, setSaving] = useState(false);
  // id danh mục đang kiểm tra/xóa (hiện spinner trên đúng dòng đó)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormErrors({});
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((category: Category) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description });
    setFormErrors({});
    setModalVisible(true);
  }, []);

  const closeModal = () => {
    if (!saving) setModalVisible(false);
  };

  const handleSave = async () => {
    if (saving) return;
    // Kiểm tra nhanh với danh sách đang có
    const localErrors = validateCategory(form, categories, editing?.id);
    if (hasErrors(localErrors)) {
      setFormErrors(localErrors);
      return;
    }

    setSaving(true);
    try {
      // Tải lại danh mục mới nhất để kiểm tra trùng tên chính xác (có thể người khác vừa thêm)
      const latest = await categoryApi.getAll();
      const freshErrors = validateCategory(form, latest, editing?.id);
      if (hasErrors(freshErrors)) {
        setFormErrors(freshErrors);
        return;
      }

      if (editing) {
        // PUT /categories/{id}
        await categoryApi.update(editing.id, form);
      } else {
        // POST /categories
        await categoryApi.create(form);
      }
      setModalVisible(false);
      Alert.alert('Thành công', editing ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục mới.');
      reload();
    } catch (e) {
      Alert.alert('Không lưu được', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Xóa có ràng buộc (MockAPI không có foreign key nên phải kiểm tra ở client):
   * 1. Gọi lại GET /courses để có dữ liệu mới nhất
   * 2. Đếm khóa học có categoryId === category.id
   * 3. > 0 => chặn, KHÔNG gọi DELETE; = 0 => xác nhận rồi DELETE /categories/{id}
   */
  const handleDelete = async (category: Category) => {
    if (deletingId) return;
    setDeletingId(category.id);
    try {
      const latestCourses = await courseApi.getAll();
      const count = latestCourses.filter((c) => String(c.categoryId) === String(category.id)).length;

      if (count > 0) {
        Alert.alert(
          'Không thể xóa',
          `Không thể xóa: danh mục đang có ${count} khóa học. Hãy chuyển hoặc xóa các khóa học này trước.`
        );
        reload(); // cập nhật lại số khóa học hiển thị
        return;
      }

      const ok = await confirmAsync({
        title: 'Xóa danh mục',
        message: `Bạn chắc chắn muốn xóa danh mục "${category.name}"?`,
        confirmText: 'Xóa',
        destructive: true,
      });
      if (!ok) return;

      await categoryApi.remove(category.id);
      Alert.alert('Thành công', `Đã xóa danh mục "${category.name}".`);
      reload();
    } catch (e) {
      Alert.alert('Xóa thất bại', getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && categories.length === 0) return <LoadingView message="Đang tải danh mục..." />;
  if (error && categories.length === 0) return <ErrorView message={error} onRetry={retry} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <Pressable onPress={refetch} style={[styles.banner, { backgroundColor: colors.dangerSoft }]}>
          <Text style={{ color: colors.danger, fontSize: 13 }}>Không cập nhật được: {error}. Chạm để thử lại.</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.count, { color: colors.textSecondary }]}>{categories.length} danh mục</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, categories.length === 0 && { flexGrow: 1 }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyView
            icon="grid-outline"
            title="Chưa có danh mục nào"
            message="Bấm nút + để tạo danh mục đầu tiên."
            actionTitle="Thêm danh mục"
            onAction={openCreate}
          />
        }
        renderItem={({ item }) => {
          const count = courseCountMap[String(item.id)] ?? 0;
          const isDeleting = deletingId === item.id;
          return (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={[styles.countBadge, { backgroundColor: count > 0 ? colors.primarySoft : colors.surfaceAlt }]}>
                  <Text style={[styles.countText, { color: count > 0 ? colors.primary : colors.textSecondary }]}>
                    {count} khóa học
                  </Text>
                </View>
              </View>
              <IconButton icon="create-outline" color={colors.primary} label={`Sửa ${item.name}`} onPress={() => openEdit(item)} />
              {isDeleting ? (
                <View style={styles.iconButton}>
                  <ActivityIndicator color={colors.danger} />
                </View>
              ) : (
                <IconButton
                  icon="trash-outline"
                  color={colors.danger}
                  label={`Xóa ${item.name}`}
                  disabled={deletingId !== null}
                  onPress={() => handleDelete(item)}
                />
              )}
            </View>
          );
        }}
      />

      <Fab onPress={openCreate} accessibilityLabel="Thêm danh mục" />

      {/* Modal form thêm / sửa danh mục */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
            </Text>
            <FormField
              label="Tên danh mục"
              required
              value={form.name}
              onChangeText={(name) => {
                setForm((f) => ({ ...f, name }));
                setFormErrors((e) => ({ ...e, name: undefined }));
              }}
              placeholder="VD: Lập trình Mobile"
              error={formErrors.name}
              autoFocus
            />
            <FormField
              label="Mô tả"
              multiline
              value={form.description}
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
              placeholder="Không bắt buộc"
            />
            <View style={styles.sheetActions}>
              <AppButton title="Hủy" variant="ghost" style={{ flex: 1 }} disabled={saving} onPress={closeModal} />
              <AppButton
                title={editing ? 'Lưu' : 'Thêm'}
                icon="checkmark"
                style={{ flex: 1 }}
                loading={saving}
                onPress={handleSave}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function IconButton({ icon, color, label, onPress, disabled }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && { opacity: 0.5 }]}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { margin: spacing.lg, marginBottom: 0, padding: spacing.md, borderRadius: radius.md },
  count: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 14, lineHeight: 19 },
  countBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, marginTop: 4 },
  countText: { fontSize: 12, fontWeight: '700' },
  iconButton: { width: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  sheet: { borderRadius: radius.lg, padding: spacing.xl },
  sheetTitle: { fontSize: 19, fontWeight: '800', marginBottom: spacing.lg },
  sheetActions: { flexDirection: 'row', gap: spacing.md },
});
