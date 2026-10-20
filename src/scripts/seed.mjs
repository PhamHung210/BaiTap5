// Seed dữ liệu mẫu lên MockAPI.
// Chạy thủ công: `npm run seed` (KHÔNG tự chạy khi cài đặt / khởi động app).
//
// Luồng:
// 1. Đọc EXPO_PUBLIC_API_URL từ file .env
// 2. Kiểm tra /categories và /courses: nếu đã có dữ liệu thì DỪNG và cảnh báo
// 3. POST lần lượt từng danh mục (bỏ trường id), lưu map: id cũ -> id mới MockAPI trả về
// 4. POST lần lượt từng khóa học với categoryId đã đổi sang id mới

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Đọc biến từ .env (không cần thư viện dotenv) */
async function loadEnv() {
  try {
    const text = await readFile(resolve(root, '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // không có .env => dùng biến môi trường của shell
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(resolve(root, 'seed', file), 'utf8'));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(method, url, body) {
  // Thử lại khi bị 429 (MockAPI giới hạn số request)
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt < 4) {
      await sleep(1000 * attempt);
      continue;
    }
    // 404 cho danh sách rỗng => coi như []
    if (method === 'GET' && res.status === 404) return [];
    if (!res.ok) throw new Error(`${method} ${url} => HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

async function main() {
  await loadEnv();
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!base || base.includes('YOUR_PROJECT_ID')) {
    console.error('✖ Chưa cấu hình EXPO_PUBLIC_API_URL trong file .env');
    process.exit(1);
  }

  const categories = await readJson('categories.json');
  const courses = await readJson('courses.json');

  // Kiểm tra dữ liệu hiện có — không seed chồng lên dữ liệu cũ
  const [existingCategories, existingCourses] = await Promise.all([
    request('GET', `${base}/categories`),
    request('GET', `${base}/courses`),
  ]);
  if (
    (Array.isArray(existingCategories) && existingCategories.length > 0) ||
    (Array.isArray(existingCourses) && existingCourses.length > 0)
  ) {
    console.warn(
      `⚠ MockAPI đã có dữ liệu (${existingCategories.length} danh mục, ${existingCourses.length} khóa học).\n` +
        '  Dừng seed để tránh tạo dữ liệu trùng. Hãy xóa dữ liệu trên mockapi.io nếu muốn seed lại.'
    );
    process.exit(1);
  }

  console.log(`→ Seed vào ${base}`);
  const idMap = new Map(); // id cũ (trong file seed) -> id mới (MockAPI sinh)

  for (const { id: oldId, ...category } of categories) {
    const created = await request('POST', `${base}/categories`, category);
    idMap.set(String(oldId), String(created.id));
    console.log(`  ✔ Danh mục "${category.name}" (id ${oldId} -> ${created.id})`);
  }

  for (const { id: _oldId, ...course } of courses) {
    const newCategoryId = idMap.get(String(course.categoryId));
    if (!newCategoryId) {
      console.warn(`  ⚠ Bỏ qua "${course.title}": categoryId ${course.categoryId} không có trong seed/categories.json`);
      continue;
    }
    const payload = {
      ...course,
      categoryId: newCategoryId,
      price: Number(course.price),
      duration: Number(course.duration),
    };
    const created = await request('POST', `${base}/courses`, payload);
    console.log(`  ✔ Khóa học "${course.title}" (id ${created.id})`);
  }

  console.log('✔ Seed xong.');
}

main().catch((error) => {
  console.error('✖ Seed thất bại:', error.message);
  process.exit(1);
});
