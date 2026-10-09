import { View, Pressable, Text, ScrollView, RefreshControl, Alert, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Plus, Search, Trash2, Edit2, Eye, EyeOff, Mail, Phone, Linkedin, Github, Twitter, Instagram, Globe, Loader2, Copy, Check, Label, RefreshCw } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Modal } from '@/components/ui/Modal';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useContacts } from '@/lib/queries';
import { useCreateContact } from '@/lib/queries';
import { useUpdateContact } from '@/lib/queries';
import { useDeleteContact } from '@/lib/queries';
import { withAutoTranslations } from '@/lib/queries';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CONTACT_TYPES } from '@/types';

const contactSchema = z.object({
  type: z.enum(['email', 'phone', 'linkedin', 'github', 'twitter', 'instagram', 'website', 'custom']),
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  icon: z.string(),
  order_index: z.number(),
  is_active: z.boolean(),
});

type ContactForm = {
  type: 'email' | 'phone' | 'linkedin' | 'github' | 'twitter' | 'instagram' | 'website' | 'custom';
  label: string;
  value: string;
  icon: string;
  order_index: number;
  is_active: boolean;
};

const contactIcons: Record<string, any> = {
  email: Mail,
  phone: Phone,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  website: Globe,
  custom: Globe,
};

export default function AdminContactsScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { data: contacts, isLoading, refetch } = useContacts(true);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; contact: any }>({ open: false, contact: null });
  const [editModal, setEditModal] = useState<{ open: boolean; contact: any }>({ open: false, contact: null });
  const [newContactModal, setNewContactModal] = useState(false);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [retranslatingId, setRetranslatingId] = useState<string | null>(null);
  const { t } = useLanguage();

  const pendingToast = () => ({
    type: 'warning' as const,
    title: t('admin.contacts.pendingTitle'),
    description: t('admin.contacts.pendingDescription'),
  });

  // "Translate ulang" for a single row: re-runs full collect+translate+merge.
  const handleRetranslate = async (contact: any, data?: ContactForm) => {
    if (!contact?.id) return;
    const src = data ?? contact;
    setRetranslatingId(contact.id);
    try {
      const { payload, pending } = await withAutoTranslations('contacts', {
        type: src.type,
        label: src.label,
        value: src.value,
        icon: src.icon ?? '',
        order_index: src.order_index ?? 0,
        is_active: src.is_active ?? true,
        i18n: contact?.i18n ?? {},
      });
      await updateContact.mutateAsync({ id: contact.id, ...payload });
      setPendingIds((m) => ({ ...m, [contact.id]: pending }));
      if (pending) {
        showToast(pendingToast());
      } else {
        showToast({ type: 'success', title: t('common.retranslatedTitle'), description: t('common.retranslatedDescription') });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: t('admin.contacts.failed'), description: error.message });
    } finally {
      setRetranslatingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch = contact.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) ?? [];

  const handleDelete = async () => {
    if (!deleteModal.contact) return;

    try {
      await deleteContact.mutateAsync(deleteModal.contact.id);
      showToast({
        type: 'success',
        title: t('admin.contacts.deleted'),
        description: t('admin.contacts.deletedDescription'),
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('admin.contacts.deleteFailed'),
        description: error.message,
      });
    } finally {
      setDeleteModal({ open: false, contact: null });
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
                {t('admin.contacts.title')}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Button variant="ghost" onPress={handleRefresh} leftIcon={<RefreshCw size={18} />} loading={refreshing}>
                {t('common.refresh')}
              </Button>
              <Button rightIcon={<Plus size={18} />} onPress={() => setNewContactModal(true)}>
                {t('admin.contacts.newTitle')}
              </Button>
            </View>
          </View>

          {/* Search */}
          <Input
            placeholder={t('admin.contacts.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} stroke="gray" />}
            className={cn('mb-6 w-full', isWeb ? 'max-w-md' : '')}
          />
        </View>

        {/* Contacts List */}
        <View className={cn('px-6 pb-6', isWeb ? 'max-w-7xl mx-auto w-full' : 'w-full')}>
          {isLoading ? (
            <View className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <ContactRowSkeleton key={i} />
              ))}
            </View>
          ) : filteredContacts.length === 0 ? (
            <Card variant="outlined" className="p-12 align-center">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery ? t('contact.searchEmptyTitle') : t('contact.emptyTitle')}
              </Text>
              {!searchQuery && (
                <Button rightIcon={<Plus size={18} />} onPress={() => setNewContactModal(true)} className="mt-4">
                  {t('admin.contacts.newTitle')}
                </Button>
              )}
            </Card>
          ) : (
            <View className="space-y-4">
              {filteredContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  translationPending={pendingIds[contact.id] === true}
                  retranslating={retranslatingId === contact.id}
                  onRetranslate={() => handleRetranslate(contact)}
                  onEdit={() => setEditModal({ open: true, contact })}
                  onDelete={() => setDeleteModal({ open: true, contact })}
                  onToggleActive={() => {
                    updateContact.mutate({ id: contact.id, is_active: !contact.is_active });
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
        onClose={() => setDeleteModal({ open: false, contact: null })}
        title={t('admin.contacts.deleteTitle')}
        description={t('admin.contacts.deleteDescription')}
        size="sm"
      >
        <View className="flex-row justify-end gap-3">
          <Button variant="ghost" onPress={() => setDeleteModal({ open: false, contact: null })}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onPress={handleDelete} loading={deleteContact.isPending}>
            {t('common.delete')}
          </Button>
        </View>
      </Modal>

      {/* New/Edit Contact Modal */}
      <ContactFormModal
        visible={newContactModal || editModal.open}
        onClose={() => { setNewContactModal(false); setEditModal({ open: false, contact: null }); }}
        contact={editModal.contact}
        onRetranslate={async (data) => {
          if (editModal.contact) await handleRetranslate(editModal.contact, data);
        }}
        onSubmit={async (data) => {
          try {
            if (editModal.contact) {
              // Dual-direction (source lang unknown): fills i18n.id + i18n.en.
              // Translation failure is non-fatal — source still commits.
              const { payload, pending } = await withAutoTranslations('contacts', {
                ...data,
                i18n: editModal.contact?.i18n ?? {},
              });
              await updateContact.mutateAsync({ id: editModal.contact.id, ...payload });
              setPendingIds((m) => ({ ...m, [editModal.contact.id]: pending }));
              if (pending) {
                showToast(pendingToast());
              } else {
                showToast({ type: 'success', title: t('admin.contacts.updated'), description: t('admin.contacts.updatedDescription') });
              }
            } else {
              const { payload, pending } = await withAutoTranslations('contacts', data);
              const created = (await createContact.mutateAsync(payload)) as any;
              if (pending) {
                if (created?.id) setPendingIds((m) => ({ ...m, [created.id]: true }));
                showToast(pendingToast());
              } else {
                showToast({ type: 'success', title: t('admin.contacts.created'), description: t('admin.contacts.createdDescription') });
              }
            }
            setNewContactModal(false);
            setEditModal({ open: false, contact: null });
          } catch (error: any) {
            showToast({ type: 'error', title: t('admin.contacts.failed'), description: error.message });
          }
        }}
      />
    </AdminSidebar>
  );
}

function ContactRow({ contact, onEdit, onDelete, onToggleActive, translationPending, retranslating, onRetranslate }: {
  contact: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  translationPending?: boolean;
  retranslating?: boolean;
  onRetranslate?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const Icon = contactIcons[contact.type] ?? contactIcons.custom;
  // Legacy rows predate the i18n mirror — offer backfill alongside pending.
  const needsTranslation =
    translationPending === true ||
    contact?.i18n?.id?.label == null ||
    contact?.i18n?.en?.label == null;

  return (
    <Card variant="outlined" className={cn(!contact.is_active && 'opacity-50')}>
      <View className="p-4">
        <View className="flex-row gap-4">
          <View className={cn('p-3 rounded-xl flex-shrink-0',
            contact.type === 'email' && 'bg-blue-100 dark:bg-blue-900/30',
            contact.type === 'phone' && 'bg-green-100 dark:bg-green-900/30',
            contact.type === 'linkedin' && 'bg-blue-100 dark:bg-blue-900/30',
            contact.type === 'github' && 'bg-gray-100 dark:bg-gray-900/30',
            contact.type === 'twitter' && 'bg-sky-100 dark:bg-sky-900/30',
            contact.type === 'instagram' && 'bg-pink-100 dark:bg-pink-900/30',
            contact.type === 'website' && 'bg-purple-100 dark:bg-purple-900/30',
          )}>
            <Icon size={24} stroke={contact.type === 'email' ? '#3b82f6' : contact.type === 'phone' ? '#22c55e' : contact.type === 'linkedin' ? '#3b82f6' : contact.type === 'github' ? (colorScheme === 'dark' ? '#e2e8f0' : '#374151') : contact.type === 'twitter' ? '#0ea5e9' : contact.type === 'instagram' ? '#ec4899' : (colorScheme === 'dark' ? '#a78bfa' : '#a855f7')} />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between gap-2 mb-1">
              <View className="flex-row items-center gap-2 flex-1">
                <Text className="font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
                  {contact.label}
                </Text>
              </View>
            </View>
            <Text className="text-gray-600 dark:text-gray-400 text-sm truncate flex-1">{contact.value}</Text>
            {translationPending === true && (
              <View className="self-start mt-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
                <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  {t('common.translationPending')}
                </Text>
              </View>
            )}
            {needsTranslation && onRetranslate && (
              <Pressable
                onPress={onRetranslate}
                disabled={retranslating === true}
                className="self-start mt-1.5"
                accessibilityLabel={t('common.retranslate')}
              >
                <Text className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                  {retranslating === true ? t('common.loading') : t('common.retranslate')}
                </Text>
              </Pressable>
            )}
          </View>
          <View className="flex-col items-end gap-2">
            <View className="flex-row gap-1">
              <Pressable onPress={onToggleActive} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" accessibilityLabel={contact.is_active ? t('admin.projects.deactivate') : t('admin.projects.activate')}>
                {contact.is_active ? (
                  <Eye size={18} stroke="gray" />
                ) : (
                  <EyeOff size={18} stroke="gray" />
                )}
              </Pressable>
              <Pressable onPress={onEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" accessibilityLabel={t('common.edit')}>
                <Edit2 size={18} stroke="gray" />
              </Pressable>
              <Pressable onPress={onDelete} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" accessibilityLabel={t('common.delete')}>
                <Trash2 size={18} className="text-red-500" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

function ContactRowSkeleton() {
  return (
    <Card variant="outlined" className="animate-pulse">
      <View className="p-4">
        <View className="flex-row gap-4">
          <View className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 space-y-3">
            <View className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </View>
          <View className="w-24" />
        </View>
      </View>
    </Card>
  );
}

function ContactFormModal({ visible, onClose, contact, onSubmit, onRetranslate }: {
  visible: boolean;
  onClose: () => void;
  contact: any;
  onSubmit: (data: ContactForm) => Promise<void>;
  onRetranslate?: (data: ContactForm) => Promise<void>;
}) {
  const isEditing = !!contact;
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [translating, setTranslating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: 'email',
      label: '',
      value: '',
      icon: '',
      order_index: 0,
      is_active: true,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (contact) {
      reset({
        type: contact.type,
        label: contact.label,
        value: contact.value,
        icon: contact.icon ?? '',
        order_index: contact.order_index ?? 0,
        is_active: contact.is_active,
      });
    } else {
      reset({
        type: 'email',
        label: '',
        value: '',
        icon: '',
        order_index: 0,
        is_active: true,
      });
    }
  }, [contact, reset, isEditing]);

  const selectedType = watch('type');
  const Icon = contactIcons[selectedType] ?? contactIcons.custom;

  const handleFormSubmit = async (data: ContactForm) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  // "Translate ulang": re-translate current values, keep the modal open.
  const handleRetranslateSubmit = async (data: ContactForm) => {
    if (!onRetranslate) return;
    setTranslating(true);
    try {
      await onRetranslate(data);
    } finally {
      setTranslating(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t('admin.contacts.editTitle') : t('admin.contacts.newTitle')}
      description={isEditing ? t('admin.contacts.editDescription') : t('admin.contacts.newDescription')}
      size="md"
    >
      <View>
        <View className="space-y-4">
          <View className="z-50">
            <Label>{t('admin.contacts.typeLabel')}</Label>
            <Select
              id="type"
              value={watch('type')}
              onChange={(v) => setValue('type', v as any)}
              options={CONTACT_TYPES.map((c) => ({ value: c.value, label: c.label }))}
              error={errors.type?.message}
              leftIcon={<Icon size={20} stroke="gray" />}
            />
          </View>

          <Input
            label={t('admin.contacts.labelLabel')}
            placeholder={t('admin.contacts.labelPlaceholder')}
            error={errors.label?.message}
            {...register('label')}
          />

          <Input
            label={t('admin.contacts.valueLabel')}
            placeholder={selectedType === 'email' ? t('admin.contacts.valueEmailPlaceholder') :
              selectedType === 'phone' ? t('admin.contacts.valuePhonePlaceholder') :
                selectedType === 'linkedin' ? t('admin.contacts.valueLinkedinPlaceholder') :
                  selectedType === 'github' ? t('admin.contacts.valueGithubPlaceholder') :
                    selectedType === 'twitter' ? t('admin.contacts.valueSocialPlaceholder') :
                      selectedType === 'instagram' ? t('admin.contacts.valueSocialPlaceholder') :
                        selectedType === 'website' ? t('admin.contacts.valueWebsitePlaceholder') : t('admin.contacts.valueGenericPlaceholder')}
            error={errors.value?.message}
            {...register('value')}
          />

          <Input
            label={t('admin.contacts.iconLabel')}
            placeholder={t('admin.contacts.iconPlaceholder')}
            {...register('icon')}
          />

          <Input
            label={t('admin.contacts.orderLabel')}
            type="number"
            value={String(watch('order_index') ?? 0)}
            onChangeText={(v) => setValue('order_index', Number(v) || 0)}
            inputMode="numeric"
          />
        </View>

        <View className="flex-row justify-end gap-3 mt-6">
          <Button variant="ghost" onPress={onClose}>
            {t('common.cancel')}
          </Button>
          {isEditing && onRetranslate && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleSubmit(handleRetranslateSubmit)()}
              loading={translating}
              disabled={submitting || translating}
            >
              {t('common.retranslate')}
            </Button>
          )}
          <Button onPress={() => handleSubmit(handleFormSubmit)()} loading={submitting}>
            {isEditing ? t('common.update') : t('common.create')}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
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