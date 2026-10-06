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
        title: 'Deleted',
        description: 'Contact has been removed.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to delete',
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
                Contacts
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Button variant="ghost" onPress={handleRefresh} leftIcon={<RefreshCw size={18} />} loading={refreshing}>
                Refresh
              </Button>
              <Button rightIcon={<Plus size={18} />} onPress={() => setNewContactModal(true)}>
                New Contact
              </Button>
            </View>
          </View>

          {/* Search */}
          <Input
            placeholder="Search contacts..."
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
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </Text>
              {!searchQuery && (
                <Button rightIcon={<Plus size={18} />} onPress={() => setNewContactModal(true)} className="mt-4">
                  Add Contact
                </Button>
              )}
            </Card>
          ) : (
            <View className="space-y-4">
              {filteredContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
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
        title="Delete Contact"
        description="This action cannot be undone. Are you sure you want to delete this contact?"
        size="sm"
      >
        <View className="flex-row justify-end gap-3">
          <Button variant="ghost" onPress={() => setDeleteModal({ open: false, contact: null })}>
            Cancel
          </Button>
          <Button variant="destructive" onPress={handleDelete} loading={deleteContact.isPending}>
            Delete
          </Button>
        </View>
      </Modal>

      {/* New/Edit Contact Modal */}
      <ContactFormModal
        visible={newContactModal || editModal.open}
        onClose={() => { setNewContactModal(false); setEditModal({ open: false, contact: null }); }}
        contact={editModal.contact}
        onSubmit={async (data) => {
          try {
            if (editModal.contact) {
              await updateContact.mutateAsync({ id: editModal.contact.id, ...data });
              showToast({ type: 'success', title: 'Updated', description: 'Contact has been updated.' });
            } else {
              await createContact.mutateAsync(data);
              showToast({ type: 'success', title: 'Created', description: 'Contact has been added.' });
            }
            setNewContactModal(false);
            setEditModal({ open: false, contact: null });
          } catch (error: any) {
            showToast({ type: 'error', title: 'Failed', description: error.message });
          }
        }}
      />
    </AdminSidebar>
  );
}

function ContactRow({ contact, onEdit, onDelete, onToggleActive }: {
  contact: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const Icon = contactIcons[contact.type] ?? contactIcons.custom;

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
          </View>
          <View className="flex-col items-end gap-2">
            <View className="flex-row gap-1">
              <Pressable onPress={onToggleActive} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" accessibilityLabel={contact.is_active ? 'Deactivate' : 'Activate'}>
                {contact.is_active ? (
                  <Eye size={18} stroke="gray" />
                ) : (
                  <EyeOff size={18} stroke="gray" />
                )}
              </Pressable>
              <Pressable onPress={onEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" accessibilityLabel="Edit">
                <Edit2 size={18} stroke="gray" />
              </Pressable>
              <Pressable onPress={onDelete} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" accessibilityLabel="Delete">
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

function ContactFormModal({ visible, onClose, contact, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  contact: any;
  onSubmit: (data: ContactForm) => Promise<void>;
}) {
  const isEditing = !!contact;
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'New Contact'}
      description={isEditing ? 'Update your contact information' : 'Add a new contact method to your portfolio'}
      size="md"
    >
      <View>
        <View className="space-y-4">
          <View className="z-50">
            <Label>Contact Type</Label>
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
            label="Label"
            placeholder="e.g., Email, Phone, LinkedIn"
            error={errors.label?.message}
            {...register('label')}
          />

          <Input
            label="Value"
            placeholder={selectedType === 'email' ? 'you@example.com' :
              selectedType === 'phone' ? '+1 234 567 890' :
                selectedType === 'linkedin' ? 'your-profile' :
                  selectedType === 'github' ? 'your-username' :
                    selectedType === 'twitter' ? '@yourhandle' :
                      selectedType === 'instagram' ? '@yourhandle' :
                        selectedType === 'website' ? 'https://yourwebsite.com' : 'Enter value'}
            error={errors.value?.message}
            {...register('value')}
          />

          <Input
            label="Custom Icon (optional)"
            placeholder="Lucide icon name (e.g., mail, phone, github)"
            {...register('icon')}
          />

          <Input
            label="Display Order"
            type="number"
            value={String(watch('order_index') ?? 0)}
            onChangeText={(v) => setValue('order_index', Number(v) || 0)}
            inputMode="numeric"
          />
        </View>

        <View className="flex-row justify-end gap-3 mt-6">
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={() => handleSubmit(handleFormSubmit)()} loading={submitting}>
            {isEditing ? 'Update' : 'Create'}
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