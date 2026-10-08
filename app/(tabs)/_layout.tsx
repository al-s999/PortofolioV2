import { Tabs } from 'expo-router';
import { cn } from '@/lib/utils/cn';
import { Home, User, FolderGit2, Mail, Moon, Sun, LanguageToggle } from '@/components/ui';
import { useWindowDimensions, Pressable, View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import { ScrollProvider, useScrollNav } from '@/components/ScrollContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  if (!isOffline) return null;

  return (
    <View className="absolute top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 items-center">
      <Text className="text-white text-xs font-semibold text-center">
        {t('offline.banner')}
      </Text>
    </View>
  );
}

function InnerTabs() {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isWeb = width >= 768;
  const { isNavVisible } = useScrollNav();
  const { t } = useLanguage();
  // Web: auto-hide on scroll. Mobile: always sticky at bottom.
  const hideOnScroll = isWeb;
  const navVisible = hideOnScroll ? isNavVisible : true;

  const getStrokeColor = (color: any): string => {
    if (typeof color === 'string') return color;
    return '#0ea5e9';
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          position: 'absolute',
          ...(isWeb ? { top: navVisible ? 16 : -100, bottom: 'auto' } : { bottom: 0, top: 'auto' }),
          left: isWeb ? '50%' : 0,
          transform: isWeb ? [{ translateX: -400 }] : [], // Centers the 800px navbar perfectly
          width: isWeb ? 800 : '100%',
          right: isWeb ? 'auto' : 0,
          height: isWeb ? 64 : 70,
          backgroundColor: colorScheme === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: isWeb ? 0 : 1,
          borderWidth: isWeb ? 1 : 0,
          borderColor: colorScheme === 'dark' ? '#2a2a2a' : '#e5e7eb',
          borderRadius: isWeb ? 32 : 0,
          paddingHorizontal: isWeb ? 24 : 0,
          paddingBottom: isWeb ? 0 : 8,
          overflow: 'hidden',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: isWeb ? 4 : -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          opacity: navVisible ? 1 : 0, // Fallback for transition (web auto-hide only)
          transition: 'all 0.3s ease-in-out', // Web only CSS transition
        } as any,
        tabBarItemStyle: {
          paddingVertical: isWeb ? 0 : 4,
          height: isWeb ? 64 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          display: isWeb ? 'none' : 'flex',
        },
        tabBarShowLabel: !isWeb,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ focused, color }) => (<Home size={24} stroke={getStrokeColor(color)} strokeWidth={focused ? 3 : 2} fill={focused ? getStrokeColor(color) : 'none'} />) }} />
      <Tabs.Screen name="about" options={{ title: t('tabs.about'), tabBarIcon: ({ focused, color }) => (<User size={24} stroke={getStrokeColor(color)} strokeWidth={focused ? 3 : 2} />) }} />
      <Tabs.Screen name="projects" options={{ title: t('tabs.projects'), tabBarIcon: ({ focused, color }) => (<FolderGit2 size={24} stroke={getStrokeColor(color)} strokeWidth={focused ? 3 : 2} />) }} />
      <Tabs.Screen name="contact" options={{ title: t('tabs.contact'), tabBarIcon: ({ focused, color }) => (<Mail size={24} stroke={getStrokeColor(color)} strokeWidth={focused ? 3 : 2} />) }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  
  return (
    <ScrollProvider>
      <OfflineBanner />
      <InnerTabs />
      <View className="absolute top-12 right-6 lg:top-8 lg:right-10 z-50 flex-row items-center gap-2 pointer-events-auto">
        <LanguageToggle />
        <Pressable
          onPress={toggleColorScheme}
          className="p-3.5 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors pointer-events-auto"
        >
          {colorScheme === 'dark' ? <Moon size={26} color="#e5e7eb" /> : <Sun size={26} color="#eab308" />}
        </Pressable>
      </View>
    </ScrollProvider>
  );
}