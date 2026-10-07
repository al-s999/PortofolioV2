import type { AboutMe } from '@/types';

export interface SeoTags {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage: string;
  jsonLd: string;
}

export function buildSeoFromAboutMe(
  aboutMe: AboutMe | null | undefined,
  siteUrl: string
): SeoTags {
  const name = aboutMe?.nickname ?? aboutMe?.full_name ?? 'Ahmad Rosyid';
  const profession = aboutMe?.profession ?? 'Web Developer & Data Scientist';

  const title = `${name} — ${profession}`;

  const rawContent = aboutMe?.content ?? '';
  const cleanedContent = rawContent.trim().replace(/\s+/g, ' ');
  const description = cleanedContent
    ? cleanedContent.slice(0, 155)
    : `Portofolio ${name} — ${profession}.`;

  const skillNames = aboutMe?.skills?.map((s) => s.name) ?? [];
  const topSkills = skillNames.slice(0, 8);
  const keywords = `${profession}, ${topSkills.join(', ')}, portfolio`;

  const canonical = siteUrl || 'https://example.com';
  const ogImage = aboutMe?.avatar_url ?? `${canonical}/logo512.png`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: profession,
    description,
    image: ogImage,
  });

  return {
    title,
    description,
    keywords,
    canonical,
    ogImage,
    jsonLd,
  };
}