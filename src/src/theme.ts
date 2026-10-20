import { useColorScheme } from 'react-native';

const lightColors = {
  primary: '#4F46E5',
  primaryPressed: '#4338CA',
  primarySoft: '#EEF2FF',
  onPrimary: '#FFFFFF',
  background: '#F4F5FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F5',
  text: '#111827',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
  border: '#E2E5EC',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  success: '#16A34A',
  successSoft: '#E7F7EC',
  overlay: 'rgba(17, 24, 39, 0.5)',
  shadow: '#000000',
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  primary: '#818CF8',
  primaryPressed: '#6366F1',
  primarySoft: '#25264A',
  onPrimary: '#0B0B1A',
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceAlt: '#242836',
  text: '#F3F4F6',
  textSecondary: '#A0A6B5',
  placeholder: '#6B7280',
  border: '#2E3342',
  danger: '#F87171',
  dangerSoft: '#3A1E22',
  success: '#4ADE80',
  successSoft: '#163323',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
/** Kích thước tối thiểu của vùng chạm (accessibility) */
export const TOUCH_TARGET = 44;

/** Trả về bảng màu theo chế độ sáng/tối của hệ thống */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
