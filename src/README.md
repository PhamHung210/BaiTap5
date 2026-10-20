# Bài 05: Quản lý khoá học (React Native + MockAPI)

Ứng dụng mobile quản lý **khóa học** và **danh mục khóa học**, viết bằng React Native (Expo) và dùng **MockAPI.io** làm backend REST. App chạy trực tiếp trong **Expo Go** (không cần build native).

## Tính năng

| Màn hình | Chức năng |
|---|---|
| **Danh sách khóa học** (tab "Khóa học") | Danh sách dạng thẻ (ảnh bìa 16:9, tên, giảng viên, badge danh mục, học phí); tìm kiếm theo tên (không phân biệt hoa thường/dấu, debounce 300ms); lọc theo danh mục bằng chip; hiển thị số kết quả; pull-to-refresh; tự tải lại khi quay về màn hình; nút nổi "+" để thêm |
| **Chi tiết khóa học** | Ảnh bìa lớn, đầy đủ thông tin, tên danh mục tra theo `categoryId`; nút **Xem trailer**, **Sửa**, **Xóa** (có xác nhận) |
| **Form thêm / sửa** | Picker danh mục lấy từ API, xem trước ảnh bìa, validation hiển thị lỗi đỏ dưới từng field, chống bấm lưu 2 lần, kiểm tra lại danh mục từ API ngay lúc lưu |
| **Quản lý danh mục** (tab "Danh mục") | Danh sách danh mục kèm **số khóa học**; thêm/sửa bằng Modal (chống trùng tên); **xóa có ràng buộc** — chặn xóa nếu danh mục còn khóa học |
| **Trailer** | Phát MP4 bằng `expo-video` (native controls, toàn màn hình) hoặc YouTube bằng `react-native-youtube-iframe`; có loading khi buffer, báo lỗi + nút Thử lại |

Ngoài ra: hỗ trợ light/dark mode theo hệ thống, toàn bộ giao diện tiếng Việt, mọi màn hình đều có trạng thái **loading / lỗi / rỗng**.

## Tech stack & lý do chọn

| Thư viện | Vai trò | Lý do chọn |
|---|---|---|
| **Expo SDK 57** (TypeScript) | Nền tảng | Chạy ngay trên Expo Go bằng cách quét QR, không cần Android Studio |
| **Expo Router** | Điều hướng | Điều hướng theo file (`app/`), cấu trúc màn hình nhìn là hiểu, hỗ trợ tab + stack |
| **axios** | Gọi HTTP | Có `baseURL`, `timeout`, interceptor để log request và chuẩn hóa lỗi ở một chỗ |
| **expo-image** | Hiển thị ảnh từ URL | Cache bộ nhớ + đĩa, hiệu ứng chuyển, callback `onError` để hiện placeholder khi ảnh lỗi |
| **expo-video** | Phát MP4 | API mới của Expo (`useVideoPlayer`, `VideoView`), tự giải phóng player khi rời màn hình |
| **react-native-youtube-iframe** + **react-native-webview** | Phát YouTube | YouTube không cho phát trực tiếp file, phải nhúng iframe qua WebView |
| **@react-native-picker/picker** | Dropdown chọn danh mục | Picker native, có sẵn trong Expo Go |
| **React hooks thuần** | Quản lý state | `useState`, `useEffect`, `useCallback`, `useFocusEffect` — luồng gọi API tường minh, dễ giải thích, không cần Redux |
| **@expo/vector-icons** | Icon | Có sẵn bộ Ionicons |

## Cấu trúc thư mục

```
app/                         # Mỗi file là 1 màn hình (Expo Router)
  _layout.tsx                # Stack gốc + theme sáng/tối
  (tabs)/_layout.tsx         # Bottom tabs: "Khóa học", "Danh mục"
  (tabs)/index.tsx           # Màn 1: Danh sách khóa học
  (tabs)/categories.tsx      # Màn 4: Quản lý danh mục
  course/[id].tsx            # Màn 2: Chi tiết khóa học
  course/form.tsx            # Màn 3: Form thêm/sửa (?id= để sửa)
  trailer.tsx                # Màn phát trailer (?url=&title=)
src/
  api/client.ts              # axios instance, interceptor log + chuẩn hóa lỗi tiếng Việt
  api/categoryApi.ts         # getAll, create, update, remove
  api/courseApi.ts           # getAll, getById, create, update, remove
  types/index.ts             # Category, Course, CourseInput
  hooks/useCourses.ts        # Tải courses + categories song song, categoryMap
  hooks/useCategories.ts     # Tải categories + courses, đếm số khóa học theo danh mục
  utils/format.ts            # formatPrice, formatDate, formatDuration, todayISO
  utils/text.ts              # normalizeVN (bỏ dấu tiếng Việt)
  utils/validation.ts        # validateCourse, validateCategory, isValidUrl
  utils/video.ts             # isYouTubeUrl, extractYouTubeId
  components/                # CourseCard, CourseImage, CategoryChip, LoadingView, ErrorView,
                             # EmptyView, FormField, AppButton, Fab, ConfirmDialog (helper)
  theme.ts                   # Bảng màu sáng/tối, spacing, radius
scripts/seed.mjs             # Script seed dữ liệu mẫu (chạy thủ công)
seed/                        # Dữ liệu mẫu categories.json, courses.json
```

## Backend MockAPI

- Project: `https://6ace0700f338359cf1c2e93b.mockapi.io/api/v1` (quản lý tại https://mockapi.io)
- Base URL đặt trong file `.env` (biến `EXPO_PUBLIC_API_URL`), không hardcode trong code.

**Resource `categories`**: `id`, `name`, `description`
**Resource `courses`**: `id`, `title`, `description`, `categoryId` (= `categories.id`), `instructor`, `price` (number, VNĐ), `duration` (number, giờ), `thumbnail`, `trailerUrl`, `createdAt` (`YYYY-MM-DD`)

| Method | Endpoint | Dùng ở |
|---|---|---|
| GET | `/categories` | Danh sách, chi tiết, form (Picker + kiểm tra lúc lưu), quản lý danh mục |
| POST | `/categories` | Thêm danh mục |
| PUT | `/categories/{id}` | Sửa danh mục |
| DELETE | `/categories/{id}` | Xóa danh mục (sau khi kiểm tra ràng buộc) |
| GET | `/courses` | Danh sách khóa học, đếm khóa học theo danh mục, kiểm tra trước khi xóa danh mục |
| GET | `/courses/{id}` | Chi tiết, form sửa |
| POST | `/courses` | Thêm khóa học |
| PUT | `/courses/{id}` | Sửa khóa học |
| DELETE | `/courses/{id}` | Xóa khóa học |

### Những điểm cần lưu ý với MockAPI (đã xử lý trong code)

1. **Không có foreign key** → ràng buộc danh mục ↔ khóa học được kiểm tra ở client.
2. **Filter query string của MockAPI so khớp chuỗi, không chính xác** (`?categoryId=1` khớp cả `10`, `11`) → search/filter làm **ở client**, mọi so sánh dùng `String(a) === String(b)`.
3. **Danh sách rỗng có thể trả 404** → `getAll()` coi 404 là `[]`.
4. **Ép kiểu khi nhận dữ liệu**: `price`, `duration` dùng `Number(...)`; `id`, `categoryId` dùng `String(...)` (hàm `normalizeCourse`, `normalizeCategory`).

## Cài đặt & chạy

1. Cài **Node.js LTS** (khuyến nghị 20 trở lên) và app **Expo Go** (bản hỗ trợ SDK 57) trên điện thoại Android.
2. Cài thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env` từ `.env.example` rồi sửa URL MockAPI của bạn:
   ```bash
   cp .env.example .env
   # EXPO_PUBLIC_API_URL=https://<PROJECT_ID>.mockapi.io/api/v1
   ```
4. Chạy dev server:
   ```bash
   npx expo start
   ```
5. Mở **Expo Go** → **Scan QR code** → quét mã QR trong terminal (điện thoại và máy tính cùng mạng Wi-Fi; nếu khác mạng dùng `npx expo start --tunnel`).

Các lệnh khác:

```bash
npx tsc --noEmit     # kiểm tra kiểu TypeScript
npx expo lint        # lint
npm run seed         # (tùy chọn) đẩy dữ liệu mẫu trong seed/ lên MockAPI
```

> `npm run seed` chỉ chạy khi bạn gọi. Script kiểm tra trước: nếu MockAPI **đã có dữ liệu** thì dừng và cảnh báo, không tạo dữ liệu trùng. Khi seed, script bỏ trường `id` và tự map `categoryId` cũ sang `id` mới mà MockAPI sinh ra.

## Luồng gọi API theo từng chức năng

Mỗi request đều được log ra console khi chạy dev, ví dụ:

```
[API] → GET https://...mockapi.io/api/v1/courses
[API] ← 200 GET /courses
```

### Danh sách khóa học
1. Màn hình được focus → hook `useCourses` gọi **song song** `GET /courses` và `GET /categories` bằng `Promise.all`.
2. Từ danh sách categories tạo `categoryMap = { [id]: name }` để hiển thị tên danh mục trên từng thẻ.
3. Tìm kiếm và lọc chạy trên client: `normalizeVN(title).includes(normalizeVN(keyword))` và `String(course.categoryId) === String(selectedId)`.
4. Quay lại từ màn khác (sau thêm/sửa/xóa) → `useFocusEffect` tải lại ngầm.

### Chi tiết khóa học
1. Gọi song song `GET /courses/{id}` và `GET /categories`; tra tên danh mục, không tìm thấy thì hiện "Danh mục không tồn tại".
2. `GET /courses/{id}` trả 404 → hiện "Không tìm thấy khóa học" (khóa học đã bị xóa).
3. **Xóa**: Alert xác nhận → `DELETE /courses/{id}` → thông báo thành công → `router.back()` → danh sách tự refetch.

### Thêm / sửa khóa học
1. Mở form: `GET /categories` (cho Picker), nếu sửa thì thêm `GET /courses/{id}` để điền sẵn.
2. Bấm lưu:
   - Validate ngay ở client (giá âm, URL sai, ... bị chặn, không gọi API).
   - **Gọi lại `GET /categories`** để chắc chắn danh mục đã chọn vẫn còn (có thể vừa bị xóa ở máy khác), validate lần nữa.
   - Thêm: `POST /courses` với `createdAt` = hôm nay. Sửa: `PUT /courses/{id}` giữ nguyên `createdAt` cũ. Body không có `id`, `price`/`duration` là number.
   - Thành công → thông báo → quay lại. Lỗi → hiện thông báo, giữ nguyên dữ liệu đã nhập.

### Quản lý danh mục
- Tải song song `GET /categories` + `GET /courses`, đếm số khóa học của từng danh mục.
- Thêm/sửa: validate (tên bắt buộc, không trùng — so sánh không phân biệt hoa thường/dấu, kiểm tra trên danh sách vừa tải lại) → `POST /categories` hoặc `PUT /categories/{id}`.
- **Xóa có ràng buộc** (vì MockAPI không có foreign key):
  1. Gọi lại `GET /courses` để có dữ liệu mới nhất.
  2. Đếm `courses.filter(c => String(c.categoryId) === String(category.id)).length`.
  3. Nếu **> 0** → Alert *"Không thể xóa: danh mục đang có N khóa học. Hãy chuyển hoặc xóa các khóa học này trước."* và **không** gọi DELETE.
  4. Nếu **= 0** → Alert xác nhận → `DELETE /categories/{id}` → tải lại danh sách.

### Trailer
- `isYouTubeUrl(url)` → trích `videoId` (hỗ trợ `watch?v=`, `youtu.be/`, `embed/`, `shorts/`) → `react-native-youtube-iframe`.
- Ngược lại → `expo-video`: `useVideoPlayer(url)` tự phát, `VideoView` có native controls + fullscreen. Lắng nghe sự kiện `statusChange`: `loading` → hiện spinner, `error` → hiện lỗi + **Thử lại**. Player tự được giải phóng khi rời màn hình.

## Xử lý loading / lỗi / rỗng

| Trạng thái | Cách hiển thị |
|---|---|
| Đang tải lần đầu | `LoadingView` (ActivityIndicator + chữ) |
| Lỗi khi chưa có dữ liệu | `ErrorView` với message tiếng Việt + nút **Thử lại** |
| Lỗi khi tải lại nhưng đã có dữ liệu cũ | Giữ dữ liệu cũ, hiện banner đỏ nhỏ phía trên + Thử lại |
| Danh sách trống | `EmptyView`: "Chưa có khóa học nào" (kèm nút thêm) |
| Lọc / tìm không ra | `EmptyView`: "Không tìm thấy kết quả phù hợp" (kèm nút xóa bộ lọc) |
| Đang gửi form / đang xóa | Nút bị khóa + spinner (chống bấm 2 lần) |

Thông báo lỗi do interceptor của axios chuẩn hóa:

| Tình huống | Thông báo |
|---|---|
| Mất mạng / timeout 15s | Không thể kết nối tới máy chủ, kiểm tra Internet |
| 404 | Không tìm thấy dữ liệu |
| 429 | Gửi quá nhiều yêu cầu, thử lại sau |
| 5xx | Máy chủ đang gặp sự cố |

## Video demo

[Xem 3 video demo Quản lý khoá học trên Google Drive](https://drive.google.com/drive/u/0/folders/1Fdzx33pT8Yar1YwlQLxhDIjnLWo2WSvg)
