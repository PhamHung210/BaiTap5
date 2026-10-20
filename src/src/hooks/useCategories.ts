import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { categoryApi } from '../api/categoryApi';
import { getErrorMessage } from '../api/client';
import { courseApi } from '../api/courseApi';
import type { Category, Course } from '../types';

type LoadMode = 'initial' | 'refresh' | 'silent';

/**
 * Tải danh mục + khóa học cho màn quản lý danh mục.
 * Cần cả courses để đếm số khóa học thuộc từng danh mục.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (mode: LoadMode) => {
    const requestId = ++requestIdRef.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);

    try {
      // GET /categories và GET /courses chạy song song
      const [categoryList, courseList] = await Promise.all([
        categoryApi.getAll(),
        courseApi.getAll(),
      ]);
      if (requestId !== requestIdRef.current) return;
      setCategories(categoryList);
      setCourses(courseList);
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

  useFocusEffect(
    useCallback(() => {
      load(hasLoadedRef.current ? 'silent' : 'initial');
      hasLoadedRef.current = true;
    }, [load])
  );

  // Đếm số khóa học theo categoryId — luôn so sánh String với String
  const courseCountMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const course of courses) {
      const key = String(course.categoryId);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [courses]);

  const refetch = useCallback(() => load('refresh'), [load]);
  const retry = useCallback(() => load('initial'), [load]);
  /** Tải lại ngầm (không spinner) — dùng sau khi thêm/sửa/xóa */
  const reload = useCallback(() => load('silent'), [load]);

  return { categories, courseCountMap, loading, refreshing, error, refetch, retry, reload };
}
