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
import { withAutoTranslations } from '@/lib/queries';
import { useLanguage } from '@/lib/i18n/LanguageContext';
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
  const [translating, setTranslating] = useState(false);
  const [i18nPending, setI18nPending] = useState(false);
  const { t } = useLanguage();
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
    getValues,
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
      showToast({ type: 'success', title: t('admin.about.uploaded'), description: t('admin.projects.imageUploaded') });
    } catch (error: any) {
      showToast({ type: 'error', title: t('admin.about.uploadFailed'), description: error.message });
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
            showToast({ type: 'error', title: t('admin.about.uploadFailed'), description: error.message });
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

  const pendingToast = () => ({
    type: 'warning' as const,
    title: t('admin.projects.pendingTitle'),
    description: t('admin.projects.pendingDescription'),
  });

  const existingI18n =
    isEditing && projectId
      ? ((projects?.find((p) => p.id === projectId) as any)?.i18n ?? {})
      : {};

  const handleSubmitForm = async (data: any) => {
    setSaving(true);
    Keyboard.dismiss();

    try {
      // Dual-direction (source lang unknown): fills i18n.id + i18n.en.
      // Translation failure is non-fatal — source still commits.
      const { payload, pending } = await withAutoTranslations('projects', {
        ...data,
        i18n: existingI18n,
      });
      if (isEditing && projectId) {
        await updateProject.mutateAsync({ id: projectId, ...payload });
        setI18nPending(pending);
        if (pending) {
          showToast(pendingToast());
        } else {
          showToast({ type: 'success', title: t('admin.projects.updated'), description: t('admin.projects.updatedDescription') });
        }
      } else {
        await createProject.mutateAsync(payload);
        if (pending) {
          // Create navigates away, so no badge survives — the single
          // warning toast is the pending signal; re-translate from edit.
          showToast(pendingToast());
        } else {
          showToast({ type: 'success', title: t('admin.projects.created'), description: t('admin.projects.createdDescription') });
        }
        router.replace('/admin/projects');
      }
    } catch (error: any) {
      showToast({ type: 'error', title: t('admin.projects.failed'), description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // "Translate ulang": re-runs full collect+translate+merge on current values.
  const handleTranslateAgain = async () => {
    if (!isEditing || !projectId) return;
    setTranslating(true);
    try {
      const { payload, pending } = await withAutoTranslations('projects', {
        ...getValues(),
        i18n: existingI18n,
      });
      await updateProject.mutateAsync({ id: projectId, ...payload });
      setI18nPending(pending);
      if (pending) {
        showToast(pendingToast());
      } else {
        showToast({
          type: 'success',
          title: t('common.retranslatedTitle'),
          description: t('common.retranslatedDescription'),
        });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: t('admin.projects.failed'), description: error.message });
    } finally {
      setTranslating(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await deleteProject.mutateAsync(projectId);
      showToast({ type: 'success', title: t('admin.projects.deleted'), description: t('admin.projects.deletedDescription') });
      router.replace('/admin/projects');
    } catch (error: any) {
      showToast({ type: 'error', title: t('admin.projects.failed'), description: error.message });
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
                  {isEditing ? t('admin.projects.editTitle') : t('admin.projects.newTitle')}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              {isEditing && (
                <Button variant="destructive-ghost" onPress={() => setDeleteModal(true)} leftIcon={<Trash2 size={18} className="text-red-500" />}>
                  {t('common.delete')}
                </Button>
              )}
              {i18nPending && (
                <View className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800 self-center">
                  <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    {t('common.translationPending')}
                  </Text>
                </View>
              )}
              {i18nPending && isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleTranslateAgain}
                  loading={translating}
                  disabled={saving || translating}
                >
                  {t('common.retranslate')}
                </Button>
              )}
              <Button
                rightIcon={<Save size={18} />}
                onPress={() => handleSubmit(handleSubmitForm)()}
                loading={saving || createProject.isPending || updateProject.isPending}
                disabled={!isDirty && !saving}
              >
                {saving || createProject.isPending || updateProject.isPending ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </View>
          </View>

          <View>
            {/* Basic Info */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">{t('admin.projects.basicInfo')}</Text>

                <View className="space-y-4">
                  <Input
                    label={t('admin.projects.titleLabel')}
                    placeholder={t('admin.projects.titlePlaceholder')}
                    error={errors.title?.message}
                    {...register('title')}
                  />

                  <Textarea
                    label={t('admin.projects.descriptionLabel')}
                    placeholder={t('admin.projects.descriptionPlaceholder')}
                    rows={6}
                    error={errors.description?.message}
                    {...register('description')}
                  />

                  <Input
                    label={t('admin.projects.shortDescriptionLabel')}
                    placeholder={t('admin.projects.shortDescriptionPlaceholder')}
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
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">{t('admin.projects.imageTitle')}</Text>

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
                          {t('admin.projects.uploadDropHint')}
                        </Text>
                        <Text className="text-sm text-gray-400 dark:text-gray-500">
                          {t('admin.projects.uploadSizeHint')}
                        </Text>
                      </View>
                    </Pressable>
                  )}

                  <Input
                    label={t('admin.projects.imageUrlLabel')}
                    placeholder={t('admin.projects.imageUrlPlaceholder')}
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
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">{t('admin.projects.additionalContent')}</Text>
                
                <View className="space-y-6">
                  {blockFields.map((field, index) => {
                    const blockType = watch(`content_blocks.${index}.type`);
                    const blockImage = watch(`content_blocks.${index}.image_url`);
                    
                    return (
                      <View key={field.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl relative">
                        <View className="absolute right-2 top-2 z-10 flex-row gap-2 bg-white dark:bg-dark-surface p-1 rounded-md shadow-sm">
                          <Pressable onPress={() => moveBlock(index, index - 1)} disabled={index === 0} className={cn("p-1", index === 0 && "opacity-50")}>
                            <Text className="text-gray-500 text-xs">{t('admin.projects.moveUp')}</Text>
                          </Pressable>
                          <Pressable onPress={() => moveBlock(index, index + 1)} disabled={index === blockFields.length - 1} className={cn("p-1", index === blockFields.length - 1 && "opacity-50")}>
                            <Text className="text-gray-500 text-xs">{t('admin.projects.moveDown')}</Text>
                          </Pressable>
                          <Pressable onPress={() => removeBlock(index)} className="p-1">
                            <Trash2 size={16} className="text-red-500" />
                          </Pressable>
                        </View>
                        
                        {blockType === 'text' ? (
                          <View className="mt-2">
                            <Textarea
                              label={`${t('admin.projects.textBlockLabel')} ${index + 1}`}
                              placeholder={t('admin.projects.textBlockPlaceholder')}
                              rows={4}
                              {...register(`content_blocks.${index}.content`)}
                            />
                          </View>
                        ) : (
                          <View className="mt-2">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.projects.imageBlockTitle').replace('{index}', String(index + 1))}</Text>
                            
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
                                <Text className="text-gray-500 text-sm mt-2">{t('admin.projects.uploadImage')}</Text>
                              </Pressable>
                            )}
                            
                            <Input
                              placeholder={t('admin.projects.imageCaptionPlaceholder')}
                              {...register(`content_blocks.${index}.caption`)}
                            />
                            
                            <Input
                              placeholder={t('admin.projects.externalImagePlaceholder')}
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
                    {t('admin.projects.addTextBlock')}
                  </Button>
                  <Button variant="outline" onPress={() => appendBlock({ id: Math.random().toString(), type: 'image' })}>
                    {t('admin.projects.addImageBlock')}
                  </Button>
                </View>
              </View>
            </Card>

            {/* Tech Stack */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">{t('admin.projects.techStack')}</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.projects.techCount').replace('{count}', String(watch('tech_stack').length))}
                  </Text>
                </View>

                <View className="mb-4">
                  <View className="flex-row gap-2 mt-2">
                    <Input
                      placeholder={t('admin.projects.techPlaceholder')}
                      value={techInput}
                      onChangeText={(v) => setTechInput(v)}
                      onSubmitEditing={addTech}
                      rightElement={
                        <Pressable onPress={addTech} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 rounded-md active:opacity-70">
                          <Text className="text-primary-700 dark:text-primary-300 font-medium text-sm">{t('common.add')}</Text>
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
                    {t('admin.projects.noTechHint')}
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
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">{t('admin.projects.links')}</Text>

                <View className="space-y-4">
                  <Input
                    label={t('admin.projects.githubLabel')}
                    placeholder={t('admin.projects.githubPlaceholder')}
                    leftIcon={<Github size={20} color="gray" />}
                    error={errors.github_url?.message}
                    {...register('github_url')}
                  />

                  <Input
                    label={t('admin.projects.demoLabel')}
                    placeholder={t('admin.projects.demoPlaceholder')}
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
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">{t('admin.projects.settings')}</Text>

                <View className="flex-row items-center justify-between py-4">
                  <View>
                    <Text className="font-medium text-gray-900 dark:text-gray-100">{t('admin.projects.featured')}</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">{t('admin.projects.featuredHint')}</Text>
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
                    <Text className="font-medium text-gray-900 dark:text-gray-100">{t('admin.projects.orderLabel')}</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">{t('admin.projects.orderHint')}</Text>
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
          title={t('admin.projects.deleteTitle')}
          description={t('admin.projects.deleteDescription')}
          size="sm"
        >
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" onPress={() => setDeleteModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onPress={handleDelete} loading={deleting}>
              {t('common.delete')}
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