import { Pressable, Text } from 'react-native';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <Pressable
      onPress={() => setLang(lang === 'en' ? 'id' : 'en')}
      accessibilityLabel="Switch language"
      accessibilityRole="button"
      className="p-3.5 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors pointer-events-auto items-center justify-center"
    >
      <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase">
        {lang === 'en' ? 'EN' : 'ID'}
      </Text>
    </Pressable>
  );
}

export default LanguageToggle;
