# Global SEO + Auto-Sync Admin Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap halaman web memancarkan SEO global (title, description, canonical, OG/Twitter fallback, JSON-LD) yang nilainya diambil dari data admin Supabase (`about_me`) dan ikut ter-update setiap admin mengubah data.

**Architecture:** Satu modul `lib/seo.ts` sebagai single source of truth (`buildSeoFromAboutMe`) dipakai semua screen via `expo-router/head` saat runtime (langsung sinkron, bagus untuk Google yang render JS) + shell statis diperkaya (`public/index.html`, `robots.txt`, `sitemap.xml` build-time) + auto-rebuild via Supabase Database Webhook → deploy hook agar HTML statis hasil `expo export` ikut segar untuk crawler non-JS.

**Tech Stack:** Expo Router (static export, `expo-router/head`), Supabase (`about_me`), Cloudflare Workers static (`dist/`, `wrangler.jsonc`), GitHub Actions (workflow baru, belum ada `.github/`).

**Spec:** User request + jawaban klarifikasi: (1) auto-rebuild **boleh**, (2) target utama **Google Search**, (3) SEO **global saja** (tidak per-project). Fakta codebase: SEO saat ini nol (`public/index.html` hanya punya `viewport`+`theme-color`, tanpa description/OG/canonical/robots/sitemap — hasil grep); data admin = tabel `about_me` (`nickname, full_name, profession, content, skills, avatar_url` — `types/index.ts:24-38`, form admin `app/admin/about.tsx:54-66`); hosting SPA fallback (`wrangler.jsonc: not_found_handling single-page-application`); `EXPO_PUBLIC_SITE_URL` sudah ada sebagai pola URL produksi (`.env.example:13`).

## Global Constraints

- SEO global saja — tidak ada `generateStaticParams`/`generateMetadata` per-project.
- `expo-router/head` hanya render di web; di native harus render nothing dan tidak boleh crash (guard `Platform.OS === 'web'`).
- Tidak ada secret baru di client — build script hanya pakai `EXPO_PUBLIC_SUPABASE_URL` + anon key yang sudah ada.
- `npx tsc --noEmit` harus bersih setiap task; `npx expo lint` diketahui rusak pre-existing (ESLint 9 vs legacy config) — catat saja.
- Copy Indonesia/Inggris mengikuti data admin apa adanya; tidak ada keyword stuffing.

## Review Focus

- `content` admin kosong/sangat pendek — expect fallback description statis yang tetap valid, bukan meta kosong.
- `avatar_url` null — expect OG image fallback ke `logo512.png`, bukan `content="null"`.
- `EXPO_PUBLIC_SITE_URL` tidak di-set saat export — expect canonical/robots/sitemap pakai fallback aman, build tidak gagal.
- Crawler non-JS (validator OG) hanya baca HTML statis — expect title/description/OG fallback selalu ada di `dist/index.html` walau data fetch gagal.
- Webhook double-fire (admin save 2x cepat) — expect rebuild ter-debounce/idempoten, bukan deploy menumpuk gagal.

---

### Task 1: `lib/seo.ts` — single source of truth dari data admin

**Files:**
- Create: `lib/seo.ts`
- Test: `npx tsc --noEmit` + node smoke (tanpa harness baru)

**Interfaces:**
- Consumes: `AboutMe` dari `@/types` (`nickname, full_name, profession, content, skills, avatar_url`).
- Produces: `export function buildSeoFromAboutMe(aboutMe: AboutMe | null | undefined, siteUrl: string): SeoTags` dengan `SeoTags = { title: string; description: string; keywords: string; canonical: string; ogImage: string; jsonLd: string }` — dipakai Task 2 di semua screen; `jsonLd` adalah string JSON Person (name, jobTitle, description, image) siap inject via `<script type="application/ld+json">`.

- [ ] **Step 1: Write the failing check**

```bash
ls lib/seo.ts
```
Expected: FAIL (`No such file`).

- [ ] **Step 2: Implement `buildSeoFromAboutMe` in `lib/seo.ts`**

Aturan nilai (exact): `title = "{nickname || full_name || 'Ahmad Rosyid'} — {profession || 'Web Developer & Data Scientist'}"`; `description` = 155 karakter pertama `content` (trim, collapse whitespace), fallback `'Portofolio {nama} — {profession}.'` bila kosong; `keywords` = `"{profession}, {top 8 skill names}, portfolio"`; `canonical = siteUrl || 'https://example.com'`; `ogImage = avatar_url || '{siteUrl}/logo512.png'`; `siteUrl` dibaca dari `process.env.EXPO_PUBLIC_SITE_URL` di call-site, bukan di dalam modul (modul murni, testable).

- [ ] **Step 3: Run check to verify it passes**

Run: `npx tsc --noEmit`
Expected: PASS (exit 0).

- [ ] **Step 4: Commit**

```bash
git add lib/seo.ts
git commit -m "feat(seo): global seo builder from admin data"
```

### Task 2: Runtime `<Head>` dinamis di 4 screen

**Files:**
- Modify: `app/(tabs)/index.tsx`, `app/(tabs)/about.tsx`, `app/(tabs)/projects.tsx`, `app/(tabs)/contact.tsx` (tambah blok `<Head>` di atas return, guard web-only)
- Test: `npx expo export -p web` + grep HTML

**Interfaces:**
- Consumes: `buildSeoFromAboutMe` dari Task 1 + `useAboutMe()` yang sudah ada di tiap screen.
- Produces: tiap screen memancarkan `<title>`, `meta[name=description]`, `meta[name=keywords]`, `link[rel=canonical]`, `og:title/description/type/url/image`, `twitter:card/title/description/image`, dan 1 `script[type="application/ld+json"]` — isi identik antar screen (global).

- [ ] **Step 1: Write the failing check**

```bash
grep -r "expo-router/head" app/\(tabs\)/ || echo MISSING
```
Expected: `MISSING`.

- [ ] **Step 2: Implement `<Head>` block in tiap screen**

Pola exact per screen (contoh `index.tsx`, ulangi di 3 file lain): `import Head from 'expo-router/head'`; di dalam komponen `const seo = buildSeoFromAboutMe(aboutMe, process.env.EXPO_PUBLIC_SITE_URL ?? '')`; render `{Platform.OS === 'web' && (<Head>…tags dari seo…</Head>)}` sebagai sibling pertama. Data berubah dari admin → `useAboutMe` refetch → tags ikut berubah tanpa rebuild (untuk Google). Desktop/mobile/native layout tidak berubah.

- [ ] **Step 3: Run check to verify it passes**

Run: `npx tsc --noEmit && npx expo export -p web 2>&1 | tail -3`
Expected: PASS, `dist/` ter-generate.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx app/\(tabs\)/about.tsx app/\(tabs\)/projects.tsx app/\(tabs\)/contact.tsx
git commit -m "feat(seo): dynamic head tags from admin data"
```

### Task 3: Shell statis — `index.html`, `robots.txt`, sitemap build-time

**Files:**
- Modify: `public/index.html`, `app.json`
- Create: `public/robots.txt`, `scripts/generate-sitemap.mjs`
- Test: `dist/index.html` + `dist/sitemap.xml` hasil export

**Interfaces:**
- Consumes: `EXPO_PUBLIC_SITE_URL` (fallback `https://example.com` bila kosong — build tidak boleh gagal).
- Produces: `dist/sitemap.xml` berisi `/`, `/about`, `/projects`, `/contact` + `lastmod` = tanggal build; `robots.txt` menunjuk `Sitemap: {siteUrl}/sitemap.xml`.

- [ ] **Step 1: Write the failing check**

```bash
ls public/robots.txt scripts/generate-sitemap.mjs
```
Expected: FAIL (keduanya missing).

- [ ] **Step 2: Implement shell + sitemap script**

`index.html`: tambah `meta[name=description]`, `link[rel=canonical]`, OG/Twitter fallback statis (nilai generik, bukan data admin — runtime Task 2 yang menimpa saat JS jalan, untuk crawler non-JS). `robots.txt`: `User-agent: * / Allow: /` + `Sitemap:` line. `scripts/generate-sitemap.mjs`: baca env site URL, tulis 4 URL statis ke `dist/sitemap.xml` (tanpa query Supabase — global saja, sesuai jawaban). `app.json`: `web.output: "static"`.

- [ ] **Step 3: Run check to verify it passes**

Run: `npm run build:web && grep -o "<title>[^<]*" dist/index.html && ls -la dist/sitemap.xml && head -5 dist/sitemap.xml`
Expected: PASS — title/OG fallback ada di HTML mentah, sitemap valid.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/robots.txt scripts/generate-sitemap.mjs app.json package.json
git commit -m "feat(seo): static shell robots sitemap"
```

### Task 4: Auto-rebuild saat admin ubah data

**Files:**
- Create: `.github/workflows/web-seo.yml`
- Create: `docs/SEO-REBUILD.md` (satu file docs, bukan plan)
- Test: dry-run workflow + `tsc`

**Interfaces:**
- Consumes: Supabase Database Webhook (`about_me`, `projects` → UPDATE/INSERT) memanggil deploy hook; secret `DEPLOY_HOOK_URL` di GitHub.
- Produces: setiap perubahan admin → `expo export -p web` + `generate-sitemap` + publish `dist/` (Cloudflare), dengan `concurrency: group: web-seo` agar double-fire tidak menumpuk.

- [ ] **Step 1: Write the failing check**

```bash
ls .github/workflows/web-seo.yml
```
Expected: FAIL (missing — belum ada `.github/` sama sekali).

- [ ] **Step 2: Implement workflow + docs**

Workflow exact steps: `checkout → setup node 20 → npm ci → npx tsc --noEmit → npm run build:web → node scripts/generate-sitemap.mjs → deploy dist/ (wrangler)`; trigger `repository_dispatch[type=supabase-data-changed]` + `workflow_dispatch` manual. `docs/SEO-REBUILD.md`: langkah klik-di-Supabase (Database → Webhooks → on `about_me`/`projects`) + isi secret — tanpa kredensial asli.

- [ ] **Step 3: Run check to verify it passes**

Run: `npx tsc --noEmit && git status --short`
Expected: PASS, hanya 2 file baru.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/web-seo.yml docs/SEO-REBUILD.md
git commit -m "feat(seo): auto rebuild on admin data change"
```

## Self-Review

1. **Spec coverage:** "Sebanyak-banyaknya" → title/description/keywords/canonical/OG/Twitter/JSON-LD/robots/sitemap (Task 1–3); "menyesuaikan setiap perubahan admin" → runtime Head (instan, Google) + webhook rebuild (HTML statis, crawler non-JS) (Task 2+4). Global-only sesuai jawaban — tanpa per-project scope creep.
2. **Step scan:** Setiap step menghasilkan satu artefak checkable (`ls`/grep/tsc/export); tidak ada "optimasi SEO secukupnya" yang vague — nilai exact di Task 1 Step 2.
3. **Type consistency:** `buildSeoFromAboutMe(aboutMe, siteUrl): SeoTags` didefinisikan sekali di Task 1, dipakai verbatim di Task 2; tidak ada nama fungsi ganda.
4. **Review Focus:** 5 risiko tercakup (fallback kosong → Task 1; avatar null → Task 1; SITE_URL kosong → Task 3; non-JS → Task 3; double-fire → Task 4 concurrency).
5. **Proportion:** Plan ~1/3 dari kode yang akan ditulis; body implementasi diserahkan ke eksekutor, hanya signature + nilai exact yang dipin.