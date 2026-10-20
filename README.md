# Bài 05: Quản lý khoá học

## Yêu cầu đề bài

Xây dựng ứng dụng di động Quản lý khoá học bằng React Native, Expo và TypeScript, sử dụng MockAPI làm backend REST:

- Hiển thị danh sách khoá học với ảnh bìa, giảng viên, danh mục và học phí; tìm kiếm theo tên, lọc theo danh mục và kéo để tải lại.
- Xem chi tiết, thêm, sửa, xoá khoá học; kiểm tra dữ liệu nhập và xác nhận trước khi xoá.
- Quản lý danh mục: thêm, sửa, xoá, kiểm tra trùng tên, đếm khoá học và chặn xoá danh mục còn khoá học.
- Phát trailer từ URL MP4 hoặc YouTube.
- Xử lý trạng thái tải dữ liệu, lỗi và danh sách trống; giao diện tiếng Việt, hỗ trợ chế độ sáng/tối.

## Cách chạy

Project đầy đủ nằm trong `bai-05/src/`. Cần Node.js, npm và Expo Go tương thích Expo SDK 57 trên điện thoại.

```bash
cd bai-05/src
npm ci
```

Tạo file `.env` bằng cách sao chép `.env.example` (PowerShell: `Copy-Item .env.example .env`, macOS/Linux: `cp .env.example .env`), rồi cấu hình địa chỉ MockAPI:

```dotenv
EXPO_PUBLIC_API_URL=https://6ace0700f338359cf1c2e93b.mockapi.io/api/v1
```

Backend cần hai resource `categories` và `courses`. Chi tiết schema, endpoint và luồng gọi API được mô tả trong [tài liệu project](./src/README.md).

```bash
npx expo start
```

Quét mã QR bằng Expo Go trên Android hoặc Camera trên iOS. Điện thoại và máy tính cần cùng mạng Wi-Fi; có thể dùng `npx expo start --tunnel` khi cần.

Kiểm tra mã nguồn:

```bash
npm run lint
npm run typecheck
```

Tuỳ chọn: `npm run seed` để tạo dữ liệu mẫu khi backend chưa có dữ liệu
