import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, Linking, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProject } from '@/lib/queries';
import { localized } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Github, ExternalLink } from '@/components/ui';
import { useScrollNav } from '@/components/ScrollContext';
import { MotiView } from 'moti';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ProjectDetailScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: project, isLoading, isPaused, error, refetch } = useProject(id as string);
  const { onScroll } = useScrollNav();
  const { t, lang } = useLanguage();

  if (isPaused && !project) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-dark-bg px-6">
        <Text className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">{t('offline.waitingTitle')}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4 text-center">
          {t('offline.waitingDescription')}
        </Text>
        <Button variant="outline" onPress={() => refetch()}>
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-dark-bg px-4 pt-12">
        <View className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4 animate-pulse" />
        <View className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4 animate-pulse" />
        <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse" />
        <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-dark-bg px-6">
        <Text className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">{t('projects.detail.loadFailedTitle')}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4 text-center" numberOfLines={2}>
          {error instanceof Error ? error.message : t('common.fallbackError')}
        </Text>
        <View className="flex-row gap-3">
          <Button variant="outline" onPress={() => refetch()}>
            {t('common.retry')}
          </Button>
          <Button variant="outline" onPress={() => router.back()} leftIcon={<ArrowLeft size={18} />}>
            {t('projects.detail.goBack')}
          </Button>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-dark-bg">
        <Text className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-4">{t('projects.detail.notFound')}</Text>
        <Button variant="outline" onPress={() => router.back()} leftIcon={<ArrowLeft size={18} />}>
          {t('projects.detail.goBack')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-dark-bg w-full"
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Back Button - Aligned to far left */}
      <View className={cn('w-full', isWeb ? 'px-8 lg:px-12 pt-12' : 'px-4 pt-12')}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={24} className="text-gray-500 dark:text-gray-400" />
          <Text className="text-gray-600 dark:text-gray-300 font-semibold text-lg">{t('projects.detail.back')}</Text>
        </Pressable>
      </View>

      <View className={cn('w-full mx-auto', isWeb ? 'max-w-4xl px-8 lg:px-12' : 'px-4')}>

        <View className={cn('mb-8', isWeb ? 'pt-12' : 'pt-8')}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            {/* Header Content */}
            <Text className={cn('font-bold text-gray-900 dark:text-white mb-4', isWeb ? 'text-4xl lg:text-5xl' : 'text-3xl')}>
              {localized(project, lang, 'title', project.title)}
            </Text>

            <Text className={cn('text-gray-500 dark:text-gray-400 leading-relaxed mb-6', isWeb ? 'text-xl' : 'text-lg')}>
              {localized(project, lang, 'short_description', project.short_description || project.description)}
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-8">
              {project.tech_stack?.map((tech: string) => (
                <Badge key={tech} variant="outline" size="md">{tech}</Badge>
              ))}
            </View>
          </MotiView>
        </View>

        {/* Big Image Cover */}
        {project.image_url && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none mb-12 border border-gray-200 dark:border-dark-border"
          >
            <Image
              source={{ uri: project.image_url }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          </MotiView>
        )}

        {/* Full Description */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 400 }}
          className="mb-20"
        >
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('projects.detail.aboutProject')}</Text>
          <Text className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-12">
            {localized(project, lang, 'description', project.description)}
          </Text>

          {/* Dynamic Content Blocks */}
          {project.content_blocks && project.content_blocks.length > 0 && (
            <View className="flex-col gap-10 mb-12">
              {project.content_blocks.map((block: any, index: number) => {
                if (block.type === 'text') {
                  return (
                    <Text key={block.id || index} className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                      {localized(project, lang, `content_blocks.${index}.content`, block.content)}
                    </Text>
                  );
                }
                if (block.type === 'image' && block.image_url) {
                  const caption: string = localized(project, lang, `content_blocks.${index}.caption`, block.caption ?? '');
                  return (
                    <View key={block.id || index} className="w-full">
                      <Image
                        source={{ uri: block.image_url }}
                        style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 16 }}
                        resizeMode="cover"
                        className="shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-dark-border"
                      />
                      {!!caption && (
                        <Text className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">
                          {caption}
                        </Text>
                      )}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-4 pt-8 border-t border-gray-200 dark:border-gray-800">
            {project.github_url && (
              <Button
                leftIcon={<Github size={18} />}
                onPress={() => Linking.openURL(project.github_url!)}
                className="rounded-full flex-1 md:flex-none justify-center"
              >
                {t('projects.detail.sourceCode')}
              </Button>
            )}
            {project.demo_url && (
              <Button
                leftIcon={<ExternalLink size={18} />}
                variant="outline"
                onPress={() => Linking.openURL(project.demo_url!)}
                className="rounded-full flex-1 md:flex-none justify-center"
              >
                {t('projects.detail.seeProject')}
              </Button>
            )}
          </View>
        </MotiView>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
});
