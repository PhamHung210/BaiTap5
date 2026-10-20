import axios, { AxiosError } from 'axios';

// Base URL đọc từ biến môi trường (file .env). Expo chỉ đưa các biến có tiền tố
// EXPO_PUBLIC_ vào bundle, nên KHÔNG hardcode URL MockAPI trong code.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    '[API] Thiếu EXPO_PUBLIC_API_URL. Hãy tạo file .env từ .env.example rồi khởi động lại `npx expo start`.'
  );
}

/** Lỗi đã được chuẩn hóa: luôn có message tiếng Việt, kèm HTTP status (nếu có) */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * axios instance dùng chung cho toàn app:
 * - baseURL lấy từ .env
 * - timeout 15 giây
 * - MockAPI yêu cầu header Content-Type: application/json và body JSON
 */
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor request: log method + URL để demo luồng gọi API (chỉ khi dev)
apiClient.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log(`[API] → ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url ?? ''}`);
  }
  return config;
});

// Interceptor response: log status, và chuyển mọi lỗi thành ApiError có message tiếng Việt
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(
        `[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url ?? ''}`
      );
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    if (__DEV__) {
      console.log(
        `[API] ✕ ${status ?? error.code ?? 'ERR'} ${error.config?.method?.toUpperCase() ?? ''} ${error.config?.url ?? ''}`
      );
    }
    return Promise.reject(new ApiError(toVietnameseMessage(error), status));
  }
);

/** Chuyển lỗi axios thành câu thông báo dễ hiểu cho người dùng */
function toVietnameseMessage(error: AxiosError): string {
  // Không có response => mất mạng, sai URL hoặc quá thời gian chờ
  if (!error.response) {
    if (!API_URL) return 'Chưa cấu hình địa chỉ máy chủ (EXPO_PUBLIC_API_URL)';
    return 'Không thể kết nối tới máy chủ, kiểm tra Internet';
  }
  const status = error.response.status;
  if (status === 404) return 'Không tìm thấy dữ liệu';
  if (status === 429) return 'Gửi quá nhiều yêu cầu, thử lại sau';
  if (status >= 500) return 'Máy chủ đang gặp sự cố';
  if (status === 400) return 'Dữ liệu gửi lên không hợp lệ';
  return `Có lỗi xảy ra (mã ${status})`;
}

/** Lấy message hiển thị từ một lỗi bất kỳ (dùng ở UI) */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Đã có lỗi xảy ra, vui lòng thử lại';
}

/** true nếu lỗi là HTTP 404 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
