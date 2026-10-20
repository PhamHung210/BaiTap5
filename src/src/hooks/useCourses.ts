import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { categoryApi } from '../api/categoryApi';
import { getErrorMessage } from '../api/client';
import { courseApi } from '../api/courseApi';
import type { Category, Course } from '../types';

type LoadMode = 'initial' | 'refresh' | 'silent';

/**
 * Tải danh sách khóa học + danh mục cho màn hình danh sách.
 * - Gọi song song GET /courses và GET /categories bằng Promise.all
 * - Tự refetch mỗi khi màn hình được focus lại (sau khi thêm/sửa/xóa ở màn khác)
 */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  // Đánh số mỗi lần gọi để bỏ qua response cũ về muộn (tránh ghi đè dữ liệu mới)
  const requestIdRef = useRef(0);

  const load = useCallback(async (mode: LoadMode) => {
    const requestId = ++requestIdRef.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);

    try {
      // Gọi 2 API cùng lúc 
      const [courseList, categoryList] = await Promise.all([
        courseApi.getAll(),
        categoryApi.getAll(),
      ]);
      if (requestId !== requestIdRef.current) return;
      setCourses(courseList);
      setCategories(categoryList);
      setError(null);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Mỗi lần màn hình được focus: lần đầu hiện spinner, các lần sau tải ngầm (không nháy màn hình)
  useFocusEffect(
    useCallback(() => {
      load(hasLoadedRef.current ? 'silent' : 'initial');
      hasLoadedRef.current = true;
    }, [load])
  );

  // categoryMap: { [categoryId]: tên danh mục } để tra tên nhanh khi render từng card
  const categoryMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[String(c.id)] = c.name;
    return map;
  }, [categories]);

  const refetch = useCallback(() => load('refresh'), [load]);
  const retry = useCallback(() => load('initial'), [load]);

  return { courses, categories, categoryMap, loading, refreshing, error, refetch, retry };
}
