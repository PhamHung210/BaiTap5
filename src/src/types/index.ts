/** Danh mục khóa học (resource `categories` trên MockAPI) */
export interface Category {
  id: string;
  name: string;
  description: string;
}

/** Khóa học (resource `courses` trên MockAPI) */
export interface Course {
  id: string;
  title: string;
  description: string;
  /** = Category.id (quan hệ 1–N, MockAPI không có foreign key nên kiểm tra ở client) */
  categoryId: string;
  instructor: string;
  /** Học phí (VNĐ), >= 0 */
  price: number;
  /** Thời lượng (giờ), > 0 */
  duration: number;
  thumbnail: string;
  trailerUrl: string;
  /** Ngày tạo dạng YYYY-MM-DD */
  createdAt: string;
}

/** Dữ liệu gửi lên khi POST/PUT khóa học — không bao giờ gửi `id` */
export type CourseInput = Omit<Course, 'id'>;

/** Dữ liệu gửi lên khi POST/PUT danh mục */
export type CategoryInput = Omit<Category, 'id'>;
