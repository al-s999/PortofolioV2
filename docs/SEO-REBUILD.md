# SEO Auto-Rebuild (Opsi A + Deploy Hook)

Alur: admin ubah data → Supabase Database Webhook POST → Cloudflare Deploy Hook →
Workers Builds jalan (`npm run build:web` = `sync-seo` + `expo export`) → `dist/`
segar dengan SEO baru → deploy otomatis.

## 1. Cloudflare dashboard (sekali saja, ~5 menit)

Worker `portofoliov2` → **Settings > Builds**:

1. Pastikan **Git Repository** tersambung dan production branch = `main`.
2. **Build command** = `npm run build:web`
   (menjalankan `scripts/sync-seo.mjs` dulu, lalu `expo export -p web`).
3. **Variables** (Build-time, jangan masuk git):
   - `EXPO_PUBLIC_SUPABASE_URL` = URL project Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = anon key (publik, aman untuk build)
   - `EXPO_PUBLIC_SITE_URL` = `https://portofoliov2.ahmadrosyidalfualdi.workers.dev/`
4. **Settings > Builds > Deploy Hooks** → Create:
   - Name: `supabase-about-me`, Branch: `main` → **salin URL hook**.
   - URL ini = kredensial (siapa pun yang pegang bisa trigger build).
     Jangan masuk git/chat. Bocor → delete + buat baru.

## 2. Supabase dashboard (sekali saja)

**Database > Webhooks** → Create webhook:

- Name: `rebuild-portfolio-seo`
- Table: `about_me`
- Events: centang **INSERT** + **UPDATE** (cukup; DELETE tidak mengubah SEO tampil)
- Type: **HTTP POST**, URL: tempel Deploy Hook dari langkah 1
- Headers: tidak perlu tambahan (Cloudflare mengabaikan body, hanya butuh POST)

## 3. Uji

1. Edit 1 field di tabel `about_me` (mis. `profession` + " (test)").
2. Cloudflare → Worker → **Builds**: build baru muncul, kolom Triggered by =
   `supabase-about-me` + label `deploy hook`.
3. Tunggu deploy hijau → buka `view-source:https://portofoliov2.ahmadrosyidalfualdi.workers.dev/`
   → `<title>` / description / keywords = data baru.
4. Kembalikan field test → webhook men-trigger build lagi otomatis.
5. Opsional: cek `https://portofoliov2.ahmadrosyidalfualdi.workers.dev/sitemap.xml`
   (`lastmod` = tanggal build) dan `/robots.txt`.

## 4. Perilaku penting

- **Build tidak pernah gagal karena SEO**: `sync-seo` selalu exit 0 —
  env hilang / Supabase down → warning + template committed dipakai.
- **Dedup otomatis**: webhook retry/burst sebelum build jalan tidak bikin build ganda.
- **Rate limit**: 10 build/menit per Worker (frekuensi edit admin jauh di bawah ini).
- **Caching**: kalau dashboard agresif cache `public/`, build pertama setelah
  perubahan admin memakai data terbaru karena `sync-seo` selalu fetch ulang.

## 5. Troubleshooting

| Gejala | Cek |
|---|---|
| Edit admin tidak trigger build | Supabase Webhooks → Logs (terkirim? status?); URL hook masih aktif? |
| Build jalan tapi SEO lama | Variables build terisi? `sync-seo` log `[sync-seo] sinkron dari about_me` ada di build log? |
| Build merah | Bukan dari `sync-seo` (exit 0 selalu) — baca log `expo export` |
| Hook disalahgunakan | Delete hook di dashboard → buat baru → update URL di Supabase |

## 6. File terkait

- `scripts/sync-seo.mjs` — fetch + inject (aturan nilai = `lib/seo.ts`)
- `lib/seo.ts` + `lib/seo-metadata.ts` — builder + `generateMetadata` (runtime/EAS)
- `public/index.html` (`SEO:BEGIN/END`) — template fallback
- `public/robots.txt` — statis; `public/sitemap.xml` — generate tiap build (gitignored)
