# Certificate PDF Preview on Mobile Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make certificate PDFs visible/actionable on Chrome mobile the way they already are on Chrome desktop.

**Architecture:** Keep desktop web path byte-identical (`iframe` direct-PDF); branch only `Platform.OS === 'web' && !isWeb` (mobile browser) to a no-inline-PDF card + Google-Docs-`gview` modal with an explicit "Buka PDF" fallback, reusing the existing native viewer URL pattern.

**Tech Stack:** Expo Router + React Native Web + NativeWind, `react-native-webview` (native only), Google Docs `gview` (mobile-web only, no new dep).

**Spec:** `app/(tabs)/about.tsx:196-310` (gallery + modal); user report: Chrome desktop OK, Chrome mobile shows blank with only an "Open → Supabase URL" button.

## Global Constraints

- Desktop web (`width >= 768`) rendering must stay byte-identical (direct `iframe` + `#page=1&toolbar=0…`).
- Native (iOS/Android) path unchanged (`NativeCertPdfViewer` via `gview` + `WebView`).
- No new dependencies; `gview` URL must use `encodeURIComponent(url)` exactly like native.
- Supabase `file_url` is public (`getPublicUrl` in `lib/queries/index.ts:331`); do not switch to signed URLs.
- `npx tsc --noEmit` must pass; `npx expo lint` is known-broken pre-existing (ESLint 9 vs legacy config) — note only.

## Review Focus

- Chrome Android with Data Saver / no PDF plugin — expect thumbnail + working "Buka PDF" even if `gview` blocked.
- Very long/uppercase `.PDF?token=…` URL — expect still detected as PDF (strip query before `endsWith`).
- Offline on mobile — expect clear retry message, not infinite spinner.
- 320px phone modal — expect no horizontal overflow from the `-12px` hack (hack must not ship to mobile).
- Desktop regression — expect pixel-identical gallery + modal on `width >= 768`.

---

### Task 1: Mobile-web gallery card — no inline PDF iframe

**Files:**
- Modify: `app/(tabs)/about.tsx:237-249`
- Test: manual visual (no unit harness in repo)

**Interfaces:**
- Consumes: existing `isWeb = width >= 768`, `Platform.OS`, `cert.file_url`.
- Produces: `isMobileWeb = Platform.OS === 'web' && !isWeb` branch contract used by Task 2.

- [ ] **Step 1: Write the failing visual test**

```text
1. `npx expo start --web`, Chrome DevTools device toolbar 360px.
2. About → Certificates gallery PDF card shows blank / tiny Open button (FAIL).
3. Desktop ≥1024px shows PDF page preview (must keep).
```

- [ ] **Step 2: Run test to verify it fails**

Run: open gallery on mobile width, confirm blank. Expected: FAIL (blank, only Open button).

- [ ] **Step 3: Implement `isMobileWeb` gallery branch in `app/(tabs)/about.tsx:237`**

Replace `Platform.OS === 'web' ? (<View><div><iframe…/>) : (native placeholder)` with three-way: desktop-web → existing `iframe` block unchanged; mobile-web (`Platform.OS==='web' && !isWeb`) → static placeholder `View` (`file-pdf-box` icon + `Text` "PDF • Tap untuk preview", same as native); native → unchanged. Extract helper `isPdfUrl(url: string): boolean` (lowercase, strip `?…`/`#…` before `endsWith('.pdf')`) and use it in place of inline `toLowerCase().endsWith('.pdf')`.

- [ ] **Step 4: Run test to verify it passes**

Run: reload 360px → icon + "Tap untuk preview", tap opens modal; reload desktop → direct PDF preview unchanged. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/about.tsx
git commit -m "fix(about): static pdf thumbnail on mobile web gallery"
```

### Task 2: Mobile-web modal — gview iframe + explicit Buka PDF fallback

**Files:**
- Modify: `app/(tabs)/about.tsx:286-299` (modal), add `MobileWebCertPdfViewer` next to `NativeCertPdfViewer:310`
- Test: manual modal check

**Interfaces:**
- Consumes: `isMobileWeb` from Task 1, `selectedCert.file_url`.
- Produces: `MobileWebCertPdfViewer({ url }: { url: string })` — `gview` iframe + fallback anchor.

- [ ] **Step 1: Write the failing modal test**

```text
1. On 360px Chrome, tap PDF card → modal blank / only Open button, no readable page (FAIL).
```

- [ ] **Step 2: Run test to verify it fails**

Run: tap card on mobile width. Expected: FAIL (blank modal).

- [ ] **Step 3: Implement `MobileWebCertPdfViewer(url: string)` in `app/(tabs)/about.tsx`**

Branch modal PDF: desktop-web → existing `iframe` unchanged (keep `-12px` hack); mobile-web → new component: `viewerUrl = https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}` in `iframe` with explicit `width:100%; height:min(62vh,100%); minHeight:320; border:none`, plus loading `Text` "Memuat preview…" and always-visible fallback row: anchor/button "Buka PDF" (`window.open(url,'_blank')` on web) + note "Jika preview kosong, pakai tombol ini". No `-12px` offsets on this branch.

- [ ] **Step 4: Run test to verify it passes**

Run: 360px tap → readable page via `gview` OR (if Google blocked) working "Buka PDF" opens Supabase file in new tab; desktop modal unchanged. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/about.tsx
git commit -m "fix(about): gview pdf viewer with fallback on mobile web"
```

### Task 3: Verification matrix (desktop / mobile-web / native)

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Desktop Chrome ≥1024px** — Run: gallery + modal PDF inline. Expected: PASS unchanged.
- [ ] **Step 2: Mobile Chrome 360px** — Run: gallery thumbnail → modal readable or Buka PDF works. Expected: PASS.
- [ ] **Step 3: Expo Go native** — Run: gallery placeholder → `NativeCertPdfViewer` unchanged. Expected: PASS.
- [ ] **Step 4: Run `npx tsc --noEmit`** — Expected: PASS clean.
- [ ] **Step 5: Commit (empty if clean, else fix)**

```bash
git status --short
```
