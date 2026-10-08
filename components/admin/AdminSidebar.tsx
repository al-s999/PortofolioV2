import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { LayoutDashboard, User, FolderGit2, Mail, Settings, LogOut, ChevronLeft, ChevronRight, Menu, Moon, Sun, LanguageToggle } from '@/components/ui';
import { useColorScheme } from 'nativewind';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useState } from 'react';

const NAV_ITEMS = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'about', label: 'About Me', icon: User, href: '/admin/about' },
  { name: 'projects', label: 'Projects', icon: FolderGit2, href: '/admin/projects' },
  { name: 'contacts', label: 'Contacts', icon: Mail, href: '/admin/contacts' },
];

interface AdminSidebarProps {
  children: React.ReactNode;
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const { user, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View className={cn('flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700', collapsed ? 'w-20' : 'w-64')}>
          <View className="flex-1 flex-col">
            {/* Header */}
            <View className={cn('p-4 border-b border-gray-200 dark:border-gray-700')}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                    <Text className="text-xl font-bold text-white">P</Text>
                  </View>
                  {!collapsed && (
                    <View>
                      <Text className="font-bold text-gray-900 dark:text-gray-100">Admin Panel</Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">Portfolio Manager</Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => setCollapsed(!collapsed)} className="p-1 -mr-2">
                  {collapsed ? <ChevronRight size={24} color="gray" /> : <ChevronLeft size={24} color="gray" />}
                </Pressable>
              </View>
            </View>

            {/* Navigation */}
            <View className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </View>

            {/* Footer */}
            <View className="p-4 border-t border-gray-200 dark:border-gray-700">
              {!collapsed && (
                <View className="flex-row items-center gap-3 mb-4">
                  <Avatar
                    name={user?.email?.split('@')[0] ?? 'Admin'}
                    size="md"
                    src={user?.user_metadata?.avatar_url}
                  />
                  <View className="flex-1 min-w-0">
                    <Text className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.email ?? 'Admin'}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Administrator</Text>
                  </View>
                </View>
              )}
              <View className={cn('flex-row items-center gap-2 mb-2', collapsed && 'flex-col justify-center')}>
                <Pressable onPress={toggleColorScheme} className={cn('flex-1 flex-row items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-800', collapsed && 'justify-center')}>
                  {colorScheme === 'dark' ? <Moon size={24} color="#94a3b8" /> : <Sun size={24} color="#eab308" />}
                  {!collapsed && <Text className="font-medium text-gray-700 dark:text-gray-300">Theme</Text>}
                </Pressable>
                <LanguageToggle />
              </View>
              <Pressable onPress={handleSignOut} className={cn('flex-row items-center gap-3 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/30', collapsed && 'justify-center')}>
                <LogOut size={24} color="#ef4444" />
                {!collapsed && <Text className="text-red-600 dark:text-red-400 font-medium">Sign Out</Text>}
              </Pressable>
            </View>
          </View>
        </View>
        <View className="flex-1">
          {children}
        </View>
      </View>
    );
  }

  // Mobile layout
  return (
    <View style={styles.mobileContainer}>
      {/* Mobile Header */}
      <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex-row items-center justify-between">
        <Pressable onPress={() => setCollapsed(!collapsed)} className="p-2">
          <Menu size={24} color="gray" />
        </Pressable>
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Text className="text-lg font-bold text-white">P</Text>
          </View>
          <Text className="font-bold text-gray-900 dark:text-gray-100">Admin</Text>
        </View>
        <Pressable onPress={handleSignOut} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
          <LogOut size={20} color="#ef4444" />
        </Pressable>
      </View>

      {/* Mobile Sidebar */}
      {collapsed && (
        <Pressable className="fixed inset-0 z-50 bg-black/50" onPress={() => setCollapsed(false)} />
      )}
      <View
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64',
          'transform transition-transform duration-300 ease-out',
          collapsed ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: 280 }}
      >
        <View className="flex-1 flex-col p-4">
          {/* Navigation */}
          <View className="space-y-1 mb-6">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.name} item={item} collapsed={false} onPress={() => setCollapsed(false)} />
            ))}
          </View>

          <Separator className="mb-4" />

          {/* User Footer */}
          <View className="flex-row items-center gap-3 mb-4">
            <Avatar
              name={user?.email?.split('@')[0] ?? 'Admin'}
              size="md"
              src={user?.user_metadata?.avatar_url}
            />
            <View className="flex-1 min-w-0">
              <Text className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.email ?? 'Admin'}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Administrator</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 mb-2">
            <Pressable onPress={toggleColorScheme} className="flex-1 flex-row items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-800">
              {colorScheme === 'dark' ? <Moon size={24} color="#94a3b8" /> : <Sun size={24} color="#eab308" />}
              <Text className="font-medium text-gray-700 dark:text-gray-300">Theme</Text>
            </Pressable>
            <LanguageToggle />
          </View>

          <Pressable onPress={handleSignOut} className="flex-row items-center gap-3 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/30">
            <LogOut size={24} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 font-medium">Sign Out</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1">
        {children}
      </View>
    </View>
  );
}

function NavItem({ item, collapsed, onPress }: { item: typeof NAV_ITEMS[0]; collapsed: boolean; onPress?: () => void }) {
  const { name, label, icon: Icon, href } = item;
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        router.push(href as any);
        if (onPress) onPress();
      }}
      className={cn(
        'flex-row items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1',
        isActive
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      <Icon size={24} color={isActive ? '#0ea5e9' : 'gray'} />
      {!collapsed && (
        <Text className={cn('font-medium text-base', isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300')}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileContainer: {
    flex: 1,
  },
});