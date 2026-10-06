import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Home, AlertTriangle } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-dark-bg justify-center items-center px-4">
      <Card variant="outlined" className="max-w-md w-full p-12 items-center">
        <AlertTriangle size={64} stroke="orange" className="mb-6" />
        <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          404 - Page Not Found
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. 
          It might have been moved or doesn&apos;t exist.
        </Text>
        <View className="flex-row gap-3 w-full">
          <View className="flex-1">
            <Button 
              variant="outline" 
              fullWidth 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            >
              Go Back
            </Button>
          </View>
          <View className="flex-1">
            <Button fullWidth onPress={() => router.replace('/')}>
              Home
            </Button>
          </View>
        </View>
      </Card>
    </View>
  );
}