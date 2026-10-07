import { ScrollView, View, Text, StyleSheet, RefreshControl, Image, Pressable, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Github, ExternalLink, Filter, ChevronDown, Search } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { useProjects } from '@/lib/queries';
import { generateGlobalMetadata } from '@/lib/seo-metadata';
import { useEffect, useState } from 'react';
import { useScrollNav } from '@/components/ScrollContext';

export async function generateMetadata() {
  return generateGlobalMetadata();
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const { data: projects, isLoading, isPaused, isError, error, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { onScroll } = useScrollNav();

  const allTechStack = Array.from(
    new Set(projects?.flatMap((p) => p.tech_stack ?? []) ?? [])
  ).sort();

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.short_description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTech = selectedTech === 'all' ||
      project.tech_stack?.includes(selectedTech);

    return matchesSearch && matchesTech;
  }) ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-dark-bg w-full"
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View className={cn('w-full mx-auto', isWeb ? 'max-w-6xl px-8 lg:px-12' : 'px-4')}>
        {/* Header */}
        <View className={cn('py-12 z-50 relative', isWeb ? 'pt-36 lg:pt-40' : 'pt-12')} style={styles.header}>
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className={cn('font-bold text-gray-900 dark:text-white', isWeb ? 'text-4xl' : 'text-3xl')}>
                Projects
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          </View>

          {/* Search & Filters */}
          <View className={cn('gap-4 items-stretch justify-between z-50', isWeb ? 'flex-row items-center' : 'flex-col')}>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} stroke="gray" />}
              className={cn(isWeb ? 'flex-1 max-w-md' : 'w-full')}
            />
            <Select
              value={selectedTech}
              onChange={setSelectedTech}
              options={[
                { value: 'all', label: 'All' },
                ...allTechStack.map((tech) => ({ value: tech, label: tech })),
              ]}
              placeholder="Filter by technology"
              className={cn(isWeb ? 'w-64' : 'w-full')}
              leftIcon={<Filter size={20} stroke="gray" />}
            />
          </View>
        </View>

        {/* Projects Grid */}
        {isPaused && !projects?.length ? (
          <View className="px-4 py-16 align-center">
            <Card variant="outlined" className="p-12 align-center max-w-md">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Menunggu koneksi…
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Anda offline. Nyalakan internet — data dimuat otomatis.
              </Text>
              <Button variant="outline" onPress={() => refetch()}>
                Coba lagi
              </Button>
            </Card>
          </View>
        ) : isLoading ? (
          <View className="px-4 py-12 align-center">
            {[1, 2, 3].map((i) => (
              <ProjectSkeleton key={i} />
            ))}
          </View>
        ) : isError ? (
          <View className="px-4 py-16 align-center">
            <Card variant="outlined" className="p-12 align-center max-w-md">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Gagal memuat projects
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4" numberOfLines={2}>
                {error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.'}
              </Text>
              <Button variant="outline" onPress={() => refetch()}>
                Coba lagi
              </Button>
            </Card>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View className="px-4 py-16 align-center">
            <Card variant="outlined" className="p-12 align-center max-w-md">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                No projects found
              </Text>
              {(searchQuery || selectedTech !== 'all') && (
                <Button variant="outline" onPress={() => { setSearchQuery(''); setSelectedTech('all'); }}>
                  Clear Filters
                </Button>
              )}
            </Card>
          </View>
        ) : (
          <View className={cn('px-4 gap-4 pb-16', isWeb ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex-col')}>
            {filteredProjects.map((project) => (
              <View key={project.id} className={cn(!isWeb && 'w-full shrink-0 self-start')}>
                <ProjectCard key={project.id} project={project} isWeb={isWeb} onPress={() => router.push(`/projects/${project.id}`)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ProjectCard({ project, onPress, isWeb }: { project: any; onPress: () => void; isWeb?: boolean }) {
  return (
    <Pressable onPress={onPress} className={cn('group', !isWeb && 'w-full shrink-0 self-start')}>
      <Card variant="outlined" className={cn(isWeb && 'h-full group-hover:shadow-xl transition-all duration-300')}>
        {project.image_url && (
          <View className="relative h-48 mb-4 rounded-lg overflow-hidden">
            <Image
              source={{ uri: project.image_url }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>
        )}
        <View className={cn('flex-col shrink-0', isWeb && 'flex-1')}>
          <View className="flex-row items-start justify-between gap-2 mb-2">
            <Text className="font-semibold text-gray-900 dark:text-gray-100 shrink-0" numberOfLines={1}>
              {project.title}
            </Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-4 shrink-0" numberOfLines={3}>
            {project.short_description ?? project.description?.slice(0, 120) ?? 'No description available'}
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {project.tech_stack?.slice(0, 5).map((tech: string) => (
              <Badge key={tech} variant="outline" size="sm">{tech}</Badge>
            ))}
            {project.tech_stack && project.tech_stack.length > 5 && (
              <Badge variant="outline" size="sm">+{project.tech_stack.length - 5}</Badge>
            )}
          </View>
          <View className="flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-row gap-2">
              {project.github_url && (
                <Pressable onPress={(e: any) => { e.stopPropagation(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <Github size={18} stroke="#9ca3af" />
                </Pressable>
              )}
              {project.demo_url && (
                <Pressable onPress={(e: any) => { e.stopPropagation(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <ExternalLink size={18} stroke="#9ca3af" />
                </Pressable>
              )}
            </View>
            <View className="flex-row items-center gap-1">
              <ChevronDown size={14} stroke="#9ca3af" />
              <Text className="text-sm text-gray-500 dark:text-gray-400">View Details</Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function ProjectSkeleton() {
  return (
    <Card variant="outlined" className="h-[350px] animate-pulse">
      <View className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
      <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
      <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
      <View className="flex-row gap-2">
        <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full px-3 w-20" />
        <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full px-3 w-24" />
        <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full px-3 w-16" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    minHeight: 200,
  },
});