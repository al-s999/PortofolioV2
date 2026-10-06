import { ScrollView, View, Pressable, Text, StyleSheet, Linking, Platform, useWindowDimensions } from 'react-native';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Instagram, Send, Copy, Check, ExternalLink, Loader2, WhatsApp } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useContacts } from '@/lib/queries';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/Toast';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

const contactIcons: Record<string, any> = {
  email: Mail,
  phone: Phone,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  whatsapp: WhatsApp,
  website: Globe,
  custom: ExternalLink,
};

export default function ContactScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const { data: contacts, isLoading: contactsLoading, isPaused: contactsPaused, isError: contactsError, error: contactsQueryError, refetch: refetchContacts } = useContacts();
  if (__DEV__) {
    console.warn('[contacts]', {
      isLoading: contactsLoading,
      isError: contactsError,
      error: contactsQueryError instanceof Error ? contactsQueryError.message : contactsQueryError,
      count: contacts?.length ?? 0,
    });
  }
  const { showToast } = useToast();
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const activeContacts = contacts?.filter((c) => c.is_active) ?? [];

  const handleSubmitForm = async (data: ContactForm) => {
    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      showToast({
        type: 'success',
        title: 'Message sent!',
        description: 'Thanks for reaching out. I\'ll get back to you soon.',
      });
      reset();
    } catch {
      showToast({
        type: 'error',
        title: 'Failed to send',
        description: 'Something went wrong. Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (value: string, contactId: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(value);
    }
    setCopiedContact(contactId);
    setTimeout(() => setCopiedContact(null), 2000);
    showToast({
      type: 'success',
      title: 'Copied!',
      description: `${value} copied to clipboard`,
    });
  };

  const handleContactPress = (contact: any) => {
    switch (contact.type) {
      case 'email':
        Linking.openURL(`mailto:${contact.value}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${contact.value}`);
        break;
      case 'website':
        Linking.openURL(contact.value.startsWith('http') ? contact.value : `https://${contact.value}`);
        break;
      case 'linkedin':
        Linking.openURL(`https://linkedin.com/in/${contact.value}`);
        break;
      case 'github':
        Linking.openURL(`https://github.com/${contact.value}`);
        break;
      case 'twitter':
        Linking.openURL(`https://twitter.com/${contact.value}`);
        break;
      case 'instagram':
        Linking.openURL(`https://instagram.com/${contact.value}`);
        break;
      default:
        if (contact.value.startsWith('http')) {
          Linking.openURL(contact.value);
        }
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-dark-bg w-full"
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className={cn('w-full mx-auto', isWeb ? 'max-w-7xl px-8 lg:px-12' : 'px-4')}>
        
        {/* Contact Form & Info Side by Side on Web */}
        <View className={cn('px-4 gap-4 pb-12 flex-col', isWeb ? 'pt-24 lg:pt-32 lg:flex-row' : 'pt-12')}>
          {/* Contact Form - Main Large Bento Box */}
          <View className={cn('shrink-0', isWeb ? 'lg:w-[420px] xl:w-[480px]' : 'w-full self-start')}>
            <Card variant="outlined" className={cn(isWeb && 'h-full min-h-[550px]')}>
              <View className={cn('p-8 flex-col shrink-0', isWeb && 'h-full')}>
                <Text className={cn('font-bold mb-8 text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                  Send a message
                </Text>
              <View className="flex-col shrink-0">
                <View className="flex-col gap-5 shrink-0">
                  <Input
                    label="Name"
                    placeholder="Your name"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    label="Subject"
                    placeholder="What's this about?"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                  <Textarea
                    label="Message"
                    placeholder="Tell me about your project..."
                    error={errors.message?.message}
                    {...register('message')}
                  />
                  <View className="pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      loading={submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Small Bento Boxes for Contacts */}
        <View className="flex-1 flex-row flex-wrap content-start gap-4">
          {contactsPaused && activeContacts.length === 0 ? (
            <View className="flex-grow min-w-[240px] max-w-full">
              <Card variant="outlined" className="p-6 min-h-[140px]">
                <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">Menunggu koneksi…</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">Anda offline. Nyalakan internet — data dimuat otomatis.</Text>
                <Button variant="outline" onPress={() => refetchContacts()}>
                  Coba lagi
                </Button>
              </Card>
            </View>
          ) : contactsLoading ? (
            <View className="flex-grow min-w-[240px] max-w-full">
              <Card variant="outlined" className="p-6 min-h-[140px] animate-pulse">
                <View className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4" />
                <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <View className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </Card>
            </View>
          ) : contactsError ? (
            <View className="flex-grow min-w-[240px] max-w-full">
              <Card variant="outlined" className="p-6 min-h-[140px]">
                <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">Gagal memuat kontak</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4" numberOfLines={2}>
                  {contactsQueryError instanceof Error ? contactsQueryError.message : 'Periksa koneksi lalu coba lagi.'}
                </Text>
                <Button variant="outline" onPress={() => refetchContacts()}>
                  Coba lagi
                </Button>
              </Card>
            </View>
          ) : activeContacts.length === 0 ? (
            <View className="flex-grow min-w-[240px] max-w-full">
              <Card variant="outlined" className="p-6 min-h-[140px]">
                <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">Belum ada kontak</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Kontak akan muncul di sini setelah ditambahkan.</Text>
              </Card>
            </View>
          ) : (
            activeContacts.map((contact) => (
              <View key={contact.id} className="flex-grow min-w-[240px] max-w-full">
                <BentoContact
                  contact={contact}
                  onPress={() => handleContactPress(contact)}
                  onCopy={() => handleCopy(contact.value, contact.id)}
                  copied={copiedContact === contact.id}
                />
              </View>
            ))
          )}
        </View>

      </View>



      {/* Footer */}
      <View className="px-4 py-8 align-center">
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
          © {new Date().getFullYear()} Portfolio. Built with Expo & React Native.
        </Text>
      </View>
      </View>
    </ScrollView>
  );
}

function BentoContact({ contact, onPress, onCopy, copied }: { contact: any; onPress: () => void; onCopy: () => void; copied: boolean }) {
  const Icon = contactIcons[contact.type] ?? contactIcons.custom;
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  return (
    <Card variant="outlined" className={cn(isWeb && 'h-full hover:border-primary-300 dark:hover:border-primary-700 transition-colors group cursor-pointer')}>
      <Pressable onPress={onPress} className={cn('p-6 flex-col justify-between min-h-[140px] shrink-0', isWeb && 'h-full')}>
        <View className="flex-row items-start justify-between mb-4">
          <View className={cn('p-3 rounded-2xl', 
            contact.type === 'email' ? 'bg-red-100 dark:bg-red-900/40' : 
            (contact.type === 'phone' || contact.type === 'whatsapp') ? 'bg-green-100 dark:bg-green-900/40' : 
            contact.type === 'linkedin' ? 'bg-blue-100 dark:bg-blue-900/40' : 
            contact.type === 'twitter' ? 'bg-sky-100 dark:bg-sky-900/40' : 
            contact.type === 'instagram' ? 'bg-pink-100 dark:bg-pink-900/40' : 
            contact.type === 'github' ? 'bg-gray-200 dark:bg-gray-700/50' : 
            contact.type === 'website' ? 'bg-indigo-100 dark:bg-indigo-900/40' : 
            'bg-gray-100 dark:bg-gray-800'
          )}>
            <Icon size={24} className={cn(
              contact.type === 'email' ? 'text-red-600 dark:text-red-400' : 
              (contact.type === 'phone' || contact.type === 'whatsapp') ? 'text-green-600 dark:text-green-400' : 
              contact.type === 'linkedin' ? 'text-blue-600 dark:text-blue-400' : 
              contact.type === 'twitter' ? 'text-sky-600 dark:text-sky-400' : 
              contact.type === 'instagram' ? 'text-pink-600 dark:text-pink-400' : 
              contact.type === 'github' ? 'text-gray-900 dark:text-white' : 
              contact.type === 'website' ? 'text-indigo-600 dark:text-indigo-400' : 
              'text-gray-700 dark:text-gray-300'
            )} />
          </View>
        </View>
        <View>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">{contact.label || contact.type}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-bold text-gray-900 dark:text-gray-100 truncate text-base flex-shrink-1">{contact.value}</Text>
            <Pressable onPress={(e) => { e.stopPropagation(); onCopy(); }} className="p-1 opacity-50 hover:opacity-100">
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="gray" />}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

function BentoInfo({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  return (
    <Card variant="outlined" className={cn(isWeb && 'h-full')}>
      <View className={cn('p-6 flex-col justify-between min-h-[140px] shrink-0', isWeb && 'h-full')}>
        <View className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-900/20 w-12 h-12 items-center justify-center mb-4">
          <Icon size={24} className="text-primary-600 dark:text-primary-400" />
        </View>
        <View>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">{label}</Text>
          <Text className="font-bold text-gray-900 dark:text-gray-100">{value}</Text>
        </View>
      </View>
    </Card>
  );
}



import { Clock, Code2, Calendar, Image } from '@/components/ui';

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    minHeight: 200,
  },
});