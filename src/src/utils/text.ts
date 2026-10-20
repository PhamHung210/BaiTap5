// Bảng thay thế ký tự có dấu => không dấu, dùng dự phòng khi engine JS
// không hỗ trợ String.prototype.normalize('NFD').
const VN_CHAR_MAP: Record<string, string> = {
  a: 'àáạảãâầấậẩẫăằắặẳẵ',
  e: 'èéẹẻẽêềếệểễ',
  i: 'ìíịỉĩ',
  o: 'òóọỏõôồốộổỗơờớợởỡ',
  u: 'ùúụủũưừứựửữ',
  y: 'ỳýỵỷỹ',
  d: 'đ',
};

const VN_REPLACERS = Object.entries(VN_CHAR_MAP).map(
  ([plain, accented]) => [new RegExp(`[${accented}]`, 'g'), plain] as const
);

/**
 * Chuẩn hóa chuỗi tiếng Việt để so sánh/tìm kiếm:
 * bỏ dấu (NFD + xóa dấu, đ -> d), chuyển chữ thường, trim.
 * Ví dụ: "  Lập Trình ĐIỆN thoại " => "lap trinh dien thoai"
 */
export function normalizeVN(input: string): string {
  let s = (input ?? '').toLowerCase().trim();
  try {
    // Tách ký tự gốc và dấu, rồi xóa các dấu (khối Unicode U+0300–U+036F)
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  } catch {
    // bỏ qua, dùng bảng thay thế phía dưới
  }
  for (const [pattern, plain] of VN_REPLACERS) {
    s = s.replace(pattern, plain);
  }
  // Gộp nhiều khoảng trắng liên tiếp thành 1
  return s.replace(/\s+/g, ' ');
}
