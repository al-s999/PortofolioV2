import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '@/lib/local/en.json';
import id from '@/lib/local/id.json';

export type Lang = 'en' | 'id';

const DICTS: Record<Lang, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  id: id as Record<string, unknown>,
};

const STORAGE_KEY = 'language';

function resolveKey(dict: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const part of parts) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => resolveKey(DICTS.en, key) ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initial render 'en' to avoid flicker; persisted value loads async on mount.
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const load = async () => {
      try {
        let saved: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          saved = localStorage.getItem(STORAGE_KEY);
        } else {
          saved = await AsyncStorage.getItem(STORAGE_KEY);
        }
        if (saved === 'en' || saved === 'id') {
          setLangState(saved);
        }
      } catch (e) {
        console.error('Failed to load language', e);
      }
    };
    load();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, l);
      } else {
        AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
      }
    } catch (e) {
      // localStorage may throw (private mode / quota); state update above still applies.
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      try {
        return resolveKey(DICTS[lang], key) ?? resolveKey(DICTS.en, key) ?? key;
      } catch {
        return key;
      }
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
