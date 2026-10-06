import { Stack } from 'expo-router';
import { Providers } from '@/lib/providers';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import '@/global.css';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function ThemeSync() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme === 'light' || savedTheme === 'dark') {
            setColorScheme(savedTheme);
          }
        } else {
          const savedTheme = await AsyncStorage.getItem('theme');
          if (savedTheme === 'light' || savedTheme === 'dark') {
            setColorScheme(savedTheme);
          }
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      } finally {
        setIsMounted(true);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (!isMounted || !colorScheme) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('theme', colorScheme);
      } catch (e) {}
    } else {
      AsyncStorage.setItem('theme', colorScheme).catch(() => {});
    }
  }, [colorScheme, isMounted]);

  return null;
}

export default function RootLayout() {
  return (
    <Providers>
      <ThemeSync />
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ presentation: 'card' }} />
          <Stack.Screen name="(auth)" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin" options={{ presentation: 'card' }} />
          <Stack.Screen name="+not-found" options={{ presentation: 'card' }} />
        </Stack>
      </AuthProvider>
    </Providers>
  );
}