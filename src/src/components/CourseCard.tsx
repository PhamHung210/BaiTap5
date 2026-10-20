import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import type { Course } from '../types';
import { formatPrice } from '../utils/format';
import { CourseImage } from './CourseImage';

interface CourseCardProps {
  course: Course;
  /** Tên danh mục tra từ categoryMap; undefined nếu danh mục không tồn tại */
  categoryName?: string;
  onPress: (course: Course) => void;
}

function CourseCardBase({ course, categoryName, onPress }: CourseCardProps) {
  const { colors, isDark } = useTheme();
  const isFree = course.price <= 0;

  return (
    <Pressable
      onPress={() => onPress(course)}
      accessibilityRole="button"
      accessibilityLabel={`Khóa học ${course.title}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDark ? 0 : 0.06 },
        pressed && { opacity: 0.9 },
      ]}
    >
      <CourseImage uri={course.thumbnail} />
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]} numberOfLines={1}>
            {categoryName ?? 'Danh mục không tồn tại'}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={styles.row}>
          <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.instructor, { color: colors.textSecondary }]} numberOfLines={1}>
            {course.instructor}
          </Text>
        </View>
        <Text style={[styles.price, { color: isFree ? colors.success : colors.primary }]}>
          {formatPrice(course.price)}
        </Text>
      </View>
    </Pressable>
  );
}

export const CourseCard = memo(CourseCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', lineHeight: 23 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructor: { fontSize: 14, flexShrink: 1 },
  price: { fontSize: 16, fontWeight: '800', marginTop: 2 },
});
