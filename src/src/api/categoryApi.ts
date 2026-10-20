import type { Category, CategoryInput } from '../types';
import { apiClient, isNotFoundError } from './client';

/**
 * Chuẩn hóa 1 bản ghi danh mục nhận từ MockAPI.
 * Ép `id` về string phòng trường hợp dữ liệu cũ bị lưu sai kiểu.
 */
export function normalizeCategory(raw: Record<string, unknown>): Category {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description == null ? '' : String(raw.description),
  };
}

/** Chỉ gửi đúng các field cho phép, không gửi `id` trong body */
function toPayload(input: CategoryInput): CategoryInput {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
  };
}

export const categoryApi = {
  /** GET /categories — lấy toàn bộ danh mục */
  async getAll(): Promise<Category[]> {
    try {
      const res = await apiClient.get<unknown>('/categories');
      // MockAPI có thể trả về chuỗi "Not found" thay vì mảng => coi như rỗng
      return Array.isArray(res.data) ? res.data.map(normalizeCategory) : [];
    } catch (error) {
      // MockAPI có thể trả 404 khi danh sách rỗng => coi là mảng rỗng, không phải lỗi
      if (isNotFoundError(error)) return [];
      throw error;
    }
  },

  /** POST /categories — tạo danh mục mới, MockAPI tự sinh id */
  async create(input: CategoryInput): Promise<Category> {
    const res = await apiClient.post<Record<string, unknown>>('/categories', toPayload(input));
    return normalizeCategory(res.data);
  },

  /** PUT /categories/{id} — cập nhật danh mục */
  async update(id: string, input: CategoryInput): Promise<Category> {
    const res = await apiClient.put<Record<string, unknown>>(
      `/categories/${encodeURIComponent(id)}`,
      toPayload(input)
    );
    return normalizeCategory(res.data);
  },

  /**
   * DELETE /categories/{id}
   * Lưu ý: MockAPI không có foreign key — màn hình gọi hàm này phải tự kiểm tra
   * danh mục không còn khóa học nào trước khi xóa.
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${encodeURIComponent(id)}`);
  },
};
