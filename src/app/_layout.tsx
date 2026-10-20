import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { useTheme } from '../src/theme';

/** Layout gốc: Stack chứa nhóm tab + các màn chi tiết / form / trailer */
export default function RootLayout() {
  const { colors, isDark } = useTheme();

  // Đồng bộ màu của React Navigation (header, nền) với theme của app, theo light/dark hệ thống
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerStyle: { backgroundColor: colors.surface },
          headerBackTitle: 'Quay lại',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course/[id]" options={{ title: 'Chi tiết khóa học' }} />
        <Stack.Screen name="course/form" options={{ title: 'Khóa học' }} />
        <Stack.Screen name="trailer" options={{ title: 'Trailer' }} />
      </Stack>
    </ThemeProvider>
  );
}
