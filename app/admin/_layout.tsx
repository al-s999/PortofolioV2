import { Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/login');
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="about" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="projects/new" />
      <Stack.Screen name="projects/[id]" />
      <Stack.Screen name="contacts" />
    </Stack>
  );
}