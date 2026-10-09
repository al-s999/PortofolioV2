import { View, Pressable, Text, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Plus, ArrowRight, TrendingUp, FolderGit2, Mail, User, ExternalLink, RefreshCw } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStats } from '@/lib/queries';
import { useProjects } from '@/lib/queries';
import { useAboutMe } from '@/lib/queries';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const { data: stats } = useAdminStats();
  const { data: projects } = useProjects();
  const { data: aboutMe } = useAboutMe();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, you'd refetch queries here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const recentProjects = projects?.slice(0, 5) ?? [];

  return (
    <AdminSidebar>
      <ScrollView
        className="flex-1 bg-gray-50 dark:bg-dark-bg"
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Page Header */}
        <View className={cn('p-6', isWeb ? 'max-w-7xl mx-auto w-full' : 'w-full')}>
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className={cn('font-bold text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                {t('admin.dashboard.title')}
              </Text>
            </View>
            <Button rightIcon={<RefreshCw size={18} />} variant="outline" onPress={handleRefresh} loading={refreshing}>
              {t('common.refresh')}
            </Button>
          </View>

          {/* Stats Grid */}
          <View className={cn('gap-4 mb-6 w-full', isWeb ? 'flex-row' : 'flex-col')}>
            <StatCard
              className={isWeb ? "flex-1" : ""}
              title={t('admin.dashboard.totalProjects')}
              value={stats?.totalProjects ?? 0}
              icon={FolderGit2}
              color="text-blue-500"
              bgColor="bg-blue-500"
              onPress={() => router.push('/admin/projects')}
            />
            <StatCard
              className={isWeb ? "flex-1" : ""}
              title={t('admin.dashboard.totalContacts')}
              value={stats?.totalContacts ?? 0}
              icon={Mail}
              color="text-green-500"
              bgColor="bg-green-500"
              onPress={() => router.push('/admin/contacts')}
            />
            <StatCard
              className={isWeb ? "flex-1" : ""}
              title={t('admin.dashboard.featuredProjects')}
              value={stats?.featuredProjects ?? 0}
              icon={TrendingUp}
              color="text-orange-500"
              bgColor="bg-orange-500"
              onPress={() => router.push('/admin/projects')}
            />
            <StatCard
              className={isWeb ? "flex-1" : ""}
              title={t('admin.dashboard.skillsCount')}
              value={aboutMe?.skills?.length ?? 0}
              icon={User}
              color="text-purple-500"
              bgColor="bg-purple-500"
              onPress={() => router.push('/admin/about')}
            />
          </View>
          {/* Quick Actions & Recent Projects */}
          <View className={cn('gap-6', isWeb ? 'grid grid-cols-1 lg:grid-cols-3' : 'flex-col')}>
            {/* Quick Actions */}
            <View className={cn(isWeb ? 'lg:col-span-1' : '')}>
              <Card variant="outlined">
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">{t('admin.dashboard.quickActions')}</Text>
                  </View>
                  <View className="space-y-3">
                    <QuickAction
                      label={t('admin.dashboard.addProject')}
                      description={t('admin.dashboard.addProjectDescription')}
                      icon={Plus}
                      color="text-blue-500"
                      bgColor="bg-blue-500"
                      onPress={() => router.push('/admin/projects/new')}
                    />
                    <QuickAction
                      label={t('admin.dashboard.updateAbout')}
                      description={t('admin.dashboard.updateAboutDescription')}
                      icon={User}
                      color="text-green-500"
                      bgColor="bg-green-500"
                      onPress={() => router.push('/admin/about')}
                    />
                    <QuickAction
                      label={t('admin.dashboard.manageContacts')}
                      description={t('admin.dashboard.manageContactsDescription')}
                      icon={Mail}
                      color="text-orange-500"
                      bgColor="bg-orange-500"
                      onPress={() => router.push('/admin/contacts')}
                    />
                    <QuickAction
                      label={t('admin.dashboard.viewPortfolio')}
                      description={t('admin.dashboard.viewPortfolioDescription')}
                      icon={ExternalLink}
                      color="text-purple-500"
                      bgColor="bg-purple-500"
                      onPress={() => router.replace('/')}
                    />
                  </View>
                </View>
              </Card>
            </View>

            {/* Recent Projects */}
            <View className={cn(isWeb ? 'lg:col-span-2' : '')}>
              <Card variant="outlined">
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">{t('admin.dashboard.recentProjects')}</Text>
                    <Button size="sm" rightIcon={<Plus size={16} />} onPress={() => router.push('/admin/projects/new')}>
                      {t('common.add')}
                    </Button>
                  </View>
                  {recentProjects.length === 0 ? (
                    <View className="align-center py-12">
                      <Text className="text-gray-400 dark:text-white mb-4 opacity-50">
                        <FolderGit2 size={48} />
                      </Text>
                      <Text className="text-gray-500 dark:text-gray-400 mb-2">{t('admin.dashboard.noProjects')}</Text>
                      <Text className="text-sm text-gray-400 dark:text-gray-500 text-center mb-4">
                        {t('admin.dashboard.createFirstHint')}
                      </Text>
                      <Button size="sm" rightIcon={<Plus size={16} />} onPress={() => router.push('/admin/projects/new')}>
                        {t('admin.dashboard.createProject')}
                      </Button>
                    </View>
                  ) : (
                    <View className="space-y-3">
                      {recentProjects.map((project) => (
                        <ProjectRow key={project.id} project={project} onPress={() => router.push(`/admin/projects/${project.id}`)} />
                      ))}
                      <Pressable onPress={() => router.push('/admin/projects')} className="mt-2 flex-row items-center gap-1">
                        <Text className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                          {t('home.viewAllProjects')}
                        </Text>
                        <Text className="text-primary-600 dark:text-primary-400">
                          <ArrowRight size={14} />
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>
    </AdminSidebar>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, onPress, className }: { title: string; value: number; icon: any; color: string; bgColor: string; onPress?: () => void; className?: string }) {
  return (
    <Pressable onPress={onPress} className={cn('p-5 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface', onPress && 'hover:bg-gray-50 dark:hover:bg-dark-surface/80 cursor-pointer transition-colors', className)}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</Text>
          <Text className={cn('font-bold text-3xl', color)}>{value}</Text>
        </View>
        <View className={cn('p-3 rounded-xl', bgColor)}>
          <Text className="text-white">
            <Icon size={28} />
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function QuickAction({ label, description, icon: Icon, color, bgColor, onPress }: { label: string; description: string; icon: any; color: string; bgColor: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-transparent dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-surface/80 transition-colors">
      <View className={cn('p-3 rounded-xl', bgColor)}>
        <Text className="text-white">
          <Icon size={22} />
        </Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-medium text-gray-900 dark:text-gray-100">{label}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{description}</Text>
      </View>
      <Text className="text-gray-400 dark:text-white">
        <ArrowRight size={20} />
      </Text>
    </Pressable>
  );
}

function ProjectRow({ project, onPress }: { project: any; onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface/80 transition-colors">
      {project.image_url && (
        <Image source={{ uri: project.image_url }} style={styles.thumb} resizeMode="cover" />
      )}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">{project.title}</Text>
        </View>
        <Text className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {project.tech_stack?.slice(0, 3).join(', ') ?? t('common.noTechnologies')}
        </Text>
      </View>
      <Text className="text-gray-400 dark:text-white">
        <ArrowRight size={20} />
      </Text>
    </Pressable>
  );
}

import { Image } from 'react-native';
import { useState } from 'react';

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
});