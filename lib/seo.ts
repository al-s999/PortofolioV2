import type { AboutMe, I18nMap } from '@/types';

export type SeoLang = 'en' | 'id';

export interface SeoAlternate {
  hreflang: string;
  href: string;
}

export interface SeoTags {
  lang: SeoLang;
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage: string;
  jsonLd: string;
  /** hreflang alternates: EN default + ID variant + x-default (consumed by sync-seo.mjs). */
  alternates: SeoAlternate[];
}

/** Pick a translated scalar from the `i18n` JSONB mirror, EN fallback when missing. Names/URLs are never translated (Task 8 allowlist). */
function localizedField(
  i18n: I18nMap | undefined,
  lang: SeoLang,
  field: string
): string | undefined {
  if (lang === 'en') return undefined;
  const value = i18n?.[lang]?.[field];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

export function buildSeoFromAboutMe(
  aboutMe: AboutMe | null | undefined,
  siteUrl: string,
  lang: SeoLang = 'en'
): SeoTags {
  const name = aboutMe?.nickname ?? aboutMe?.full_name ?? 'Ahmad Rosyid';
  const profession =
    localizedField(aboutMe?.i18n, lang, 'profession') ??
    aboutMe?.profession ??
    'Web Developer & Data Scientist';

  const title = `${name} — ${profession}`;

  const rawContent =
    localizedField(aboutMe?.i18n, lang, 'content') ?? aboutMe?.content ?? '';
  const cleanedContent = rawContent.trim().replace(/\s+/g, ' ');
  const description = cleanedContent
    ? cleanedContent.slice(0, 155)
    : `Portofolio ${name} — ${profession}.`;

  const skillNames = aboutMe?.skills?.map((s) => s.name).filter((name) => name) ?? [];
  const topSkills = skillNames.slice(0, 8);
  const keywords = `${profession}, ${topSkills.join(', ')}, portfolio`;

  const canonical = siteUrl || 'https://portofoliov2.ahmadrosyidalfualdi.workers.dev/';
  const siteRoot = canonical.replace(/\/+$/, '');
  const ogImage = aboutMe?.avatar_url || `${siteRoot}/logo512.png`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: profession,
    description,
    image: ogImage,
    inLanguage: lang === 'id' ? 'id' : 'en',
  });

  const alternates: SeoAlternate[] = [
    { hreflang: 'en', href: canonical },
    { hreflang: 'id', href: `${siteRoot}/?lang=id` },
    { hreflang: 'x-default', href: canonical },
  ];

  return {
    lang,
    title,
    description,
    keywords,
    canonical,
    ogImage,
    jsonLd,
    alternates,
  };
}