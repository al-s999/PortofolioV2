import { View, Pressable, Text, ScrollView, Keyboard, Alert, Platform, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Trash2, X, ExternalLink, Github } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Modal } from '@/components/ui/Modal';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProjects } from '@/lib/queries';
import { useCreateProject } from '@/lib/queries';
import { useUpdateProject } from '@/lib/queries';
import { useDeleteProject } from '@/lib/queries';
import { useUploadImage } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';

const techStackSchema = z.string().min(1);
const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image']),
  content: z.string().optional(),
  image_url: z.string().optional(),
  caption: z.string().optional(),
});

const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  short_description: z.string().max(200, 'Short description must be under 200 characters').default(''),
  image_url: z.string().url('Invalid image URL').nullable().default(null),
  tech_stack: z.array(techStackSchema).min(1, 'At least one technology is required'),
  github_url: z.string().url('Invalid GitHub URL').nullable().default(null),
  demo_url: z.string().url('Invalid demo URL').nullable().default(null),
  featured: z.boolean(),
  order_index: z.number().default(0),
  content_blocks: z.array(contentBlockSchema),
});

type ProjectForm = z.infer<typeof projectSchema>;

const TECH_SUGGESTIONS = [
  'React', 'React Native', 'Expo', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
  'Next.js', 'Tailwind CSS', 'NativeWind', 'PostgreSQL', 'MongoDB', 'Firebase',
  'Supabase', 'GraphQL', 'REST API', 'Docker', 'AWS', 'Vercel', 'Git', 'GitHub Actions',
  'Redux', 'Zustand', 'TanStack Query', 'Prisma', 'Drizzle', 'Jest', 'Testing Library',
];

export default function AdminProjectNewScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string | undefined;
  const isEditing = !!projectId;

  const { data: projects } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const uploadImage = useUploadImage();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProjectForm>({
    // @ts-ignore - zodResolver type inference issue with .default()
    resolver: zodResolver(projectSchema as any),
    defaultValues: {
      title: '',
      description: '',
      short_description: '',
      image_url: '',
      tech_stack: [],
      github_url: '',
      demo_url: '',
      featured: false,
      order_index: 0,
      content_blocks: [],
    },
  });

  // @ts-ignore - Path type inference issue with zod schema
  const { fields: techFields, append: appendTech, remove: removeTech } = useFieldArray({
    control,
    // @ts-ignore
    name: 'tech_stack' as Path<ProjectForm>,
  });

  const { fields: blockFields, append: appendBlock, remove: removeBlock, move: moveBlock } = useFieldArray({
    control,
    name: 'content_blocks',
  });

  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    if (isEditing && projectId && projects) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        reset({
          title: project.title,
          description: project.description,
          short_description: project.short_description ?? '',
          image_url: project.image_url ?? '',
          tech_stack: project.tech_stack ?? [],
          github_url: project.github_url ?? '',
          demo_url: project.demo_url ?? '',
          featured: project.featured ?? false,
          order_index: project.order_index ?? 0,
          content_blocks: project.content_blocks ?? [],
        });
        if (project.image_url) setImagePreview(project.image_url);
      }
    } else if (!isEditing) {
      reset({
        title: '',
        description: '',
        short_description: '',
        image_url: '',
        tech_stack: [],
        github_url: '',
        demo_url: '',
        featured: false,
        order_index: projects?.length ?? 0,
        content_blocks: [],
      });
      setImagePreview(null);
    }
  }, [isEditing, projectId, projects, reset]);

  const handleImagePick = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) await uploadImageFile(file);
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImagePreview(uri);
        setValue('image_url', uri);
      }
    }
  };

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `projects/${Date.now()}-${file.name}`;
      const url = await uploadImage.mutateAsync({ file, path });
      setImagePreview(url);
      setValue('image_url', url);
      showToast({ type: 'success', title: 'Uploaded', description: 'Image uploaded successfully' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('image_url', '');
  };

  const addTech = () => {
    const value = techInput.trim();
    if (value && !watch('tech_stack').includes(value)) {
      appendTech(value as any);
      setTechInput('');
    }
  };

  const handleBlockImagePick = async (index: number) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          setUploading(true);
          try {
            const path = `projects/blocks/${Date.now()}-${file.name}`;
            const url = await uploadImage.mutateAsync({ file, path });
            setValue(`content_blocks.${index}.image_url`, url, { shouldDirty: true });
          } catch (error: any) {
            showToast({ type: 'error', title: 'Upload failed', description: error.message });
          } finally {
            setUploading(false);
          }
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setValue(`content_blocks.${index}.image_url`, result.assets[0].uri, { shouldDirty: true });
      }
    }
  };

  const handleSubmitForm = async (data: any) => {
    setSaving(true);
    Keyboard.dismiss();

    try {
      if (isEditing && projectId) {
        await updateProject.mutateAsync({ id: projectId, ...data });
        showToast({ type: 'success', title: 'Updated', description: 'Project has been updated.' });
      } else {
        await createProject.mutateAsync(data);
        showToast({ type: 'success', title: 'Created', description: 'Project has been created.' });
        router.replace('/admin/projects');
      }
    } catch (error: any) {
      showToast({ type: 'error', title: 'Failed', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await deleteProject.mutateAsync(projectId);
      showToast({ type: 'success', title: 'Deleted', description: 'Project has been removed.' });
      router.replace('/admin/projects');
    } catch (error: any) {
      showToast({ type: 'error', title: 'Failed', description: error.message });
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  return (
    <AdminSidebar>
      <ScrollView
        className="flex-1 bg-gray-50 dark:bg-dark-bg"
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className={cn('p-6', isWeb ? 'max-w-4xl mx-auto w-full' : 'w-full')}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft size={24} color="gray" />
              </Pressable>
              <View>
                <Text className={cn('font-bold', isWeb ? 'text-2xl' : 'text-xl')}>
                  {isEditing ? 'Edit' : 'New Project'}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              {isEditing && (
                <Button variant="destructive-ghost" onPress={() => setDeleteModal(true)} leftIcon={<Trash2 size={18} className="text-red-500" />}>
                  Delete
                </Button>
              )}
              <Button
                rightIcon={<Save size={18} />}
                onPress={() => handleSubmit(handleSubmitForm)()}
                loading={saving || createProject.isPending || updateProject.isPending}
                disabled={!isDirty && !saving}
              >
                {saving || createProject.isPending || updateProject.isPending ? 'Saving...' : 'Save Project'}
              </Button>
            </View>
          </View>

          <View>
            {/* Basic Info */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">Basic Information</Text>

                <View className="space-y-4">
                  <Input
                    label="Project Title"
                    placeholder="e.g., E-Commerce Platform"
                    error={errors.title?.message}
                    {...register('title')}
                  />

                  <Textarea
                    label="Description"
                    placeholder="Detailed description of the project, challenges, solutions, and outcomes..."
                    rows={6}
                    error={errors.description?.message}
                    {...register('description')}
                  />

                  <Input
                    label="Short Description"
                    placeholder="Brief summary for project cards (max 200 chars)"
                    error={errors.short_description?.message}
                    {...register('short_description')}
                    maxLength={200}
                  />
                </View>
              </View>
            </Card>

            {/* Image */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">Project Image</Text>

                <View className="space-y-4">
                  {imagePreview ? (
                    <View className="relative">
                      <Image
                        source={{ uri: imagePreview }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <Pressable onPress={removeImage} className="absolute top-2 right-2 p-2 rounded-full bg-black/50">
                        <X size={20} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={handleImagePick} className={cn(
                      'aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600',
                      'flex items-center justify-center gap-3',
                      'hover:border-primary-500 dark:hover:border-primary-500 transition-colors'
                    )}>
                      <View className="align-center">
                        <ImageIcon size={48} color="gray" />
                        <Text className="text-gray-500 dark:text-gray-400 mt-2">
                          Click to upload or drag & drop
                        </Text>
                        <Text className="text-sm text-gray-400 dark:text-gray-500">
                          Recommended: 16:9 aspect ratio, max 2MB
                        </Text>
                      </View>
                    </Pressable>
                  )}

                  <Input
                    label="Or enter image URL"
                    placeholder="https://example.com/image.jpg"
                    value={watch('image_url') || ''}
                    onChangeText={(v) => { setValue('image_url', v); setImagePreview(v || null); }}
                    error={errors.image_url?.message}
                  />
                </View>
              </View>
            </Card>

            {/* Content Blocks */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">Additional Content (Images & Text)</Text>
                
                <View className="space-y-6">
                  {blockFields.map((field, index) => {
                    const blockType = watch(`content_blocks.${index}.type`);
                    const blockImage = watch(`content_blocks.${index}.image_url`);
                    
                    return (
                      <View key={field.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl relative">
                        <View className="absolute right-2 top-2 z-10 flex-row gap-2 bg-white dark:bg-dark-surface p-1 rounded-md shadow-sm">
                          <Pressable onPress={() => moveBlock(index, index - 1)} disabled={index === 0} className={cn("p-1", index === 0 && "opacity-50")}>
                            <Text className="text-gray-500 text-xs">Up</Text>
                          </Pressable>
                          <Pressable onPress={() => moveBlock(index, index + 1)} disabled={index === blockFields.length - 1} className={cn("p-1", index === blockFields.length - 1 && "opacity-50")}>
                            <Text className="text-gray-500 text-xs">Down</Text>
                          </Pressable>
                          <Pressable onPress={() => removeBlock(index)} className="p-1">
                            <Trash2 size={16} className="text-red-500" />
                          </Pressable>
                        </View>
                        
                        {blockType === 'text' ? (
                          <View className="mt-2">
                            <Textarea
                              label={`Text Block ${index + 1}`}
                              placeholder="Add more detailed project explanations here..."
                              rows={4}
                              {...register(`content_blocks.${index}.content`)}
                            />
                          </View>
                        ) : (
                          <View className="mt-2">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image {index + 1}</Text>
                            
                            {blockImage ? (
                              <View className="relative mb-4">
                                <Image
                                  source={{ uri: blockImage }}
                                  style={{ width: '100%', aspectRatio: 16/9, borderRadius: 8 }}
                                  resizeMode="cover"
                                />
                                <Pressable 
                                  onPress={() => setValue(`content_blocks.${index}.image_url`, '')} 
                                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50"
                                >
                                  <X size={16} color="white" />
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable onPress={() => handleBlockImagePick(index)} className="aspect-video mb-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                <ImageIcon size={32} color="gray" />
                                <Text className="text-gray-500 text-sm mt-2">Upload Image</Text>
                              </Pressable>
                            )}
                            
                            <Input
                              placeholder="Image Caption (Optional)"
                              {...register(`content_blocks.${index}.caption`)}
                            />
                            
                            <Input
                              placeholder="Or external image URL"
                              className="mt-2"
                              value={blockImage || ''}
                              onChangeText={(v) => setValue(`content_blocks.${index}.image_url`, v)}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
                
                <View className="flex-row gap-3 mt-6">
                  <Button variant="outline" onPress={() => appendBlock({ id: Math.random().toString(), type: 'text' })}>
                    + Add Text
                  </Button>
                  <Button variant="outline" onPress={() => appendBlock({ id: Math.random().toString(), type: 'image' })}>
                    + Add Image
                  </Button>
                </View>
              </View>
            </Card>

            {/* Tech Stack */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">Tech Stack</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {watch('tech_stack').length} technologies
                  </Text>
                </View>

                <View className="mb-4">
                  <View className="flex-row gap-2 mt-2">
                    <Input
                      placeholder="Type and press Enter or click Add"
                      value={techInput}
                      onChangeText={(v) => setTechInput(v)}
                      onSubmitEditing={addTech}
                      rightElement={
                        <Pressable onPress={addTech} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 rounded-md active:opacity-70">
                          <Text className="text-primary-700 dark:text-primary-300 font-medium text-sm">Add</Text>
                        </Pressable>
                      }
                      className="flex-1"
                    />
                  </View>
                  <View className="flex-row flex-wrap gap-1.5 mt-2">
                    {TECH_SUGGESTIONS.filter(t => !watch('tech_stack').includes(t)).slice(0, 10).map((tech) => (
                      <Pressable
                        key={tech}
                        onPress={() => { appendTech(tech as any); }}
                        className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                      >
                        + {tech}
                      </Pressable>
                    ))}
                  </View>
                </View>

                {techFields.length === 0 ? (
                  <Text className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No technologies added yet. Add at least one.
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {techFields.map((field, index) => (
                      <View key={field.id} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
                        <Text className="text-primary-700 dark:text-primary-300 font-medium">{(field as any).value || field}</Text>
                        <Pressable onPress={() => removeTech(index)} className="p-1 -ml-1 -mr-1">
                          <X size={14} color="#0369a1" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Card>

            {/* Links */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">Links</Text>

                <View className="space-y-4">
                  <Input
                    label="GitHub Repository"
                    placeholder="https://github.com/username/repo"
                    leftIcon={<Github size={20} color="gray" />}
                    error={errors.github_url?.message}
                    {...register('github_url')}
                  />

                  <Input
                    label="Live Demo URL"
                    placeholder="https://your-demo.com"
                    leftIcon={<ExternalLink size={20} color="gray" />}
                    error={errors.demo_url?.message}
                    {...register('demo_url')}
                  />
                </View>
              </View>
            </Card>

            {/* Settings */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">Settings</Text>

                <View className="flex-row items-center justify-between py-4">
                  <View>
                    <Text className="font-medium text-gray-900 dark:text-gray-100">Featured Project</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Show on homepage featured section</Text>
                  </View>
                  <Controller
                    name="featured"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Pressable
                        onPress={() => field.onChange(!field.value)}
                        className={cn(
                          'relative w-12 h-7 rounded-full transition-colors',
                          field.value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      >
                        <Animated.View
                          style={[
                            styles.toggleThumb,
                            { transform: [{ translateX: field.value ? 24 : 2 }] },
                          ]}
                        />
                      </Pressable>
                    )}
                  />
                </View>

                <Separator className="my-4" />

                <View className="flex-row items-center justify-between py-4">
                  <View>
                    <Text className="font-medium text-gray-900 dark:text-gray-100">Display Order</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Lower numbers appear first</Text>
                  </View>
                  <Controller
                    name="order_index"
                    control={control}
                    rules={{ required: true, min: 0 }}
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={String(field.value ?? 0)}
                        onChangeText={(v) => field.onChange(Number(v))}
                        className="w-24"
                        inputMode="numeric"
                      />
                    )}
                  />
                </View>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Delete Modal */}
      {isEditing && (
        <Modal
          visible={deleteModal}
          onClose={() => setDeleteModal(false)}
          title="Delete Project"
          description="This will permanently delete the project. This action cannot be undone."
          size="sm"
        >
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" onPress={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onPress={handleDelete} loading={deleting}>
              Delete
            </Button>
          </View>
        </Modal>
      )}
    </AdminSidebar>
  );
}

import { Animated } from 'react-native';

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});