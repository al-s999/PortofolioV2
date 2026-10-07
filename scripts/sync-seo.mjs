// scripts/sync-seo.mjs
// Opsi A: sinkron SEO statis dari data admin Supabase SEBELUM `expo export -p web`.
//
// - Fetch baris about_me terbaru via Supabase REST, bangun ulang blok SEO di
//   public/index.html (di antara <!-- SEO:BEGIN --> ... <!-- SEO:END -->)
//   + tulis public/sitemap.xml.
// - Aturan nilai SAMA PERSIS dengan lib/seo.ts (buildSeoFromAboutMe).
// - TIDAK PERNAH menggagalkan build: env hilang / fetch gagal / marker hilang
//   → warning + exit 0, template committed tetap dipakai.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE =
  (process.env.EXPO_PUBLIC_SITE_URL ??
    'https://portofoliov2.ahmadrosyidalfualdi.workers.dev/'
  ).replace(/\/+$/, '') + '/';
const SITE_ROOT = SITE.replace(/\/+$/, '');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const BEGIN = '<!-- SEO:BEGIN (dibuat ulang oleh scripts/sync-seo.mjs tiap build) -->';
const END = '<!-- SEO:END -->';

/** Escape untuk nilai atribut HTML + konten <title>. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTags(aboutMe) {
  const name = aboutMe?.nickname ?? aboutMe?.full_name ?? 'Ahmad Rosyid';
  const profession =
    aboutMe?.profession ?? 'Web Developer & Data Scientist';
  const title = `${name} — ${profession}`;

  const cleaned = String(aboutMe?.content ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  const description = cleaned
    ? cleaned.slice(0, 155)
    : `Portofolio ${name} — ${profession}.`;

  const skillNames =
    aboutMe?.skills?.map((s) => s?.name).filter(Boolean) ?? [];
  const keywords = `${profession}, ${skillNames.slice(0, 8).join(', ')}, portfolio`;

  const ogImage = aboutMe?.avatar_url || `${SITE_ROOT}/logo512.png`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: profession,
    description,
    image: ogImage,
  }).replace(/</g, '\\u003c');

  return { title, description, keywords, ogImage, jsonLd };
}

function renderBlock(tags) {
  const lines = [
    BEGIN,
    `    <title>${esc(tags.title)}</title>`,
    `    <meta name="description" content="${esc(tags.description)}" />`,
    `    <meta name="keywords" content="${esc(tags.keywords)}" />`,
    `    <link rel="canonical" href="${esc(SITE)}" />`,
    `    <meta property="og:title" content="${esc(tags.title)}" />`,
    `    <meta property="og:description" content="${esc(tags.description)}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:url" content="${esc(SITE)}" />`,
    `    <meta property="og:image" content="${esc(tags.ogImage)}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${esc(tags.title)}" />`,
    `    <meta name="twitter:description" content="${esc(tags.description)}" />`,
    `    <meta name="twitter:image" content="${esc(tags.ogImage)}" />`,
    `    <script type="application/ld+json">${tags.jsonLd}</script>`,
    `    ${END}`,
  ];
  return lines.join('\n');
}

function renderSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const routes = ['', 'about', 'projects', 'contact'];
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${esc(SITE + r)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function fetchAboutMe() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(
      `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/about_me?select=*&order=updated_at.desc&limit=1`,
      {
        signal: controller.signal,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Supabase REST ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data[0] ?? null;
    if (data && typeof data === 'object') return data;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function writeIfChanged(path, next) {
  let prev = null;
  try {
    prev = readFileSync(path, 'utf8');
  } catch {
    prev = null;
  }
  if (prev === next) {
    console.log(`[sync-seo] up to date: ${path}`);
    return;
  }
  writeFileSync(path, next);
  console.log(`[sync-seo] updated: ${path}`);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[sync-seo] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tidak di-set — pakai template SEO committed.'
    );
    return;
  }

  let aboutMe = null;
  try {
    aboutMe = await fetchAboutMe();
  } catch (err) {
    console.warn(`[sync-seo] fetch about_me gagal (${err?.message ?? err}) — pakai template SEO committed.`);
    return;
  }

  const htmlPath = join(ROOT, 'public', 'index.html');
  let html;
  try {
    html = readFileSync(htmlPath, 'utf8');
  } catch {
    console.warn('[sync-seo] public/index.html tidak ditemukan — lewati.');
    return;
  }
  if (!html.includes(BEGIN) || !html.includes(END)) {
    console.warn('[sync-seo] marker SEO:BEGIN/END tidak ditemukan — lewati (tidak menyentuh file).');
    return;
  }

  const tags = buildTags(aboutMe);
  const next = html.replace(
    new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    () => renderBlock(tags)
  );
  writeIfChanged(htmlPath, next);
  writeIfChanged(join(ROOT, 'public', 'sitemap.xml'), renderSitemap());
  console.log(`[sync-seo] sinkron dari about_me (updated_at: ${aboutMe?.updated_at ?? 'null'}).`);
}

await main();
