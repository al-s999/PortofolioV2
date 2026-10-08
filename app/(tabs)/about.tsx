import { ScrollView, View, Pressable, Text, Image, StyleSheet, Platform, useWindowDimensions, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapPin, Calendar, Code2, Award, Heart, ChevronRight } from '@/components/ui';
import { cn, formatDate, getInitials } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useAboutMe } from '@/lib/queries';
import { generateGlobalMetadata } from '@/lib/seo-metadata';
import { useScrollNav } from '@/components/ScrollContext';
import { MotiView } from 'moti';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useColorScheme } from 'nativewind';
import * as WebBrowser from 'expo-web-browser';
import { buildPdfJsViewerUrl, resolvePdfViewerBaseUrl, PDF_PREVIEW_TIMEOUT_MS } from '@/lib/pdf-viewer';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export async function generateMetadata() {
  return generateGlobalMetadata();
}

export default function AboutScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const { data: aboutMe, isLoading: aboutLoading, isPaused: aboutPaused, isError: aboutError, error: aboutQueryError, refetch: refetchAbout } = useAboutMe();
  const { onScroll } = useScrollNav();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const skillsByCategory = aboutMe?.skills?.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof aboutMe.skills>) ?? {};

  const categories = [
    { key: 'frontend', label: 'Frontend', icon: Code2, color: 'text-blue-500' },
    { key: 'backend', label: 'Backend', icon: Code2, color: 'text-green-500' },
    { key: 'devops', label: 'DevOps', icon: Award, color: 'text-orange-500' },
    { key: 'design', label: 'Design', icon: Heart, color: 'text-pink-500' },
    { key: 'other', label: 'Other', icon: ChevronRight, color: 'text-gray-500' },
  ];

  return (
    <>
      <ScrollView
        className="flex-1 bg-white dark:bg-dark-bg w-full"
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className={cn('w-full mx-auto', isWeb ? 'max-w-6xl px-8 lg:px-12' : 'px-4')}>


          {/* Spacer to avoid navbar overlap */}
          <View style={{ height: isWeb ? 140 : 100 }} />

          {aboutPaused && !aboutMe ? (
            <View className="px-4 mb-12 mt-4">
              <Card variant="outlined" className="p-6">
                <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t('offline.waitingTitle')}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('offline.waitingDescription')}
                </Text>
                <Button variant="outline" onPress={() => refetchAbout()}>
                  {t('common.retry')}
                </Button>
              </Card>
            </View>
          ) : aboutLoading && !aboutMe ? (
            <View className="px-4 mb-12 mt-4">
              <View className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8 animate-pulse" />
              <View className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            </View>
          ) : aboutError && !aboutMe ? (
            <View className="px-4 mb-12 mt-4">
              <Card variant="outlined" className="p-6">
                <Text className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t('about.loadFailedTitle')}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4" numberOfLines={2}>
                  {aboutQueryError instanceof Error ? aboutQueryError.message : t('common.fallbackError')}
                </Text>
                <Button variant="outline" onPress={() => refetchAbout()}>
                  {t('common.retry')}
                </Button>
              </Card>
            </View>
          ) : null}

          {/* About Content */}
          {aboutMe?.content && (
            <View className="px-4 mb-12 mt-4">
              <MotiView
                from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 100, duration: 600 }}
              >
                <Text className={cn('font-bold mb-8 text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                  {t('about.title')}
                </Text>
                <Card variant="outlined" className="p-6 shadow-sm">
                  <Text className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                    {aboutMe.content}
                  </Text>
                </Card>
              </MotiView>
            </View>
          )}

          {/* Skills Content */}
          {aboutMe?.skills && aboutMe.skills.length > 0 && (
            <View className="px-4 mb-12 mt-4">
              <MotiView
                from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 200, duration: 600 }}
              >
                <Text className={cn('font-bold mb-8 text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                  {t('about.skills')}
                </Text>
                <View className={cn('flex gap-6', isWeb ? 'flex-row' : 'flex-col w-full')}>
                  <Card variant="outlined" className={cn('p-6 shadow-sm', isWeb ? 'flex-1' : 'w-full')} style={{ overflow: 'visible' }}>
                    <View className="flex-row items-center gap-3 mb-6">
                      <View className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Code2 size={24} className="text-primary-600 dark:text-primary-400" />
                      </View>
                      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('about.webDeveloper')}</Text>
                    </View>
                    <View className={cn('flex-row flex-wrap gap-4', !isWeb && 'justify-center')}>
                      {aboutMe.skills.filter(s => s.category !== 'data').map((skill, i) => (
                        <SkillBadge key={i} name={skill.name} isDark={isDark} isWeb={isWeb} />
                      ))}
                      {aboutMe.skills.filter(s => s.category !== 'data').length === 0 && (
                        <Text className="text-gray-500 dark:text-gray-400">{t('about.noWebSkills')}</Text>
                      )}
                    </View>
                  </Card>

                  <Card variant="outlined" className={cn('p-6 shadow-sm', isWeb ? 'flex-1' : 'w-full')} style={{ overflow: 'visible' }}>
                    <View className="flex-row items-center gap-3 mb-6">
                      <View className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Award size={24} className="text-purple-600 dark:text-purple-400" />
                      </View>
                      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('about.dataScientist')}</Text>
                    </View>
                    <View className={cn('flex-row flex-wrap gap-4', !isWeb && 'justify-center')}>
                      {aboutMe.skills.filter(s => s.category === 'data').map((skill, i) => (
                        <SkillBadge key={i} name={skill.name} isDark={isDark} isWeb={isWeb} />
                      ))}
                      {aboutMe.skills.filter(s => s.category === 'data').length === 0 && (
                        <Text className="text-gray-500 dark:text-gray-400">{t('about.noDataSkills')}</Text>
                      )}
                    </View>
                  </Card>
                </View>
              </MotiView>
            </View>
          )}


          {/* Experience Timeline */}
          <View className="px-4 mb-16 mt-8">
            <MotiView
              from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 300, duration: 600 }}
            >
              <Text className={cn('font-bold mb-8 text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                {t('about.experience')}
              </Text>
              <Card variant="outlined" className="p-6 shadow-sm">
                <View className="space-y-6">
                  {aboutMe?.experience?.length ? aboutMe.experience.map((exp, index) => (
                    <ExperienceItem key={index} experience={exp} isLast={index === aboutMe.experience!.length - 1} />
                  )) : (
                    <Text className="text-gray-500 dark:text-gray-400">{t('about.noExperience')}</Text>
                  )}
                </View>
              </Card>
            </MotiView>
          </View>

          {/* Education */}
          <View className="px-4 mb-16 mt-4">
            <MotiView
              from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 400, duration: 600 }}
            >
              <Text className={cn('font-bold mb-8 text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                {t('about.education')}
              </Text>
              <Card variant="outlined" className="p-6 shadow-sm">
                <View className="space-y-6">
                  {aboutMe?.education?.length ? aboutMe.education.map((edu, index) => (
                    <EducationItem key={index} education={edu} isLast={index === aboutMe.education!.length - 1} />
                  )) : (
                    <Text className="text-gray-500 dark:text-gray-400">{t('about.noEducation')}</Text>
                  )}
                </View>
              </Card>
            </MotiView>
          </View>

          {/* Certificates Gallery */}
          {aboutMe?.certificates && aboutMe.certificates.length > 0 && (
            <View className="px-4 mb-16 mt-4">
              <MotiView
                from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 500, duration: 600 }}
              >
                <Text className={cn('font-bold mb-8 text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                  {t('about.certificates')}
                </Text>
                <View className={cn('w-full', isWeb ? 'grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[240px]' : 'flex flex-col gap-4')}>
                  {aboutMe.certificates?.map((cert, index) => {
                    const total = aboutMe.certificates?.length || 0;
                    const isLast = index === total - 1;
                    const pattern = index % 5;
                    let bentoClass = '';
                    
                    if (total === 1) {
                      bentoClass = 'md:col-span-3 md:row-span-2';
                    } else if (total === 2) {
                      bentoClass = index === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-2';
                    } else if (total === 3) {
                      if (index === 0) bentoClass = 'md:col-span-2 md:row-span-2';
                      else bentoClass = 'md:col-span-1 md:row-span-1';
                    } else if (total === 4) {
                      if (index === 0) bentoClass = 'md:col-span-3 md:row-span-2';
                      else bentoClass = 'md:col-span-1 md:row-span-1';
                    } else {
                      if (pattern === 0) bentoClass = isLast ? 'md:col-span-3 md:row-span-2' : 'md:col-span-2 md:row-span-2';
                      else if (pattern === 1) bentoClass = isLast ? 'md:col-span-1 md:row-span-2' : 'md:col-span-1 md:row-span-1';
                      else if (pattern === 2) bentoClass = 'md:col-span-1 md:row-span-1';
                      else if (pattern === 3) bentoClass = isLast ? 'md:col-span-3 md:row-span-1' : 'md:col-span-1 md:row-span-1';
                      else if (pattern === 4) bentoClass = 'md:col-span-2 md:row-span-1';
                    }

                    return (
                      <Pressable
                        key={index}
                        className={cn('bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group', isWeb ? `aspect-[1.414] md:aspect-auto ${bentoClass}` : 'aspect-[1.414] w-full')}
                        onPress={() => {
                          setSelectedCert(cert);
                        }}
                      >
                        {isPdfUrl(cert.file_url) ? (
                          Platform.OS === 'web' && isWeb ? (
                            <View style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ height: '100%', maxWidth: '100%', aspectRatio: 1.414, position: 'relative', overflow: 'hidden' }}>
                                <iframe src={`${cert.file_url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`} style={{ width: 'calc(100% + 24px)', height: 'calc(100% + 24px)', position: 'absolute', top: '-12px', left: '-12px', border: 'none' }} title="Certificate PDF" scrolling="no" />
                              </div>
                            </View>
                          ) : (
                            <View className="flex-1 bg-red-50 dark:bg-red-900/20 items-center justify-center px-4">
                              <MaterialCommunityIcons name="file-pdf-box" size={48} color="#ef4444" />
                              <Text className="text-red-500 font-bold mt-2 text-center">{t('about.pdfTapPreview')}</Text>
                            </View>
                          )
                        ) : (
                          <Image source={{ uri: cert.file_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        )}

                        {/* Hover overlay on web */}
                        {Platform.OS === 'web' && (
                          <View className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors items-center justify-center">
                            <View className="w-12 h-12 rounded-full bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 shadow-sm">
                              <MaterialCommunityIcons name="magnify" size={24} color="#000" />
                            </View>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </MotiView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* PDF/Image Preview Modal (in-app: web iframe, native WebView — no external browser) */}
      <Modal
        visible={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        closeOnOverlayClick={true}
        size="xl"
      >
        <View className="w-full flex-1 min-h-[50vh] max-h-[85vh] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative items-center justify-center">
          <Pressable
            onPress={() => setSelectedCert(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 items-center justify-center rounded-full transition-colors cursor-pointer"
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
          {selectedCert?.file_url && (
            isPdfUrl(selectedCert.file_url) ? (
              Platform.OS === 'web' && isWeb ? (
                <div style={{ height: '100%', maxWidth: '100%', aspectRatio: 1.414, position: 'relative', overflow: 'hidden' }}>
                  <iframe
                    src={`${selectedCert?.file_url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                    style={{ width: 'calc(100% + 24px)', height: 'calc(100% + 24px)', position: 'absolute', top: '-12px', left: '-12px', border: 'none' }}
                    title="Certificate PDF"
                    scrolling="no"
                  />
                </div>
              ) : Platform.OS === 'web' && !isWeb ? (
                <MobileWebCertPdfViewer key={selectedCert.file_url} url={selectedCert.file_url} />
              ) : (
                <NativeCertPdfViewer key={selectedCert.file_url} url={selectedCert.file_url} />
              )
            ) : (
              <Image source={{ uri: selectedCert.file_url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            )
          )}
        </View>
      </Modal>
    </>
  );
}

function MobileWebCertPdfViewer({ url }: { url: string }) {
  const { t } = useLanguage();
  // PDF.js viewer (remote, lazy via iframe — 0 byte ke bundle).
  // Sumber viewer cukup diganti di lib/pdf-viewer.ts untuk migrasi self-host.
  const viewerUrl = useMemo(() => buildPdfJsViewerUrl(url), [url]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setFailed(true);
    }, PDF_PREVIEW_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url]);

  const handleLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(false);
  };

  const openRawPdf = () => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    } else {
      Linking.openURL(url);
    }
  };

  if (failed) {
    return (
      <div style={{ width: '100%' }}>
        <View className="items-center justify-center px-6 py-10">
          <MaterialCommunityIcons name="file-alert-outline" size={48} color="#9ca3af" />
          <Text className="text-gray-700 dark:text-gray-300 font-semibold mt-3 text-center">
            {t('about.previewFailedTitle')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-4 text-center">
            {t('about.previewFailedHint')}
          </Text>
          <View className="flex-row flex-wrap items-center justify-center gap-2">
            <Pressable
              onPress={() => {
                setFailed(false);
                setLoading(true);
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                  setLoading(false);
                  setFailed(true);
                }, PDF_PREVIEW_TIMEOUT_MS);
              }}
              className="px-6 py-3 rounded-full bg-primary-600"
            >
              <Text className="text-white font-semibold">{t('common.retry')}</Text>
            </Pressable>
            <Pressable onPress={openRawPdf} className="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700">
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">{t('about.openPdf')}</Text>
            </Pressable>
          </View>
        </View>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">{t('about.previewLoading')}</Text>
          </div>
        )}
        <iframe
          title="Certificate PDF"
          src={viewerUrl}
          onLoad={handleLoad}
          style={{ width: '100%', height: 'min(62vh, 100%)', minHeight: 320, border: 'none' }}
          allowFullScreen
        />
      </div>
      <View className="flex-row flex-wrap items-center justify-center gap-2 mt-3 px-4 pb-2">
        <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">{t('about.previewEmptyHint')}</Text>
        <Pressable onPress={openRawPdf} className="px-6 py-3 rounded-full bg-primary-600">
          <Text className="text-white font-semibold">{t('about.openPdf')}</Text>
        </Pressable>
        <a href={url} target="_blank" rel="noopener noreferrer" download style={{ textDecoration: 'none' }}>
          <View className="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700">
            <Text className="text-gray-800 dark:text-gray-100 font-semibold">{t('about.download')}</Text>
          </View>
        </a>
      </View>
    </div>
  );
}

function NativeCertPdfViewer({ url }: { url: string }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [failReason, setFailReason] = useState<'offline' | 'server'>('offline');
  const [attempt, setAttempt] = useState(0);
  const { height: winH } = useWindowDimensions();
  // In-app via PDF.js (base URL 1-baris config — aman untuk migrasi self-host).
  const viewerUrl = useMemo(() => buildPdfJsViewerUrl(url, resolvePdfViewerBaseUrl()), [url]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    NetInfo.fetch().then((state) => {
      if (!cancelled && state.isConnected === false) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setLoading(false);
        setFailReason('offline');
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setFailReason('server');
      setFailed(true);
    }, PDF_PREVIEW_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [attempt, url]);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const openInBrowser = async () => {
    try {
      await WebBrowser.openBrowserAsync(url, { showTitle: true });
    } catch {
      Linking.openURL(url);
    }
  };

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setAttempt((a) => a + 1);
  };

  return (
    <View style={{ width: '100%', aspectRatio: 1.414, maxHeight: winH * 0.62, minHeight: Math.min(320, winH * 0.5) }}>
      {failed ? (
        <View className="flex-1 items-center justify-center px-6 bg-gray-100 dark:bg-gray-900">
          <MaterialCommunityIcons name="file-alert-outline" size={48} color="#9ca3af" />
          <Text className="text-gray-700 dark:text-gray-300 font-semibold mt-3 text-center">
            {t('about.previewFailedTitle')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">
            {failReason === 'offline'
              ? t('about.previewOffline')
              : t('about.previewServerError')}
          </Text>
          <View className="flex-row flex-wrap items-center justify-center gap-2 mt-4">
            <Pressable
              onPress={retry}
              className="px-6 py-3 rounded-full bg-primary-600"
            >
              <Text className="text-white font-semibold">{t('common.retry')}</Text>
            </Pressable>
            <Pressable
              onPress={openInBrowser}
              className="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">{t('about.openInBrowser')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            key={attempt}
            source={{ uri: viewerUrl }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            startInLoadingState
            onLoadEnd={() => {
              clearTimer();
              setLoading(false);
            }}
            onError={() => {
              clearTimer();
              setLoading(false);
              setFailReason('offline');
              setFailed(true);
            }}
            onHttpError={() => {
              clearTimer();
              setLoading(false);
              setFailReason('server');
              setFailed(true);
            }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
          />
          {loading && (
            <View
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
              className="bg-gray-100 dark:bg-gray-900"
            >
              <ActivityIndicator size="large" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3">{t('about.previewLoadingEllipsis')}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function isPdfUrl(url: string): boolean {
  const clean = url.toLowerCase().split('?')[0].split('#')[0];
  return clean.endsWith('.pdf');
}

function SkillLevel({ level }: { level: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((l) => (
        <View
          key={l}
          className={cn(
            'w-1.5 h-1.5 rounded transition-colors',
            l <= level ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      ))}
    </View>
  );
}

function SkillBadge({ name, isDark, isWeb }: { name: string, isDark: boolean, isWeb?: boolean }) {
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
    <View className={cn('rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border items-center justify-center shadow-sm px-1 py-3', isWeb === false ? 'w-[46%] min-w-[100px] min-h-[112px] shrink-0 grow-0' : 'w-24 h-24')}>
      {getIcon(name, isDark)}
      <Text className="text-gray-700 dark:text-gray-300 font-medium text-xs mt-3 text-center px-1" numberOfLines={2}>{name}</Text>
    </View>
  );
}

function ExperienceItem({ experience, isLast }: { experience: any; isLast: boolean }) {
  const { t } = useLanguage();
  const { role, company, period, description, technologies } = experience;

  return (
    <View className="flex-row gap-4">
      <View className="relative flex-shrink-0">
        <View className="w-3 h-3 mt-1.5 rounded-full bg-primary-500 z-10 shadow-sm" />
        {!isLast && (
          <View className="absolute left-[5px] top-6 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-gray-700" />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row flex-wrap items-baseline gap-2 mb-2">
          <Text className="font-semibold text-gray-900 dark:text-gray-100">{experience.role}</Text>
          <Text className="text-gray-500 dark:text-gray-400">{t('about.at')}</Text>
          <Text className="font-medium text-primary-600 dark:text-primary-400">{experience.company}</Text>
        </View>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">{experience.year}</Text>
        <Text className="text-gray-700 dark:text-gray-300 mb-3">{experience.description}</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {experience.technologies?.map((tech: string) => (
            <Badge key={tech} variant="outline" size="sm">{tech}</Badge>
          ))}
        </View>
      </View>
    </View>
  );
}

function EducationItem({ education, isLast }: { education: any; isLast: boolean }) {
  const { degree, school, period, description } = education;

  return (
    <View className="flex-row gap-4">
      <View className="relative flex-shrink-0">
        <View className="w-3 h-3 mt-1.5 rounded-full bg-primary-500 z-10 shadow-sm" />
        {!isLast && (
          <View className="absolute left-[5px] top-6 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-gray-700" />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 dark:text-gray-100">{education.degree}</Text>
        <Text className="text-primary-600 dark:text-primary-400 font-medium">{education.institution}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">{education.year}</Text>
        {!!education.description && <Text className="text-gray-700 dark:text-gray-300">{education.description}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
  profileHeader: {
    minHeight: 350,
  },
});