/// <reference types="expo/types" />

// Khai báo kiểu cho biến môi trường đọc từ file .env (Expo inline lúc build)
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
  }
}
