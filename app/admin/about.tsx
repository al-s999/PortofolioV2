import { View, Pressable, Text, ScrollView, Keyboard, StyleSheet, Alert, Image, Platform, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Edit2 } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Modal } from '@/components/ui/Modal';
import { useAboutMe, useUpdateAboutMe, useUploadImage, withAutoTranslations } from '@/lib/queries';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Code2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.number().optional().default(3), // Optional level so it doesn't break DB if required
  category: z.enum(['frontend', 'backend', 'devops', 'design', 'other', 'data']),
  show_on_home: z.boolean().optional().default(false),
});

const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.string().min(1, 'Year is required'),
  description: z.string().optional(),
});

const experienceSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  company: z.string().min(1, 'Company is required'),
  year: z.string().min(1, 'Year is required'),
  description: z.string().min(1, 'Description is required'),
  technologies: z.array(z.string()).optional().default([]),
});

const certificateSchema = z.object({
  id: z.string().optional(),
  file_url: z.string().min(1, 'File is required'),
});

const aboutSchema = z.object({
  nickname: z.string().optional(),
  full_name: z.string().optional(),
  profession: z.string().optional(),
  years_of_experience: z.string().optional(),
  avatar_url: z.string().optional(),
  cv_url: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  skills: z.array(skillSchema),
  education: z.array(educationSchema).optional().default([]),
  experience: z.array(experienceSchema).optional().default([]),
  certificates: z.array(certificateSchema).optional().default([]),
});

type AboutForm = z.infer<typeof aboutSchema>;

const CATEGORIES = [
  { value: 'frontend', label: 'Frontend', color: 'text-blue-500' },
  { value: 'backend', label: 'Backend', color: 'text-green-500' },
  { value: 'devops', label: 'DevOps', color: 'text-orange-500' },
  { value: 'design', label: 'Design', color: 'text-pink-500' },
  { value: 'data', label: 'Data', color: 'text-purple-500' },
  { value: 'other', label: 'Other', color: 'text-gray-500' },
];

const PreviewSkillBadge = ({ name, isDark }: { name: string, isDark: boolean }) => {
  const getIcon = (name: string, isDark: boolean) => {
    const n = name.toLowerCase();
    if (n.includes('python')) return <MaterialCommunityIcons name="language-python" size={32} color="#3776AB" />;
    if (n.includes('typescript') || n === 'ts') return <MaterialCommunityIcons name="language-typescript" size={32} color="#3178C6" />;
    if (n.includes('javascript') || n === 'js') return <MaterialCommunityIcons name="language-javascript" size={32} color="#F7DF1E" />;
    if (n.includes('react')) return <MaterialCommunityIcons name="react" size={32} color="#61DAFB" />;
    if (n.includes('next')) {
      return (
        <View className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white items-center justify-center">
          <Text className="text-white dark:text-gray-900 font-bold text-xl leading-none">N</Text>
        </View>
      );
    }
    if (n.includes('html')) return <MaterialCommunityIcons name="language-html5" size={32} color="#E34F26" />;
    if (n.includes('css')) return <MaterialCommunityIcons name="language-css3" size={32} color="#1572B6" />;
    if (n === 'r' || n === 'r studio') return <MaterialCommunityIcons name="language-r" size={32} color="#276DC3" />;
    return <Code2 size={32} color={isDark ? '#d1d5db' : '#4b5563'} />;
  };

  return (
    <View className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border items-center justify-center shadow-sm">
      {getIcon(name, isDark)}
      <Text className="text-gray-700 dark:text-gray-300 font-medium text-xs mt-3 text-center" numberOfLines={1}>{name}</Text>
    </View>
  );
};

export default function AdminAboutScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const { data: aboutMe } = useAboutMe();
  const updateAboutMe = useUpdateAboutMe();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [i18nPending, setI18nPending] = useState(false);
  const { lang } = useLanguage();
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: 'skill' | 'education' | 'experience' | 'certificate' | null; index: number | null }>({ open: false, type: null, index: null });
  const { colorScheme } = useColorScheme();
  const [isMounted, setIsMounted] = useState(false);
  const uploadImage = useUploadImage();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (aboutMe?.avatar_url) {
      setImagePreview(aboutMe.avatar_url);
    }
  }, [aboutMe]);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) await uploadImageFile(file);
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImagePreview(uri);
        setValue('avatar_url', uri, { shouldDirty: true });
      }
    }
  };

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `avatars/${Date.now()}-${file.name}`;
      const url = await uploadImage.mutateAsync({ file, path });
      setImagePreview(url);
      setValue('avatar_url', url, { shouldDirty: true });
      showToast({ type: 'success', title: 'Uploaded', description: 'Avatar uploaded successfully' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('avatar_url', '', { shouldDirty: true });
  };

  const [uploadingCV, setUploadingCV] = useState(false);

  const handleCVPick = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) await uploadCVFile(file);
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const mockFile = new File([blob], file.name || `cv_${Date.now()}.pdf`, { type: 'application/pdf' });
          await uploadCVFile(mockFile);
        }
      } catch (error: any) {
        showToast({ type: 'error', title: 'Error picking CV', description: error.message });
      }
    }
  };

  const uploadCVFile = async (file: File) => {
    setUploadingCV(true);
    try {
      const path = `cv/${Date.now()}-${file.name}`;
      const url = await uploadImage.mutateAsync({ file, path });
      setValue('cv_url', url, { shouldDirty: true });
      showToast({ type: 'success', title: 'Uploaded', description: 'CV uploaded successfully' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Upload failed', description: error.message });
    } finally {
      setUploadingCV(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = isMounted ? colorScheme === 'dark' : false;

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<AboutForm>({
    resolver: zodResolver(aboutSchema as any),
    defaultValues: {
      nickname: '',
      full_name: '',
      profession: '',
      years_of_experience: '',
      content: '',
      skills: [],
      education: [],
      experience: [],
      certificates: [],
    },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill, move: moveSkill } = useFieldArray({
    control,
    name: 'skills',
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu, move: moveEdu } = useFieldArray({
    control,
    name: 'education',
  });

  const { fields: expFields, append: appendExp, remove: removeExp, move: moveExp } = useFieldArray({
    control,
    name: 'experience',
  });

  const { fields: certFields, append: appendCert, remove: removeCert, move: moveCert } = useFieldArray({
    control,
    name: 'certificates',
  });

  useEffect(() => {
    if (aboutMe) {
      reset({
        nickname: aboutMe.nickname || 'Ahmad Rosyid',
        full_name: aboutMe.full_name || 'Ahmad Rosyid A.',
        profession: aboutMe.profession || 'Web Developer & Data Scientist',
        years_of_experience: aboutMe.years_of_experience || '3+',
        avatar_url: aboutMe.avatar_url ?? '',
        cv_url: aboutMe.cv_url ?? '',
        content: aboutMe.content ?? '',
        skills: aboutMe.skills?.map((s: any) => ({
          name: s.name,
          level: s.level || 3,
          category: s.category,
          show_on_home: s.show_on_home ?? false,
        })) ?? [],
        education: aboutMe.education ?? [],
        experience: aboutMe.experience ?? [],
        certificates: aboutMe.certificates ?? [],
      });
    }
  }, [aboutMe, reset]);

  const pendingToast = () => ({
    type: 'warning' as const,
    title: lang === 'id' ? 'Tersimpan — terjemahan tertunda' : 'Saved — translation pending',
    description:
      lang === 'id'
        ? 'Konten tersimpan. Terjemahan otomatis gagal — tekan "Translate ulang".'
        : 'Content saved. Auto-translation failed — press "Translate ulang".',
  });

  const onSubmit = async (data: AboutForm) => {
    setSaving(true);
    Keyboard.dismiss();

    try {
      const source = {
        nickname: data.nickname,
        full_name: data.full_name,
        profession: data.profession,
        years_of_experience: data.years_of_experience,
        avatar_url: data.avatar_url,
        cv_url: data.cv_url,
        content: data.content,
        skills: data.skills,
        education: data.education,
        experience: data.experience,
        certificates: data.certificates as any,
        // Preserve existing mirrors; mergeTranslations keeps the rest.
        i18n: (aboutMe as any)?.i18n ?? {},
      };
      // Dual-direction (source lang unknown): fills i18n.id + i18n.en.
      // Translation failure is non-fatal — source still commits.
      const { payload, pending } = await withAutoTranslations('about_me', source);
      await updateAboutMe.mutateAsync(payload);
      setI18nPending(pending);

      if (pending) {
        showToast(pendingToast());
      } else {
        showToast({
          type: 'success',
          title: 'Saved!',
          description: 'About Me section has been updated.',
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to save',
        description: error.message ?? 'Something went wrong',
      });
    } finally {
      setSaving(false);
    }
  };

  // "Translate ulang": re-runs full collect+translate+merge on current values.
  const handleTranslateAgain = async () => {
    const values = getValues();
    setTranslating(true);
    try {
      const source = {
        ...values,
        certificates: values.certificates as any,
        i18n: (aboutMe as any)?.i18n ?? {},
      };
      const { payload, pending } = await withAutoTranslations('about_me', source);
      await updateAboutMe.mutateAsync(payload);
      setI18nPending(pending);
      if (pending) {
        showToast(pendingToast());
      } else {
        showToast({
          type: 'success',
          title: lang === 'id' ? 'Terjemahan selesai' : 'Translation complete',
          description:
            lang === 'id'
              ? 'Terjemahan ID/EN telah diperbarui.'
              : 'ID/EN translations have been updated.',
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to save',
        description: error.message ?? 'Something went wrong',
      });
    } finally {
      setTranslating(false);
    }
  };

  const addSkill = () => {
    appendSkill({ name: '', level: 3, category: 'frontend', show_on_home: false });
  };

  const addEdu = () => {
    appendEdu({ degree: '', institution: '', year: '', description: '' });
  };

  const addExp = () => {
    appendExp({ role: '', company: '', year: '', description: '', technologies: [] });
  };

  const confirmDelete = () => {
    if (deleteModal.index !== null) {
      if (deleteModal.type === 'skill') removeSkill(deleteModal.index);
      if (deleteModal.type === 'education') removeEdu(deleteModal.index);
      if (deleteModal.type === 'experience') removeExp(deleteModal.index);
      if (deleteModal.type === 'certificate') removeCert(deleteModal.index);
    }
    setDeleteModal({ open: false, type: null, index: null });
  };

  const addCert = () => {
    appendCert({ id: Date.now().toString(), file_url: '' });
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  if (previewMode) {
    return (
      <AdminSidebar>
        <ScrollView className="flex-1 bg-white dark:bg-dark-bg" contentContainerStyle={styles.contentContainer}>
          <View className={cn('p-6', isWeb ? 'max-w-7xl mx-auto w-full' : 'w-full')}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={cn('font-bold', isWeb ? 'text-3xl' : 'text-2xl')}>
                Preview: About Me
              </Text>
              <Button variant="ghost" onPress={handlePreview} leftIcon={<Edit2 size={18} className="text-gray-700 dark:text-gray-300" />}>
                Edit
              </Button>
            </View>
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-4">About Me</Text>
                <Text className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {watch('content') || aboutMe?.content}
                </Text>
              </View>
            </Card>

            <Text className="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6 mt-4">Home Skills Preview</Text>
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row flex-wrap gap-4">
                  {watch('skills').filter((s: any) => s.show_on_home).map((skill: any, i: number) => (
                    <PreviewSkillBadge key={i} name={skill.name} isDark={isDark} />
                  ))}
                  {watch('skills').filter((s: any) => s.show_on_home).length === 0 && (
                    <Text className="text-gray-500 dark:text-gray-400">No skills set to show on home.</Text>
                  )}
                </View>
              </View>
            </Card>

            <Text className="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6 mt-4">Skills (About Me)</Text>
            <View className={cn('flex gap-6 mb-6', isWeb ? 'flex-row' : 'flex-col')}>
              <Card variant="outlined" className="flex-1 p-6 shadow-sm">
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Code2 size={24} className="text-primary-600 dark:text-primary-400" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">Web Developer</Text>
                </View>
                <View className="flex-row flex-wrap gap-4">
                  {watch('skills').filter((s: any) => s.category !== 'data').map((skill: any, i: number) => (
                    <PreviewSkillBadge key={i} name={skill.name} isDark={isDark} />
                  ))}
                  {watch('skills').filter((s: any) => s.category !== 'data').length === 0 && (
                    <Text className="text-gray-500 dark:text-gray-400">No web developer skills added yet.</Text>
                  )}
                </View>
              </Card>

              <Card variant="outlined" className="flex-1 p-6 shadow-sm">
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <MaterialCommunityIcons name="database" size={24} className="text-purple-600 dark:text-purple-400" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">Data Scientist</Text>
                </View>
                <View className="flex-row flex-wrap gap-4">
                  {watch('skills').filter((s: any) => s.category === 'data').map((skill: any, i: number) => (
                    <PreviewSkillBadge key={i} name={skill.name} isDark={isDark} />
                  ))}
                  {watch('skills').filter((s: any) => s.category === 'data').length === 0 && (
                    <Text className="text-gray-500 dark:text-gray-400">No data scientist skills added yet.</Text>
                  )}
                </View>
              </Card>
            </View>

            <View>
              <Text className="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6 mt-4">Experience</Text>
              {watch('experience')?.map((exp: any, index: number) => (
                <Card variant="outlined" className="mb-4" key={index}>
                  <View className="p-6">
                    <Text className="font-bold text-gray-900 dark:text-gray-100">{exp.role}</Text>
                    <Text className="text-primary-500 font-medium mb-1">{exp.company}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">{exp.year}</Text>
                    <Text className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      {exp.description}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {exp.technologies?.map((tech: string) => (
                        <Badge key={tech} variant="outline" size="sm">{tech}</Badge>
                      ))}
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            <View>
              <Text className="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6 mt-4">Education</Text>
              {watch('education')?.map((edu: any, index: number) => (
                <Card variant="outlined" className="mb-4" key={index}>
                  <View className="p-6">
                    <Text className="font-bold text-gray-900 dark:text-gray-100">{edu.degree}</Text>
                    <Text className="text-primary-500">{edu.institution}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">{edu.year}</Text>
                    {!!edu.description && (
                      <Text className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {edu.description}
                      </Text>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </ScrollView>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <ScrollView
        className="flex-1 bg-gray-50 dark:bg-dark-bg"
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className={cn('p-6', isWeb ? 'max-w-7xl mx-auto w-full' : 'w-full')}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className={cn('font-bold', isWeb ? 'text-3xl' : 'text-2xl')}>
                About Me
              </Text>
            </View>
            <View className="flex-row gap-3 items-center">
              <Button variant="ghost" onPress={handlePreview} leftIcon={<Eye size={18} className="text-gray-700 dark:text-gray-300" />}>
                Preview
              </Button>
              {i18nPending && (
                <View className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
                  <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    {lang === 'id' ? 'Terjemahan tertunda' : 'Translation pending'}
                  </Text>
                </View>
              )}
              {i18nPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleTranslateAgain}
                  loading={translating}
                  disabled={saving || translating}
                >
                  Translate ulang
                </Button>
              )}
              <Button
                rightIcon={<Save size={18} />}
                onPress={() => handleSubmit(onSubmit as any)()}
                loading={saving || updateAboutMe.isPending}
                disabled={!isDirty && !saving}
              >
                {saving || updateAboutMe.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>

          <View>
            {/* Content Section */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <Text className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-6">Personal Info & Bio</Text>

                <View className="mb-6 flex-row items-center gap-6">
                  {imagePreview ? (
                    <View className="relative">
                      <Image source={{ uri: imagePreview }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                      <Pressable
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-sm"
                        onPress={removeImage}
                      >
                        <Trash2 size={14} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <View className="w-[100px] h-[100px] rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <Text className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">No Avatar</Text>
                    </View>
                  )}

                  <View>
                    <Text className="font-medium text-gray-900 dark:text-gray-100 mb-2">Profile Image</Text>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handlePickImage}
                      loading={uploading}
                    >
                      {uploading ? 'Uploading...' : imagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-4 mb-4">
                  <Controller
                    name="nickname"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Nickname"
                        placeholder="e.g. Ahmad Rosyid"
                        value={field.value}
                        onChangeText={field.onChange}
                        className="flex-1 min-w-[200px]"
                        error={errors.nickname?.message}
                      />
                    )}
                  />

                  <Controller
                    name="full_name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Full Name (Card)"
                        placeholder="e.g. Ahmad Rosyid A."
                        value={field.value}
                        onChangeText={field.onChange}
                        className="flex-1 min-w-[200px]"
                        error={errors.full_name?.message}
                      />
                    )}
                  />
                </View>

                <View className="flex-row flex-wrap gap-4 mb-6">
                  <Controller
                    name="profession"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Profession"
                        placeholder="e.g. Web Developer & Data Scientist"
                        value={field.value}
                        onChangeText={field.onChange}
                        className="flex-1 min-w-[200px]"
                        error={errors.profession?.message}
                      />
                    )}
                  />

                  <Controller
                    name="years_of_experience"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Years of Experience"
                        placeholder="e.g. 3+"
                        value={field.value}
                        onChangeText={field.onChange}
                        className="flex-1 min-w-[150px]"
                        error={errors.years_of_experience?.message}
                      />
                    )}
                  />
                </View>

                <Controller
                  name="cv_url"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <View className="mb-6 border border-gray-200 dark:border-dark-border rounded-2xl p-5 bg-white dark:bg-dark-surface/50">
                      <Text className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Curriculum Vitae (PDF)</Text>

                      <View className="flex-row items-center justify-between flex-wrap gap-4">
                        <View className="flex-row items-center gap-3">
                          <Button
                            variant="outline"
                            onPress={handleCVPick}
                            loading={uploadingCV}
                            leftIcon={<MaterialCommunityIcons name="file-pdf-box" size={20} color="#ef4444" />}
                          >
                            {value ? 'Change CV' : 'Upload CV'}
                          </Button>

                          {value ? (
                            <View className="flex-row items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                              <MaterialCommunityIcons name="check-circle" size={14} color="#16a34a" style={{ marginRight: 4 }} />
                              <Text className="text-green-700 dark:text-green-400 text-xs font-bold">Uploaded</Text>
                            </View>
                          ) : null}
                        </View>

                        {value ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => onChange('')}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 h-10 w-10 rounded-full items-center justify-center p-0"
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </Button>
                        ) : null}
                      </View>

                      {value ? (
                        <View className="mt-4 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border p-2.5 rounded-lg flex-row items-center gap-2">
                          <MaterialCommunityIcons name="link-variant" size={14} color="#9ca3af" />
                          <Text className="text-gray-500 dark:text-gray-400 text-xs flex-1" numberOfLines={1} ellipsizeMode="middle">{value}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                />

                <Controller
                  name="content"
                  control={control}
                  rules={{ required: true, minLength: 10 }}
                  render={({ field }) => (
                    <Textarea
                      label="Content"
                      placeholder="Write about yourself, your experience, passion, etc. Supports multiple lines."
                      value={field.value}
                      onChangeText={field.onChange}
                      rows={8}
                      error={errors.content?.message}
                    />
                  )}
                />
              </View>
            </Card>

            {/* Skills Section */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">Skills</Text>
                  <Button size="sm" leftIcon={<Plus size={16} />} onPress={addSkill} variant="outline">
                    Add Skill
                  </Button>
                </View>

                {skillFields.length === 0 ? (
                  <View className="align-center py-12">
                    <Text className="text-gray-500 dark:text-gray-400 mb-4">No skills added yet</Text>
                    <Button size="sm" leftIcon={<Plus size={16} />} onPress={addSkill} variant="outline">
                      Add Your First Skill
                    </Button>
                  </View>
                ) : (
                  <View className="space-y-4">
                    {skillFields.map((field, index) => (
                      <SkillRow
                        key={field.id}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === skillFields.length - 1}
                        field={field}
                        control={control}
                        errors={errors.skills}
                        remove={() => setDeleteModal({ open: true, type: 'skill', index })}
                        move={moveSkill}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Card>

            {/* Education Section */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">Education</Text>
                  <Button size="sm" leftIcon={<Plus size={16} />} onPress={addEdu} variant="outline">
                    Add Education
                  </Button>
                </View>

                {eduFields.length === 0 ? (
                  <View className="align-center py-12 items-center">
                    <Text className="text-gray-500 dark:text-gray-400 mb-4">No education added yet</Text>
                    <Button size="sm" leftIcon={<Plus size={16} />} onPress={addEdu} variant="outline">
                      Add Education
                    </Button>
                  </View>
                ) : (
                  <View className="space-y-4">
                    {eduFields.map((field, index) => (
                      <EducationRow
                        key={field.id}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === eduFields.length - 1}
                        field={field}
                        control={control}
                        errors={errors.education}
                        remove={() => setDeleteModal({ open: true, type: 'education', index })}
                        move={moveEdu}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Card>

            {/* Experience Section */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">Experience</Text>
                  <Button size="sm" leftIcon={<Plus size={16} />} onPress={addExp} variant="outline">
                    Add Experience
                  </Button>
                </View>

                {expFields.length === 0 ? (
                  <View className="align-center py-12 items-center">
                    <Text className="text-gray-500 dark:text-gray-400 mb-4">No experience added yet</Text>
                    <Button size="sm" leftIcon={<Plus size={16} />} onPress={addExp} variant="outline">
                      Add Experience
                    </Button>
                  </View>
                ) : (
                  <View className="space-y-4">
                    {expFields.map((field, index) => (
                      <ExperienceRow
                        key={field.id}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === expFields.length - 1}
                        field={field}
                        control={control}
                        errors={errors.experience}
                        remove={() => setDeleteModal({ open: true, type: 'experience', index })}
                        move={moveExp}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Card>

            {/* Certificates Section */}
            <Card variant="outlined" className="mb-6">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-bold text-xl text-gray-900 dark:text-gray-100">Certificates</Text>
                  <Button size="sm" leftIcon={<Plus size={16} />} onPress={addCert} variant="outline">
                    Add Certificate
                  </Button>
                </View>

                {certFields.length === 0 ? (
                  <View className="align-center py-12 items-center">
                    <Text className="text-gray-500 dark:text-gray-400 mb-4">No certificates added yet</Text>
                    <Button size="sm" leftIcon={<Plus size={16} />} onPress={addCert} variant="outline">
                      Add Certificate
                    </Button>
                  </View>
                ) : (
                  <View className="space-y-4">
                    {certFields.map((field, index) => (
                      <CertificateRow
                        key={field.id}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === certFields.length - 1}
                        field={field}
                        control={control}
                        errors={errors.certificates}
                        remove={() => setDeleteModal({ open: true, type: 'certificate', index })}
                        move={moveCert}
                        setValue={setValue}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Card>

          </View>
        </View>
      </ScrollView>

      <Modal
        visible={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: null, index: null })}
        title={`Delete ${deleteModal.type === 'skill' ? 'Skill' : deleteModal.type === 'education' ? 'Education' : deleteModal.type === 'experience' ? 'Experience' : 'Certificate'}`}
        description="Are you sure you want to delete this item?"
        size="sm"
      >
        <View className="flex-row justify-end gap-3">
          <Button variant="ghost" onPress={() => setDeleteModal({ open: false, type: null, index: null })}>
            Cancel
          </Button>
          <Button variant="destructive" onPress={confirmDelete}>
            Delete
          </Button>
        </View>
      </Modal>
    </AdminSidebar>
  );
}

function SkillRow({ index, isFirst, isLast, field, control, errors, remove, move }: {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  field: any;
  control: any;
  errors: any;
  remove: () => void;
  move: (from: number, to: number) => void;
}) {
  const skillError = errors?.[index];

  return (
    <View
      className="flex-row items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
      style={{ zIndex: 100 - index }}
    >
      <View className="flex-col items-center justify-center gap-1">
        <Pressable
          disabled={isFirst}
          onPress={() => move(index, index - 1)}
          className={`p-1 rounded-md ${isFirst ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
        </Pressable>
        <Pressable
          disabled={isLast}
          onPress={() => move(index, index + 1)}
          className={`p-1 rounded-md ${isLast ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
        </Pressable>
      </View>

      <View className="flex-1 flex-row flex-wrap gap-3">
        <Controller
          name={`skills.${index}.name`}
          control={control}
          rules={{ required: true }}
          render={({ field: fieldProps }) => (
            <Input
              label="Skill Name"
              placeholder="e.g., React, TypeScript"
              value={fieldProps.value}
              onChangeText={fieldProps.onChange}
              error={skillError?.name?.message}
              className="flex-1 min-w-[200px]"
            />
          )}
        />

        <Controller
          name={`skills.${index}.category`}
          control={control}
          rules={{ required: true }}
          render={({ field: fieldProps }) => (
            <View className="flex-1 min-w-[140px]">
              <Label>Category</Label>
              <Select
                value={fieldProps.value}
                onChange={fieldProps.onChange}
                options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                error={skillError?.category?.message}
              />
            </View>
          )}
        />
      </View>

      <View className="flex-row items-center gap-1 flex-shrink-0 ml-2 mt-6">
        <Controller
          name={`skills.${index}.show_on_home`}
          control={control}
          render={({ field }) => (
            <Pressable
              onPress={() => field.onChange(!field.value)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                field.value ? 'text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {field.value ? (
                <Eye size={20} className="text-primary-500" />
              ) : (
                <EyeOff size={20} className="text-gray-400 dark:text-gray-500" />
              )}
            </Pressable>
          )}
        />

        <Pressable onPress={remove} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </Pressable>
      </View>
    </View>
  );
}

function EducationRow({ index, isFirst, isLast, field, control, errors, remove, move }: {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  field: any;
  control: any;
  errors: any;
  remove: () => void;
  move: (from: number, to: number) => void;
}) {
  const eduError = errors?.[index];

  return (
    <View
      className="flex-row items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
      style={{ zIndex: 100 - index }}
    >
      <View className="flex-col items-center justify-center gap-1">
        <Pressable
          disabled={isFirst}
          onPress={() => move(index, index - 1)}
          className={`p-1 rounded-md ${isFirst ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
        </Pressable>
        <Pressable
          disabled={isLast}
          onPress={() => move(index, index + 1)}
          className={`p-1 rounded-md ${isLast ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
        </Pressable>
      </View>

      <View className="flex-1 space-y-4">
        <View className="flex-row flex-wrap gap-3">
          <Controller
            name={`education.${index}.degree`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <Input
                label="Degree"
                placeholder="e.g., Bachelor of Computer Science"
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={eduError?.degree?.message}
                className="flex-1 min-w-[200px]"
              />
            )}
          />

          <Controller
            name={`education.${index}.institution`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <Input
                label="Institution"
                placeholder="e.g., University of Technology"
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={eduError?.institution?.message}
                className="flex-1 min-w-[200px]"
              />
            )}
          />
        </View>

        <View className="flex-row flex-wrap gap-3">
          <Controller
            name={`education.${index}.year`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <Input
                label="Year"
                placeholder="e.g., 2015 - 2019"
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={eduError?.year?.message}
                className="w-1/3 min-w-[150px]"
              />
            )}
          />

          <Controller
            name={`education.${index}.description`}
            control={control}
            render={({ field: fieldProps }) => (
              <Input
                label="Description (Optional)"
                placeholder="Brief description..."
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={eduError?.description?.message}
                className="flex-1 min-w-[200px]"
              />
            )}
          />
        </View>
      </View>

      <Pressable onPress={remove} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0 transition-colors">
        <Trash2 size={20} className="text-red-500 dark:text-red-400" />
      </Pressable>
    </View>
  );
}

function ExperienceRow({ index, isFirst, isLast, field, control, errors, remove, move }: {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  field: any;
  control: any;
  errors: any;
  remove: () => void;
  move: (from: number, to: number) => void;
}) {
  const expError = errors?.[index];

  return (
    <View
      className="flex-row items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
      style={{ zIndex: 100 - index }}
    >
      <View className="flex-col items-center justify-center gap-1">
        <Pressable
          disabled={isFirst}
          onPress={() => move(index, index - 1)}
          className={`p-1 rounded-md ${isFirst ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
        </Pressable>
        <Pressable
          disabled={isLast}
          onPress={() => move(index, index + 1)}
          className={`p-1 rounded-md ${isLast ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
        </Pressable>
      </View>

      <View className="flex-1 space-y-4">
        <View className="flex-row flex-wrap gap-3">
          <Controller
            name={`experience.${index}.role`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <Input
                label="Role"
                placeholder="e.g., Senior Full Stack Developer"
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={expError?.role?.message}
                className="flex-1 min-w-[200px]"
              />
            )}
          />

          <Controller
            name={`experience.${index}.company`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <Input
                label="Company"
                placeholder="e.g., Tech Company Inc."
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={expError?.company?.message}
                className="flex-1 min-w-[200px]"
              />
            )}
          />
        </View>

        <View className="flex-row flex-wrap gap-3">
          <Controller
            name={`experience.${index}.year`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <Input
                label="Year / Period"
                placeholder="e.g., 2022 - Present"
                value={fieldProps.value}
                onChangeText={fieldProps.onChange}
                error={expError?.year?.message}
                className="w-1/3 min-w-[150px]"
              />
            )}
          />

          <Controller
            name={`experience.${index}.technologies`}
            control={control}
            render={({ field: fieldProps }) => (
              <Input
                label="Technologies (comma separated)"
                placeholder="e.g., React, TypeScript, Node.js"
                value={fieldProps.value ? fieldProps.value.join(', ') : ''}
                onChangeText={(text) => fieldProps.onChange(text.split(',').map(s => s.trim()).filter(Boolean))}
                error={expError?.technologies?.message}
                className="flex-1 min-w-[200px]"
              />
            )}
          />
        </View>
        <Controller
          name={`experience.${index}.description`}
          control={control}
          rules={{ required: true }}
          render={({ field: fieldProps }) => (
            <Input
              label="Description"
              placeholder="Brief description of your role..."
              value={fieldProps.value}
              onChangeText={fieldProps.onChange}
              error={expError?.description?.message}
            />
          )}
        />
      </View>

      <Pressable onPress={remove} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0 transition-colors">
        <Trash2 size={20} className="text-red-500 dark:text-red-400" />
      </Pressable>
    </View>
  );
}

function CertificateRow({ index, isFirst, isLast, field, control, errors, remove, move, setValue }: {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  field: any;
  control: any;
  errors: any;
  remove: () => void;
  move: (from: number, to: number) => void;
  setValue: any;
}) {
  const certError = errors?.[index];
  const [uploading, setUploading] = useState(false);
  const uploadImage = useUploadImage();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const handlePdfPick = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) await uploadFile(file);
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const mockFile = new File([blob], file.name || `cert_${Date.now()}`, { type: file.mimeType || 'application/pdf' });
          await uploadFile(mockFile);
        }
      } catch (error: any) {
        showToast({ type: 'error', title: 'Error picking file', description: error.message });
      }
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `certificates/${Date.now()}-${file.name}`;
      const url = await uploadImage.mutateAsync({ file, path });
      setValue(`certificates.${index}.file_url`, url, { shouldDirty: true });
      showToast({ type: 'success', title: 'Uploaded', description: 'Certificate PDF uploaded successfully' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View
      className="flex-col items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
      style={{ zIndex: 100 - index }}
    >
      <View className="flex-row items-start w-full gap-3">
        <View className="flex-col items-center justify-center gap-1 mt-1">
          <Pressable disabled={isFirst} onPress={() => move(index, index - 1)} className={`p-1 rounded-md ${isFirst ? 'opacity-30' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
          </Pressable>
          <Pressable disabled={isLast} onPress={() => move(index, index + 1)} className={`p-1 rounded-md ${isLast ? 'opacity-30' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
          </Pressable>
        </View>

        <View className="flex-1 w-full flex-row items-center justify-between">
          <Controller
            name={`certificates.${index}.file_url`}
            control={control}
            rules={{ required: true }}
            render={({ field: fieldProps }) => (
              <View className="flex-1 w-full flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-shrink">
                  <Button variant="outline" size="sm" onPress={handlePdfPick} loading={uploading} leftIcon={<MaterialCommunityIcons name="image-plus" size={18} color="#ef4444" />}>
                    {fieldProps.value ? 'Change File' : 'Upload File'}
                  </Button>
                  {fieldProps.value ? (
                    <View className="flex-row items-center gap-2 flex-shrink">
                      <View className="flex-row items-center px-2.5 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <MaterialCommunityIcons name="check-circle" size={14} color="#16a34a" style={{ marginRight: 4 }} />
                        <Text className="text-green-700 dark:text-green-400 text-xs font-semibold">Uploaded</Text>
                      </View>
                      <Text className="text-gray-500 dark:text-gray-400 text-xs flex-shrink max-w-[120px] md:max-w-[250px]" numberOfLines={1} ellipsizeMode="middle">
                        {(() => {
                          let name = fieldProps.value.split('/').pop()?.split('?')[0] || 'Unknown file';
                          try { name = decodeURIComponent(name); } catch(e){}
                          return name.replace(/^\d{13}-/, '');
                        })()}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-red-500 text-xs">{certError?.file_url?.message}</Text>
                  )}
                </View>
                
                {fieldProps.value ? (
                  <View className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 ml-4">
                    {fieldProps.value.toLowerCase().endsWith('.pdf') ? (
                      <View className="flex-1 items-center justify-center bg-red-50">
                        <Text className="text-red-500 text-xs font-bold">PDF</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: fieldProps.value }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    )}
                  </View>
                ) : null}
              </View>
            )}
          />
        </View>

        <Pressable onPress={remove} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex-shrink-0 transition-colors">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
});