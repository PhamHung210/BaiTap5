import type { Course, CourseInput } from '../types';
import { apiClient, isNotFoundError } from './client';

/** Ép về number, nếu không hợp lệ (NaN) thì trả 0 */
function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Chuẩn hóa 1 khóa học nhận từ MockAPI:
 * - price, duration: Number(...)
 * - id, categoryId: String(...)
 * (phòng trường hợp dữ liệu cũ bị lưu sai kiểu, ví dụ price = "500000")
 */
export function normalizeCourse(raw: Record<string, unknown>): Course {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    categoryId: String(raw.categoryId ?? ''),
    instructor: String(raw.instructor ?? ''),
    price: toNumber(raw.price),
    duration: toNumber(raw.duration),
    thumbnail: String(raw.thumbnail ?? ''),
    trailerUrl: String(raw.trailerUrl ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  };
}

/**
 * Tạo body gửi lên MockAPI: KHÔNG có `id`, price/duration là number,
 * categoryId là string.
 */
function toPayload(input: CourseInput): CourseInput {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    categoryId: String(input.categoryId),
    instructor: input.instructor.trim(),
    price: Number(input.price),
    duration: Number(input.duration),
    thumbnail: input.thumbnail.trim(),
    trailerUrl: input.trailerUrl.trim(),
    createdAt: input.createdAt,
  };
}

export const courseApi = {
  /** GET /courses — lấy toàn bộ khóa học (search/filter làm ở client) */
  async getAll(): Promise<Course[]> {
    try {
      const res = await apiClient.get<unknown>('/courses');
      return Array.isArray(res.data) ? res.data.map(normalizeCourse) : [];
    } catch (error) {
      // 404 cho danh sách rỗng => trả về [] thay vì báo lỗi
      if (isNotFoundError(error)) return [];
      throw error;
    }
  },

  /** GET /courses/{id} — 404 nghĩa là khóa học không tồn tại / đã bị xóa */
  async getById(id: string): Promise<Course> {
    const res = await apiClient.get<Record<string, unknown>>(`/courses/${encodeURIComponent(id)}`);
    return normalizeCourse(res.data);
  },

  /** POST /courses — thêm khóa học mới */
  async create(input: CourseInput): Promise<Course> {
    const res = await apiClient.post<Record<string, unknown>>('/courses', toPayload(input));
    return normalizeCourse(res.data);
  },

  /** PUT /courses/{id} — cập nhật khóa học */
  async update(id: string, input: CourseInput): Promise<Course> {
    const res = await apiClient.put<Record<string, unknown>>(
      `/courses/${encodeURIComponent(id)}`,
      toPayload(input)
    );
    return normalizeCourse(res.data);
  },

  /** DELETE /courses/{id} */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/courses/${encodeURIComponent(id)}`);
  },
};
