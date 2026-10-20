import type { Category } from '../types';
import { normalizeVN } from './text';

/** Giá trị form khóa học — mọi field đều là chuỗi vì lấy trực tiếp từ TextInput */
export interface CourseFormValues {
  title: string;
  description: string;
  instructor: string;
  categoryId: string;
  price: string;
  duration: string;
  thumbnail: string;
  trailerUrl: string;
}

export type CourseFormErrors = Partial<Record<keyof CourseFormValues, string>>;

export interface CategoryFormValues {
  name: string;
  description: string;
}

export type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

/** URL hợp lệ: bắt đầu bằng http:// hoặc https://, có tên miền, không chứa khoảng trắng */
export function isValidUrl(value: string): boolean {
  return /^https?:\/\/[^\s/$.?#][^\s]*$/i.test((value ?? '').trim());
}

/**
 * Đọc học phí người dùng nhập. Cho phép nhập kiểu "500.000" hoặc "500,000"
 * (dấu phân cách hàng nghìn) — sẽ được hiểu là 500000.
 */
export function parsePrice(text: string): number {
  let s = (text ?? '').replace(/\s/g, '');
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
  return s === '' ? NaN : Number(s);
}

/** Đọc thời lượng (giờ), cho phép số thập phân với dấu phẩy: "1,5" => 1.5 */
export function parseDuration(text: string): number {
  const s = (text ?? '').replace(/\s/g, '').replace(',', '.');
  return s === '' ? NaN : Number(s);
}

/**
 * Kiểm tra form khóa học. Trả về object lỗi, rỗng nghĩa là hợp lệ.
 * @param categories danh sách danh mục mới nhất (nên tải lại từ API ngay trước khi gọi)
 */
export function validateCourse(values: CourseFormValues, categories: Category[]): CourseFormErrors {
  const errors: CourseFormErrors = {};

  if (!values.title.trim()) errors.title = 'Vui lòng nhập tên khóa học';
  if (!values.description.trim()) errors.description = 'Vui lòng nhập mô tả';
  if (!values.instructor.trim()) errors.instructor = 'Vui lòng nhập tên giảng viên';

  // categoryId phải tồn tại trong danh sách categories (so sánh String === String)
  if (!values.categoryId) {
    errors.categoryId = 'Vui lòng chọn danh mục';
  } else if (!categories.some((c) => String(c.id) === String(values.categoryId))) {
    errors.categoryId = 'Danh mục không tồn tại (có thể vừa bị xóa), hãy chọn lại';
  }

  // Học phí: là số, >= 0, số nguyên
  const price = parsePrice(values.price);
  if (!values.price.trim()) errors.price = 'Vui lòng nhập học phí (nhập 0 nếu miễn phí)';
  else if (Number.isNaN(price)) errors.price = 'Học phí phải là số';
  else if (price < 0) errors.price = 'Học phí không được âm';
  else if (!Number.isInteger(price)) errors.price = 'Học phí phải là số nguyên';

  // Thời lượng: là số, > 0
  const duration = parseDuration(values.duration);
  if (!values.duration.trim()) errors.duration = 'Vui lòng nhập thời lượng';
  else if (Number.isNaN(duration)) errors.duration = 'Thời lượng phải là số';
  else if (duration <= 0) errors.duration = 'Thời lượng phải lớn hơn 0';

  if (!values.thumbnail.trim()) errors.thumbnail = 'Vui lòng nhập URL ảnh bìa';
  else if (!isValidUrl(values.thumbnail)) errors.thumbnail = 'URL phải bắt đầu bằng http:// hoặc https://';

  if (!values.trailerUrl.trim()) errors.trailerUrl = 'Vui lòng nhập URL trailer';
  else if (!isValidUrl(values.trailerUrl)) errors.trailerUrl = 'URL phải bắt đầu bằng http:// hoặc https://';

  return errors;
}

/**
 * Kiểm tra form danh mục: name bắt buộc và không trùng tên danh mục khác
 * (so sánh không phân biệt hoa thường / dấu).
 * @param editingId id danh mục đang sửa (bỏ qua chính nó khi kiểm tra trùng)
 */
export function validateCategory(
  values: CategoryFormValues,
  categories: Category[],
  editingId?: string
): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const name = normalizeVN(values.name);

  if (!name) {
    errors.name = 'Vui lòng nhập tên danh mục';
  } else if (
    categories.some((c) => String(c.id) !== String(editingId ?? '') && normalizeVN(c.name) === name)
  ) {
    errors.name = 'Tên danh mục đã tồn tại';
  } else if (values.name.trim().length > 60) {
    errors.name = 'Tên danh mục tối đa 60 ký tự';
  }

  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
