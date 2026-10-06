import { View, Pressable, Text, ScrollView, RefreshControl, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Plus, Search, Filter, Trash2, Edit2, Eye, EyeOff, Star, StarOff, MoreVertical, Loader2, ArrowRight, RefreshCw } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Modal } from '@/components/ui/Modal';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProjects, useUpdateProject } from '@/lib/queries';
import { useDeleteProject } from '@/lib/queries';
import { useReorderProjects } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { formatDate } from '@/lib/utils/cn';

export default function AdminProjectsScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const { data: projects, isLoading, refetch } = useProjects();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const reorderProjects = useReorderProjects();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'featured' | 'draft'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; project: any }>({ open: false, project: null });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (selectedFilter === 'featured') matchesFilter = project.featured;
    if (selectedFilter === 'draft') matchesFilter = !project.featured;

    return matchesSearch && matchesFilter;
  }) ?? [];

  const handleDelete = async () => {
    if (!deleteModal.project) return;

    try {
      await deleteProject.mutateAsync(deleteModal.project.id);
      showToast({
        type: 'success',
        title: 'Deleted',
        description: 'Project has been removed.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to delete',
        description: error.message,
      });
    } finally {
      setDeleteModal({ open: false, project: null });
    }
  };

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
        {/* Header */}
        <View className={cn('p-6', isWeb ? 'max-w-7xl mx-auto w-full' : 'w-full')}>
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className={cn('font-bold', isWeb ? 'text-3xl' : 'text-2xl')}>
                Projects
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Button variant="ghost" onPress={handleRefresh} leftIcon={<RefreshCw size={18} />} loading={refreshing}>
                Refresh
              </Button>
              <Button rightIcon={<Plus size={18} />} onPress={() => router.push('/admin/projects/new')}>
                New Project
              </Button>
            </View>
          </View>

          {/* Search & Filters */}
          <View className={cn('gap-4 mb-6', isWeb ? 'flex-row' : 'flex-col')}>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} color="gray" />}
              className={cn('w-full', isWeb && 'flex-1 max-w-md')}
            />
            <Select
              value={selectedFilter}
              onChange={(v) => setSelectedFilter(v as 'all' | 'featured' | 'draft')}
              options={[
                { value: 'all', label: 'All Projects' },
                { value: 'featured', label: 'Featured Only' },
                { value: 'draft', label: 'Drafts Only' },
              ]}
              className={cn(isWeb ? 'w-48' : 'w-full')}
              leftIcon={<Filter size={20} stroke="gray" />}
            />
          </View>
        </View>

        {/* Projects List */}
        <View className={cn('px-6 pb-6', isWeb ? 'max-w-7xl mx-auto w-full' : 'w-full')}>
          {isLoading ? (
            <View className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <ProjectRowSkeleton key={i} />
              ))}
            </View>
          ) : filteredProjects.length === 0 ? (
            <Card variant="outlined" className="p-12 align-center">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || selectedFilter !== 'all' ? 'No projects found' : 'No projects yet'}
              </Text>
              {(searchQuery || selectedFilter !== 'all') && (
                <Button variant="outline" onPress={() => { setSearchQuery(''); setSelectedFilter('all'); }}>
                  Clear Filters
                </Button>
              )}
              {(!searchQuery && selectedFilter === 'all') && (
                <Button rightIcon={<Plus size={18} />} onPress={() => router.push('/admin/projects/new')} className="mt-4">
                  Create Project
                </Button>
              )}
            </Card>
          ) : (
            <View className="space-y-4">
              {filteredProjects.map((project, index) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={index}
                  onView={() => router.push(`/admin/projects/${project.id}`)}
                  onEdit={() => router.push(`/admin/projects/${project.id}?mode=edit`)}
                  onDelete={() => setDeleteModal({ open: true, project })}
                  onToggleFeatured={async () => {
                    try {
                      await updateProject.mutateAsync({ id: project.id, featured: !project.featured });
                    } catch (error) {
                      showToast({ type: 'error', title: 'Failed', description: 'Failed to update visibility' });
                    }
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, project: null })}
        title="Delete Project"
        description="This action cannot be undone. Are you sure you want to delete this project?"
        size="sm"
      >
        <View className="flex-row justify-end gap-3">
          <Button variant="ghost" onPress={() => setDeleteModal({ open: false, project: null })}>
            Cancel
          </Button>
          <Button variant="destructive" onPress={handleDelete} loading={deleteProject.isPending}>
            Delete
          </Button>
        </View>
      </Modal>
    </AdminSidebar>
  );
}

function ProjectRow({ project, index, onEdit, onDelete, onView, onToggleFeatured }: {
  project: any;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <Card variant="outlined" className={cn(!project.featured && 'opacity-50')}>
      <Pressable onPress={onView} className="p-4">
        <View className="flex-row gap-4">
          {project.image_url && (
            <Image
              source={{ uri: project.image_url }}
              style={styles.thumb}
              resizeMode="cover"
            />
          )}
          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-2 mb-2">
              <Text className="font-semibold text-gray-900 dark:text-gray-100 flex-1" numberOfLines={1}>
                {project.title}
              </Text>
            </View>
            <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2" numberOfLines={2}>
              {project.short_description ?? project.description?.slice(0, 100) ?? 'No description'}
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {project.tech_stack?.slice(0, 4).map((tech: string) => (
                <Badge key={tech} variant="outline" size="sm">{tech}</Badge>
              ))}
              {project.tech_stack && project.tech_stack.length > 4 && (
                <Badge variant="outline" size="sm">+{project.tech_stack.length - 4}</Badge>
              )}
            </View>
            <Text className="text-xs text-gray-400 dark:text-gray-500">
              Updated {formatDate(project.updated_at)}
            </Text>
          </View>
          <View className="flex-col items-end gap-2">
            <View className="flex-row gap-1">
              <Pressable onPress={(e: any) => { e.stopPropagation(); onToggleFeatured(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" accessibilityLabel={project.featured ? 'Deactivate' : 'Activate'}>
                {project.featured ? <Eye size={18} stroke="gray" /> : <EyeOff size={18} stroke="gray" />}
              </Pressable>
              <Pressable onPress={(e: any) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" accessibilityLabel="Edit">
                <Edit2 size={18} stroke="gray" />
              </Pressable>
              <Pressable onPress={(e: any) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" accessibilityLabel="Delete">
                <Trash2 size={18} className="text-red-500" />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

function ProjectRowSkeleton() {
  return (
    <Card variant="outlined" className="animate-pulse">
      <View className="p-4">
        <View className="flex-row gap-4">
          <View style={styles.thumb} className="bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 space-y-3">
            <View className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <View className="flex-row gap-2">
              <View className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
              <View className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
            </View>
          </View>
          <View className="w-24" />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  thumb: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
});