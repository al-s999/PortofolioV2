import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Image, Pressable, StyleSheet, Linking, Platform, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ArrowRight, Github, Linkedin, Twitter, Mail, ExternalLink, Moon, Sun, ChevronDown, Phone, Code2, Instagram } from '@/components/ui';
import { useColorScheme } from 'nativewind';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { cn, formatDate } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Avatar } from '@/components/ui/Avatar';
import { useProjects } from '@/lib/queries';
import { useAboutMe } from '@/lib/queries';
import { localized } from '@/lib/queries';
import { generateGlobalMetadata } from '@/lib/seo-metadata';

import { MotiView } from 'moti';
import { useScrollNav } from '@/components/ScrollContext';
import * as WebBrowser from 'expo-web-browser';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Tangkap event install PWA sepagi mungkin — module dievaluasi saat bundle
// dimuat, jauh sebelum effect komponen terpasang (hindari kalah race).
type BeforeInstallPromptEvent = { prompt: () => Promise<void> };
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e as unknown as BeforeInstallPromptEvent;
  });
}

function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

const getSkillIcon = (name: string, isDark: boolean) => {
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

export async function generateMetadata() {
  return generateGlobalMetadata();
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { data: aboutMe, isLoading: aboutLoading, isPaused: aboutPaused, isError: aboutError, error: aboutQueryError, refetch: refetchAbout } = useAboutMe();
  const { data: projects, isLoading: projectsLoading, isPaused: projectsPaused, isError: projectsError, error: projectsQueryError, refetch: refetchProjects } = useProjects(true);
  const { onScroll } = useScrollNav();
  const { showToast, hideToast } = useToast();
  const { t, lang } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = isMounted ? colorScheme === 'dark' : false;

  const featuredProjects = projects?.slice(0, 3) ?? [];

  // Install promo toast: web/PWA only, once per tab session.
  // Native (iOS/Android): no promo toast.
  // Persistent — only the close (X) button dismisses it.
  const promoShown = useRef(false);
  // Latest t for the once-per-session effect below. The effect intentionally
  // keeps [] deps so a language switch never re-fires a second toast in the
  // same session (promoShown + sessionStorage also guard); reading via the ref
  // means the toast still shows current-language copy if it fires after a
  // toggle (e.g. via the 4s fallback timer or a late beforeinstallprompt).
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });
  useEffect(() => {
    if (promoShown.current) return;
    promoShown.current = true;

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      // Already installed → silent.
      if (isAppInstalled()) return;
      const SESSION_KEY = 'pwa-install-toast-shown';
      try {
        if (window.sessionStorage?.getItem(SESSION_KEY)) return;
      } catch {
        // Storage blocked → fall through and show once per mount.
      }
      const markSeen = () => {
        try {
          window.sessionStorage?.setItem(SESSION_KEY, '1');
        } catch {
          // Ignore (private mode).
        }
      };

      // Single layout for both paths (native prompt vs manual fallback).
      // The handler degrades gracefully: with a prompt it installs,
      // without one it just dismisses. No layout change.
      const showInstallToast = () => {
        let toastId: string | null = null;
        const handleInstall = () => {
          try {
            deferredInstallPrompt?.prompt().catch(() => {});
          } catch {
            // No prompt available (manual fallback) → just dismiss.
          }
          if (toastId) hideToast(toastId);
        };
        markSeen();
        toastId = showToast({
          type: 'info',
          title: tRef.current('install.title'),
          description: tRef.current('install.description'),
          persistent: true,
          action: {
            label: tRef.current('install.action'),
            onPress: handleInstall,
          },
        });
        return toastId;
      };

      // Event already captured before mount → show immediately.
      if (deferredInstallPrompt) {
        showInstallToast();
        return;
      }

      // Event hasn't arrived after 4s → show the same toast as a manual
      // fallback so it never looks like "nothing happened".
      let fallbackId: string | null = null;
      const timer = setTimeout(() => {
        fallbackId = showInstallToast();
      }, 4000);

      const onBeforeInstallLate = (e: Event) => {
        try {
          e.preventDefault();
        } catch {
          // Ignore.
        }
        deferredInstallPrompt = e as unknown as BeforeInstallPromptEvent;
        clearTimeout(timer);
        // Fallback already shown with identical layout — its button now
        // works via the lazy handler above, so no need to re-show.
        if (fallbackId) return;
        showInstallToast();
      };
      window.addEventListener('beforeinstallprompt', onBeforeInstallLate);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', onBeforeInstallLate);
      };
    }

    // Non-web (native app): no promo toast.
    return;
  }, []);

  const toggleTheme = () => {
    toggleColorScheme();
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-dark-bg w-full"
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View className={cn('w-full mx-auto', isWeb ? 'max-w-6xl px-8 lg:px-12' : 'px-4')}>
        {(aboutPaused || projectsPaused) && !aboutMe && !projects?.length ? (
          <View className={cn('pb-4', isWeb ? 'pt-36 lg:pt-40' : 'pt-24')}>
            <Card variant="outlined" className="p-6">
              <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t('offline.waitingTitle')}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('offline.waitingDescription')}
              </Text>
              <Button variant="outline" onPress={() => { refetchAbout(); refetchProjects(); }}>
                {t('common.retry')}
              </Button>
            </Card>
          </View>
        ) : (aboutLoading || projectsLoading) && !aboutMe && !projects?.length ? (
          <View className={cn('pb-4', isWeb ? 'pt-36 lg:pt-40' : 'pt-24')}>
            <View className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4 animate-pulse" />
            <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 animate-pulse" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
          </View>
        ) : (aboutError || projectsError) && !aboutMe && !projects?.length ? (
          <View className={cn('pb-4', isWeb ? 'pt-36 lg:pt-40' : 'pt-24')}>
            <Card variant="outlined" className="p-6">
              <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t('home.loadFailedTitle')}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4" numberOfLines={2}>
                {(aboutQueryError ?? projectsQueryError) instanceof Error
                  ? ((aboutQueryError ?? projectsQueryError) as Error).message
                  : t('common.fallbackError')}
              </Text>
              <Button variant="outline" onPress={() => { refetchAbout(); refetchProjects(); }}>
                {t('common.retry')}
              </Button>
            </Card>
          </View>
        ) : null}
        {/* Hero Section */}
        <View className={cn('pb-4', isWeb ? 'pt-36 lg:pt-40' : 'pt-24')}>
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800 }}
            style={[styles.hero, { minHeight: isWeb ? 600 : 500 }]}
          >
            <View className="mb-2" style={[styles.heroContent, { flexDirection: isWeb ? 'row' : 'column', alignItems: isWeb ? 'flex-start' : 'center' }]}>
              <View className={cn('mb-8', isWeb ? 'max-w-2xl' : '')}>
                <Text className={cn('font-bold leading-tight mb-4 text-gray-900 dark:text-gray-100', isWeb ? 'text-5xl lg:text-6xl' : 'text-4xl')}>
                  {t('home.greeting')}{' '}
                  <Text className="text-primary-600 dark:text-primary-400">{aboutMe?.nickname || 'Ahmad Rosyid'}</Text>
                </Text>
                <Text className={cn('text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium', isWeb ? 'text-xl' : 'text-lg')}>
                  {localized(aboutMe, lang, 'profession', aboutMe?.profession || 'Web Developer & Data Scientist')}
                </Text>
                <Text className={cn('text-gray-500 dark:text-gray-400 mb-8 leading-relaxed', isWeb ? 'text-lg' : 'text-base')}>
                  {localized(aboutMe, lang, 'content', aboutMe?.content ?? 'I build beautiful, accessible, and performant digital experiences.')}
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <Button size="lg" className="rounded-full shadow-lg shadow-primary-500/30" rightIcon={<ArrowRight size={18} />} onPress={() => router.push('/projects')}>
                    {t('home.viewProjects')}
                  </Button>
                  {aboutMe?.cv_url ? (
                    <Button variant="outline" size="lg" className="rounded-full" onPress={async () => {
                      let offline = false;
                      try {
                        const net = await NetInfo.fetch();
                        offline = net.isConnected === false || net.isInternetReachable === false;
                      } catch {
                        offline = false;
                      }
                      if (offline) {
                        showToast({ type: 'warning', title: t('toast.offlineTitle'), description: t('toast.offlineCvDescription') });
                        return;
                      }
                      try {
                        await WebBrowser.openBrowserAsync(aboutMe.cv_url!, { toolbarColor: '#0ea5e9', showTitle: true });
                      } catch {
                        showToast({ type: 'error', title: t('toast.cvOpenFailed'), description: t('toast.cvOpenFailedDescription') });
                      }
                    }} leftIcon={<MaterialCommunityIcons name="download" size={18} color={colorScheme === 'dark' ? '#d1d5db' : '#4b5563'} />}>
                      {t('home.downloadCv')}
                    </Button>
                  ) : (
                    <Button variant="outline" size="lg" className="rounded-full opacity-50" onPress={() => {}} leftIcon={<MaterialCommunityIcons name="download" size={18} color={colorScheme === 'dark' ? '#d1d5db' : '#4b5563'} />}>
                      {t('home.downloadCv')}
                    </Button>
                  )}
                </View>
              </View>

              {/* Profile/Stats Card */}
              <View className={cn('w-full max-w-sm', isWeb ? 'ml-8 mt-12' : 'mt-8')}>
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 300 }}
                >
                  <Card className="rounded-3xl border border-gray-100 dark:border-dark-border shadow-2xl shadow-gray-200/50 dark:shadow-none" variant="elevated">
                    <View className="flex-row items-center gap-4 p-6">
                      <Avatar
                        name={aboutMe?.full_name || "Ahmad Rosyid A."}
                        size="xl"
                        src={aboutMe?.avatar_url}
                      />
                      <View className="flex-1">
                        <Text className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {aboutMe?.full_name || "Ahmad Rosyid A."}
                        </Text>
                        <Text className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                          {localized(aboutMe, lang, 'profession', aboutMe?.profession || "Web & Data Scientist")}
                        </Text>
                      </View>
                    </View>
                    <Separator className="mx-6 bg-gray-100 dark:bg-gray-800" />
                    <View className="flex-row justify-around py-6 px-4">
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{featuredProjects.length}</Text>
                        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('home.stats.projects')}</Text>
                      </View>
                      <Separator orientation="vertical" className="h-10 bg-gray-100 dark:bg-gray-800" />
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aboutMe?.skills?.length ?? 0}</Text>
                        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('home.stats.skills')}</Text>
                      </View>
                      <Separator orientation="vertical" className="h-10 bg-gray-100 dark:bg-gray-800" />
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aboutMe?.years_of_experience || "3+"}</Text>
                        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('home.stats.yearsExp')}</Text>
                      </View>
                    </View>
                  </Card>

                  <View className="flex-row justify-center gap-6 mt-8">
                    <Pressable onPress={() => Linking.openURL('https://github.com/al-s999?tab=repositories')} className="w-14 h-14 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <FontAwesome5 name="github" size={24} color={colorScheme === 'dark' ? '#d1d5db' : '#374151'} />
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL('https://www.linkedin.com/in/ahmad-rosyid-al-fualdi-b04234354/')} className="w-14 h-14 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <FontAwesome5 name="linkedin" size={24} color={colorScheme === 'dark' ? '#d1d5db' : '#374151'} />
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL('https://www.kaggle.com/ahmadrosyidalfualdi/code')} className="w-14 h-14 rounded-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <FontAwesome5 name="kaggle" size={24} color={colorScheme === 'dark' ? '#d1d5db' : '#374151'} />
                    </Pressable>
                  </View>
                </MotiView>
              </View>
            </View>

            {/* Skills Section (Full Width) */}
            {aboutMe?.skills && aboutMe.skills.filter(s => s.show_on_home).length > 0 && (
              <View className="mt-8 mb-16">
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', delay: 400, duration: 600 }}
                >
                  <Text className={cn('text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6', !isWeb && 'text-center')}>
                    {t('home.featuredSkills')}
                  </Text>
                  <View className={cn('flex-row flex-wrap gap-4', !isWeb && 'justify-center')}>
                    {aboutMe.skills.filter(s => s.show_on_home).map((skill) => (
                      <View key={skill.name} className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border items-center justify-center shadow-sm hover:border-primary-500/30 transition-colors">
                        {getSkillIcon(skill.name, isDark)}
                        <Text className="text-gray-700 dark:text-gray-300 font-medium text-xs mt-3 text-center" numberOfLines={1}>{skill.name}</Text>
                      </View>
                    ))}
                  </View>
                </MotiView>
              </View>
            )}

          </MotiView>
        </View>

        {/* Education Section */}
        {aboutMe?.education && aboutMe.education.length > 0 && (
          <View className="mb-20 px-4">
            <MotiView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', delay: 400, duration: 600 }}
            >
              <Text className={cn('font-bold text-gray-900 dark:text-white mb-8', isWeb ? 'text-3xl' : 'text-2xl')}>
                {t('home.education')}
              </Text>
              <View className="space-y-6">
                {aboutMe.education.map((edu, index) => (
                  <View key={index} className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm">
                    <Text className="font-bold text-xl text-gray-900 dark:text-white mb-1">{edu.degree}</Text>
                    <Text className="text-primary-500 font-medium mb-2">{edu.institution}</Text>
                    <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{edu.year}</Text>
                    {!!edu.description && (
                      <Text className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {edu.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </MotiView>
          </View>
        )}

        {/* Projects */}
        {featuredProjects.length > 0 && (
          <View className="mb-20 px-4">
            <MotiView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', delay: 400, duration: 600 }}
            >
              <View className="flex-row items-end justify-between mb-8">
                <View>
                  <Text className={cn('font-bold text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                    {t('home.projects')}
                  </Text>
                </View>
                <Button variant="ghost" rightIcon={<ArrowRight size={16} />} onPress={() => router.push('/projects')} className="hidden sm:flex">
                  {t('home.viewAll')}
                </Button>
              </View>
              <View className={cn('gap-6', isWeb ? 'flex-row' : 'flex-col')}>
                {featuredProjects.map((project, index) => (
                  <View key={project.id} className={isWeb ? 'flex-1' : 'w-full shrink-0 self-start'}>
                    <ProjectCard project={project} isWeb={isWeb} onPress={() => router.push(`/projects/${project.id}`)} />
                  </View>
                ))}
              </View>
              <Button variant="outline" className="mt-6 sm:hidden rounded-full" onPress={() => router.push('/projects')}>
                {t('home.viewAllProjects')}
              </Button>
            </MotiView>
          </View>
        )}

        {/* Footer / Contact Details */}
        <View className="py-8 px-4 items-center border-t border-gray-200 dark:border-dark-border mt-6">
          <Text className={cn('font-bold text-gray-900 dark:text-white mb-6', isWeb ? 'text-3xl' : 'text-2xl')}>
            {t('home.footer.title')}
          </Text>
          <View className="flex-row flex-wrap justify-center gap-4 mb-6 w-full max-w-3xl">
            <Pressable
              onPress={() => Linking.openURL('mailto:your.email@example.com')}
              className="flex-row items-center gap-2 px-6 py-3 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <FontAwesome5 name="envelope" size={18} color="#ef4444" />
              <Text className="font-semibold text-red-600 dark:text-red-400">{t('home.footer.sendEmail')}</Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=6288292081326&text&type=phone_number&app_absent=0')}
              className="flex-row items-center gap-2 px-6 py-3 rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <FontAwesome5 name="whatsapp" size={18} color="#22c55e" />
              <Text className="font-semibold text-green-600 dark:text-green-400">{t('home.footer.chatWhatsapp')}</Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://instagram.com/yourusername')}
              className="flex-row items-center gap-2 px-6 py-3 rounded-full border border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
            >
              <FontAwesome5 name="instagram" size={18} color="#ec4899" />
              <Text className="font-semibold text-pink-600 dark:text-pink-400">{t('home.footer.chatInstagram')}</Text>
            </Pressable>
          </View>
          <Text className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center">
            © {new Date().getFullYear()} Ahmad Rosyid Alfualdi. {t('home.footer.copyright')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ProjectCard({ project, onPress, isWeb }: { project: any; onPress?: () => void; isWeb?: boolean }) {
  const { t, lang } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      className={cn('group', !isWeb && 'w-full shrink-0 self-start')}
    >
      <Card variant="outlined" className={cn(isWeb && 'h-full group-hover:shadow-lg transition-shadow')}>
        {project.image_url && (
          <View className="relative h-40 mb-4 rounded-lg overflow-hidden">
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
              {localized(project, lang, 'title', project.title)}
            </Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-4 shrink-0" numberOfLines={2}>
            {localized(project, lang, 'short_description', project.short_description ?? project.description?.slice(0, 100) ?? t('common.noDescription'))}
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {project.tech_stack?.slice(0, 4).map((tech: string) => (
              <Badge key={tech} variant="outline" size="sm">{tech}</Badge>
            ))}
            {project.tech_stack && project.tech_stack.length > 4 && (
              <Badge variant="outline" size="sm">+{project.tech_stack.length - 4}</Badge>
            )}
          </View>
          <View className="flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Text className="text-sm text-gray-500 dark:text-gray-400">{t('common.viewDetails')}</Text>
            <ArrowRight size={16} color="gray" className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  hero: {
    minHeight: 500,
  },
  heroContent: {
    justifyContent: 'space-between',
  },
});