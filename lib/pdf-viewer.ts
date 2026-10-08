// lib/pdf-viewer.ts
// Konfigurasi 1-baris untuk sumber PDF.js viewer sertifikat.
//
// - SEKARANG (remote, ringan): viewer dimuat dari mozilla.github.io via
//   <iframe>/<WebView> lazy — 0 byte masuk ke JS bundle, hanya diunduh
//   saat user membuka preview sertifikat.
// - NANTI (self-host): copy `pdfjs-dist/web` + `pdfjs-dist/build` ke
//   `public/pdfjs/` (via script sync), lalu ganti nilai di bawah menjadi:
//     export const PDF_VIEWER_BASE_URL = '/pdfjs/web';
//   Tanpa mengubah komponen apa pun.

export const PDF_VIEWER_BASE_URL = 'https://mozilla.github.io/pdf.js/web';

/** Timeout fallback preview (ms) sebelum menampilkan tombol Buka/Unduh. */
export const PDF_PREVIEW_TIMEOUT_MS = 15000;

/**
 * Bangun URL viewer PDF.js untuk sebuah file PDF.
 * `baseUrl` default dari config di atas — override hanya untuk testing.
 */
export function buildPdfJsViewerUrl(pdfUrl: string, baseUrl: string = PDF_VIEWER_BASE_URL): string {
  return `${baseUrl.replace(/\/+$/, '')}/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
}

/**
 * Resolve base URL viewer menjadi absolut (wajib untuk WebView native).
 * - Remote (http...) → dipakai apa adanya.
 * - Relatif (self-host `/pdfjs/web`) → digabung origin web aktif,
 *   atau EXPO_PUBLIC_SITE_URL saat di native (tanpa window.location).
 */
export function resolvePdfViewerBaseUrl(): string {
  if (PDF_VIEWER_BASE_URL.startsWith('http')) return PDF_VIEWER_BASE_URL.replace(/\/+$/, '');
  const origin =
    typeof window !== 'undefined'
      ? (window as unknown as { location?: { origin?: string } })?.location?.origin
      : undefined;
  const site = (origin ?? process.env.EXPO_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');
  return `${site}${PDF_VIEWER_BASE_URL}`;
}
