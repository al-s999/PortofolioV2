import { buildSeoFromAboutMe, type SeoLang } from '@/lib/seo';
import type { AboutMe } from '@/types';

/** URL produksi — 1 sumber untuk semua generateMetadata + fallback. */
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ??
  'https://portofoliov2.ahmadrosyidalfualdi.workers.dev/';

/** Fetch baris about_me terbaru. Aman untuk generateMetadata / build-time. */
async function fetchLatestAboutMe(): Promise<AboutMe | null> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const res = await fetch(
    `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/about_me?select=*&order=updated_at.desc&limit=1`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }
  );
  if (!res.ok) return null;

  const data: unknown = await res.json();
  if (Array.isArray(data)) return (data[0] as AboutMe) ?? null;
  return null;
}

/** generateMetadata global — dipakai semua screen, 1 sumber kebenaran. EN default; ID bila caller meminta. */
export async function generateGlobalMetadata(lang: SeoLang = 'en') {
  try {
    return buildSeoFromAboutMe(await fetchLatestAboutMe(), SITE_URL, lang);
  } catch {
    return buildSeoFromAboutMe(null, SITE_URL, lang);
  }
}
