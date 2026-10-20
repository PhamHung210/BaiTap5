/**
 * Định dạng học phí kiểu Việt Nam: 500000 => "500.000 ₫", 0 => "Miễn phí".
 * Tự chèn dấu chấm phân cách hàng nghìn thay vì dùng Intl để kết quả giống nhau
 * trên mọi thiết bị (một số engine JS trên Android không có đủ locale vi-VN).
 */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return 'Miễn phí';
  const grouped = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped} ₫`;
}

/** "2026-09-01" => "01/09/2026"; chuỗi không đúng định dạng thì trả nguyên */
export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!match) return value || '—';
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

/** 30 => "30 giờ", 1.5 => "1,5 giờ" */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  return `${String(hours).replace('.', ',')} giờ`;
}

/** Ngày hôm nay (theo giờ máy) dạng YYYY-MM-DD — dùng cho createdAt khi thêm mới */
export function todayISO(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}
