# Full ID/EN i18n + DeepL Auto-translate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full-website EN/ID translation with a toggle grouped with the theme button, static UI strings in `lib/local/en.json` + `lib/local/id.json`, and admin-entered content auto-translated via DeepL Free through a Supabase Edge Function, stored in `i18n JSONB` columns with EN fallback + per-form "Translate ulang".

**Architecture:** Static chrome strings live in repo JSON dictionaries consumed via a `LanguageContext`; dynamic content (about/projects/contacts) keeps its source row in Supabase plus an `i18n` JSONB mirror filled server-assisted on every admin save (DeepL `target_lang` only, `source_lang` omitted = auto-detect). DeepL key lives only in Supabase secrets, never in `EXPO_PUBLIC_*`.

**Tech Stack:** Expo Router + React Native/Web, Supabase (Postgres + Edge Functions Deno), DeepL Free REST (`https://api-free.deepl.com/v2/translate`), `localStorage` web / `AsyncStorage` native persistence, `tsc --noEmit` verification (no unit-test harness in repo).

**Spec:** prior decisions in-chat (full website; toggle grouped with theme; default EN + remembered; source bebas + auto-detect; Free via Edge Function; auto + re-translate button; `i18n JSONB`; EN fallback + re-translate; DeepL secret **not yet set**).

## Global Constraints

- Never expose DeepL key to client: no `EXPO_PUBLIC_DEEPL*`, only Supabase secret `DEEPL_AUTH_KEY` (Free key ends `:fx`).
- DeepL Free endpoint is `https://api-free.deepl.com` (Pro is `https://api.deepl.com`); tier limit ~500k chars/month.
- Default language `en`; persisted key `language`; never translate names/URLs/tech tokens (Task 8 allowlist).
- Static dict path is `lib/local/en.json` + `lib/local/id.json` (user-specified, not `locales/`).
- Run `npx tsc --noEmit` before declaring any task done; `npx expo lint` is known-broken repo-wide (legacy `.eslintrc` vs ESLint 9) and is not a gate.

## Review Focus

- Indonesian text containing a URL/email/skill name gets mangled by translation → translator must skip non-translatables; expect them byte-identical.
- Admin saves while Edge Function down/quota out must still save source + mark pending, never block the save.
- Missing `id` key at render must fall back to EN silently, never blank/throw.
- Late `beforeinstallprompt` + language switch must not duplicate or un-translate the install toast.
- Mobile 360px: language + theme buttons must not overlap content or tab bar; expect both tappable with no layout shift.

---

## File structure

- Create `lib/local/en.json`, `lib/local/id.json` — static UI strings, namespaced (`tabs, common, home, about, projects, contact, admin, auth, toast, install, offline`). One responsibility: copy only.
- Create `lib/i18n/LanguageContext.tsx` — `LanguageProvider`, `useLanguage()`, `t()` with EN fallback; persistence (`localStorage`/`AsyncStorage`).
- Create `components/ui/LanguageToggle.tsx` — toggle button mirroring theme-button styling.
- Create `supabase/functions/translate/index.ts` — Deno Edge Function calling DeepL Free; batch `text[]`, `target_lang` only.
- Create `lib/i18n/autoTranslate.ts` — client helper: `collectTranslatables()`, `translateViaEdge()`, `mergeTranslations()` + field allowlist.
- Create `supabase/migrations/XXXX_i18n_jsonb.sql` — add `i18n JSONB DEFAULT '{}'` to `about_me, projects, contacts`.
- Modify `lib/providers.tsx`, `app/(tabs)/_layout.tsx`, `components/admin/AdminSidebar.tsx`, `app/(auth)/login.tsx`, public screens, `app/admin/*` save handlers, `types/index.ts`, `lib/queries/index.ts`, `.env.example`.

---

### Task 1: Static dictionaries `lib/local/en|id.json`

**Files:**
- Create: `lib/local/en.json`
- Create: `lib/local/id.json`
- Test: `scripts/check-i18n-parity.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: JSON dicts with identical key sets; namespaces `tabs, common, home, about, projects, contact, admin, auth, toast, install, offline`. Later tasks consume via `t('home.hero.title')`.

- [ ] **Step 1: Write the failing check** — script asserts `en`/`id` have identical key sets and `install` copy has no word "desktop" and toast copy equals `Install app / Install this portfolio as an app for faster access.` + `Install App`.
- [ ] **Step 2: Run check to verify it fails** — Run: `node scripts/check-i18n-parity.mjs`. Expected: FAIL (files missing).
- [ ] **Step 3: Implement `lib/local/en.json` + `lib/local/id.json`** — full key coverage for chrome + all public/admin screens (copy from current hardcode; EN source, ID translation; install toast EN as pinned above).
- [ ] **Step 4: Run check to verify it passes** — Run: `node scripts/check-i18n-parity.mjs` + `npx tsc --noEmit`. Expected: PASS, tsc exit 0.
- [ ] **Step 5: Commit** — `git add lib/local/en.json lib/local/id.json scripts/check-i18n-parity.mjs && git commit -m "feat(i18n): add en/id static dictionaries"`

### Task 2: `LanguageProvider` + persistence

**Files:**
- Create: `lib/i18n/LanguageContext.tsx`
- Modify: `lib/providers.tsx:28-34`
- Test: manual + `npx tsc --noEmit`

**Interfaces:**
- Consumes: `lib/local/en.json`, `lib/local/id.json` from Task 1.
- Produces: `LanguageProvider`, `useLanguage(): { lang: 'en'|'id', setLang(l), t(key: string): string }`. All later tasks consume `useLanguage()`.

- [ ] **Step 1: Write the failing check** — render-less node check importing the context module fails (`LanguageProvider` not defined); plus assert `t('missing.key')` falls back to EN string, never throws.
- [ ] **Step 2: Run to verify it fails** — Run: `npx tsc --noEmit`. Expected: FAIL (missing module in `providers.tsx`).
- [ ] **Step 3: Implement `LanguageProvider` in `lib/i18n/LanguageContext.tsx`** — state default `'en'`, async load persisted `language` (`localStorage` web / `AsyncStorage` native, mirror `app/_layout.tsx:10-55` ThemeSync), `t()` with EN fallback; wire into `lib/providers.tsx` around `ToastProvider`.
- [ ] **Step 4: Verify** — Run: `npx tsc --noEmit`. Expected: PASS. Manual: reload keeps `EN`, `t('nope')` returns EN fallback.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): add LanguageProvider with persisted en default"`

### Task 3: `LanguageToggle` placement (grouped with theme)

**Files:**
- Create: `components/ui/LanguageToggle.tsx`
- Modify: `components/ui/index.ts`, `app/(tabs)/_layout.tsx:104-109`, `components/admin/AdminSidebar.tsx:88-89,162-163`, `app/(auth)/login.tsx:86-89`

**Interfaces:**
- Consumes: `useLanguage()` from Task 2.
- Produces: `<LanguageToggle />` button; layout contract: absolute top-right `View flex-row gap-2` with theme button, `z-50`.

- [ ] **Step 1: Write the failing check** — assert `<LanguageToggle />` renders current lang label (`EN`/`ID`) with `accessibilityLabel="Switch language"`; fails (component missing).
- [ ] **Step 2: Run to verify it fails** — Run: `npx tsc --noEmit`. Expected: FAIL.
- [ ] **Step 3: Implement `LanguageToggle`** — styling mirrors theme button (`p-3.5 rounded-full bg-white dark:bg-gray-800 shadow-lg border`); `onPress` flips `en↔id` + persists. Replace single theme `Pressable` in `(tabs)/_layout` with container holding both buttons; add same toggle next to admin-sidebar and login theme buttons. Do NOT put inside tab bar (`_layout.tsx:46-94`).
- [ ] **Step 4: Verify** — Run: `npx tsc --noEmit`. Expected: PASS. Manual 360px + desktop: no overlap, both tappable, dark mode intact.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): add LanguageToggle grouped with theme toggle"`

### Task 4: Chrome strings migration (tabs, banner, install toast)

**Files:**
- Modify: `app/(tabs)/_layout.tsx:22-28,89-92`, `app/(tabs)/index.tsx` install-toast block, `public/manifest.json`
- Test: `scripts/check-i18n-parity.mjs` + grep

**Interfaces:**
- Consumes: `t()` from Task 2, toggle from Task 3.
- Produces: no hardcoded chrome strings; install toast copy pinned (EN) via dict.

- [ ] **Step 1: Write the failing check** — grep asserts zero hardcoded `Home|Anda offline|Install aplikasi|Pasang portfolio` in `_layout.tsx`/`index.tsx` toast block; fails now.
- [ ] **Step 2: Run to verify it fails** — Run: `rg -n "Install aplikasi|Anda offline" app/\(tabs\)/_layout.tsx app/\(tabs\)/index.tsx`. Expected: matches found.
- [ ] **Step 3: Migrate chrome to `t()`** — tab titles, `OfflineBanner`, install toast (`title/description/action` from `install` namespace; keep once-per-session `sessionStorage` behavior and highlighted button from prior work).
- [ ] **Step 4: Verify** — Run: same `rg` (no matches) + `npx tsc --noEmit`. Expected: PASS. Manual: toggle language → tab labels/banner/toast switch; reload same tab → toast still once-per-session.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): migrate chrome strings to dictionaries"`

### Task 5: Full public pages migration

**Files:**
- Modify: `app/(tabs)/index.tsx`, `app/(tabs)/about.tsx`, `app/(tabs)/projects.tsx`, `app/(tabs)/contact.tsx`, `app/projects/[id].tsx`
- Test: grep + `tsc`

**Interfaces:**
- Consumes: `t()` + dynamic `localized()` helper contract (defined in Task 6, stubbed here as `row[field] ?? ''` if needed — Task 5 uses static parts only; dynamic content wiring completes in Task 9).

- [ ] **Step 1: Write the failing check** — per-screen grep for hardcoded UI sentences (hero, buttons, section titles, form labels, empty/error states); expect matches.
- [ ] **Step 2: Run to verify it fails** — Run: `rg -n "View Projects|Let's Connect|Featured Skills" app/\(tabs\)/index.tsx`. Expected: matches found.
- [ ] **Step 3: Replace static copy with `t('home.*'|'about.*'|'projects.*'|'contact.*')`** — dynamic DB content untouched in this task (only `??` fallbacks stay).
- [ ] **Step 4: Verify** — Run: `npx tsc --noEmit` + toggle EN/ID across all four tabs. Expected: PASS, no blank strings, no missing-key throw (Review Focus: missing key → EN).
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): migrate public pages to en/id"`

### Task 6: Supabase `i18n JSONB` migration

**Files:**
- Create: `supabase/migrations/XXXX_i18n_jsonb.sql`
- Modify: `types/index.ts:24-85`
- Test: `supabase db push --dry-run` (or local)

**Interfaces:**
- Consumes: `supabase/schema.sql` tables `about_me, projects, contacts`.
- Produces: columns `i18n JSONB DEFAULT '{}'` on all three tables; TS type `i18n?: Record<string, unknown>` on `AboutMe, Project, Contact`.

- [ ] **Step 1: Write the failing check** — SQL/TS assert `about_me.i18n`, `projects.i18n`, `contacts.i18n` exist; fails (columns absent).
- [ ] **Step 2: Run to verify it fails** — Run: `supabase db push --dry-run` / select introspection. Expected: FAIL/missing.
- [ ] **Step 3: Implement migration** — `ALTER TABLE … ADD COLUMN IF NOT EXISTS i18n JSONB DEFAULT '{}'` (+ optional GIN index); backfill `{}`; extend TS interfaces. RLS unchanged (public read / admin write per `schema.sql:73-103`).
- [ ] **Step 4: Verify** — Run migration dry-run + `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** — `git add supabase/migrations/ types/index.ts && git commit -m "feat(i18n): add i18n jsonb to content tables"`

### Task 7: Edge Function `translate` (DeepL Free, key in secrets)

**Files:**
- Create: `supabase/functions/translate/index.ts`
- Modify: `.env.example` (document server-only `DEEPL_AUTH_KEY`, no `EXPO_PUBLIC_` prefix)
- Test: `curl` against local/edge + usage endpoint

**Interfaces:**
- Consumes: Supabase secrets `DEEPL_AUTH_KEY` (user to set; currently **not set** — function must return structured `DEEPL_NOT_CONFIGURED` until then).
- Produces: `POST /functions/v1/translate { texts: string[], target_lang: 'ID'|'EN' } → { translations: string[] }`; errors `{ code: 'QUOTA'|'AUTH'|'UPSTREAM', message }`. Called only by Task 8.

- [ ] **Step 1: Write the failing check** — `curl POST {texts:["Hello"],target_lang:"ID"}` expects `{translations:["Halo"]}` shape; fails (function missing).
- [ ] **Step 2: Run to verify it fails** — Run: `supabase functions serve translate` + curl. Expected: 404/not-found.
- [ ] **Step 3: Implement Deno handler** — read key from `Deno.env`, POST `https://api-free.deepl.com/v2/translate` form-encoded (`text[]`, `target_lang`, **no `source_lang`** = auto-detect), batch ≤50, map per-index; map 403→`AUTH` (hint Free↔Pro endpoint mix-up), 429/456→`QUOTA`; require admin JWT.
- [ ] **Step 4: Verify** — Run: curl success + curl with bad key → structured `AUTH`; `supabase secrets set DEEPL_AUTH_KEY=...:fx` (user action) then redeploy. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): add translate edge function via deepl free"`

### Task 8: Client `autoTranslate` helper + allowlist

**Files:**
- Create: `lib/i18n/autoTranslate.ts`
- Test: node assertions (no network: pure collect/merge tests)

**Interfaces:**
- Consumes: Edge Function contract from Task 7.
- Produces: `collectTranslatables(table, data): {path,text}[]`, `translateViaEdge(texts, targetLang): Promise<string[]>`, `mergeTranslations(data, paths, results): payload`. Later tasks call these pre-`mutateAsync`.

- [ ] **Step 1: Write the failing tests** — `collectTranslatables('projects', {title:'Hi', github_url:'https://x', tech_stack:['React']})` returns only `title`; `mergeTranslations` inserts at `i18n.id.title` without touching source. Fails (module missing).
- [ ] **Step 2: Run to verify they fail** — Run: `node --test lib/i18n/autoTranslate.test.mjs` (or `tsc`). Expected: FAIL.
- [ ] **Step 3: Implement helper + allowlist** — ✅ `about.content/profession, education[].degree/description, experience[].role/description, projects.title/description/short_description/content_blocks[text/caption], contacts.label`; 🚫 `full_name, nickname, skill/tech names, icon, *url*, contact value, year, enums`. Skip empty/URL-like strings (saves quota).
- [ ] **Step 4: Verify** — Run tests + `npx tsc --noEmit`. Expected: PASS. Review Focus test: URL/skill name passes through byte-identical.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): add autoTranslate helper with field allowlist"`

### Task 9: Wire admin saves (auto + "Translate ulang" + EN fallback)

**Files:**
- Modify: `app/admin/about.tsx:291-324`, `app/admin/projects/new.tsx:241-259`, `app/admin/projects/[id].tsx:241`, `app/admin/contacts.tsx:202-208`, `lib/queries/index.ts` (select `i18n`, `useLocalized*` selectors)
- Test: manual matrix + `tsc`

**Interfaces:**
- Consumes: Tasks 6–8 (`i18n` column, Edge Function, helper).
- Produces: every save persists source + `i18n`; failures persist source with `i18nPending` UI; per-form "Translate ulang" re-runs only missing/failed paths; public readers use `localized(row, lang)` with EN fallback.

- [ ] **Step 1: Write the failing checks** — (a) save with Edge Function down still commits source + shows pending badge; (b) saved row has `i18n.id.title` populated; (c) render with `lang='id'` + missing `id` key shows EN. All fail now.
- [ ] **Step 2: Run to verify they fail** — Run: `npx tsc --noEmit` (helpers unused) + manual save. Expected: FAIL.
- [ ] **Step 3: Wire four save handlers** — pre-`mutateAsync`: collect → `translateViaEdge(target=other lang)` → merge into `{...data, i18n}`; on `QUOTA/DOWN`: save source, toast warning, set pending flag; add "Translate ulang" button per form re-calling helper for pending paths only. Add `localized()` selectors in `lib/queries` and switch public screens to them.
- [ ] **Step 4: Verify** — Run: `npx tsc --noEmit`. Expected: PASS. Manual: EN input→save→toggle ID shows translation; edit→re-save grows `i18n`; kill function→save succeeds + pending + re-translate recovers.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): auto-translate admin saves with EN fallback"`

### Task 10: Admin/auth strings + SEO + final matrix

**Files:**
- Modify: `app/admin/*`, `app/(auth)/login.tsx`, `lib/seo-metadata.ts`, `lib/seo.ts`, `scripts/sync-seo.mjs`
- Test: full-matrix run

**Interfaces:**
- Consumes: all prior tasks. Produces: zero hardcoded user-facing strings outside `lib/local/`; SEO has per-lang titles (follow-up `hreflang` noted).

- [ ] **Step 1: Write the failing check** — `rg` for hardcoded UI copy in `app/admin` + `(auth)`; expect matches.
- [ ] **Step 2: Run to verify it fails** — Run: `rg -n "Saved!|Failed to save|Sign in" app/admin app/\(auth\)`. Expected: matches found.
- [ ] **Step 3: Migrate remaining strings + SEO titles** — admin tables/forms/toasts, login, SEO metadata per lang.
- [ ] **Step 4: Verify full matrix** — Run: `npx tsc --noEmit` + `node scripts/check-i18n-parity.mjs` + manual: toggle persists reload/new tab, quota path, 360px + desktop layout, dark mode. Expected: all PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): complete admin/auth/seo migration"`
