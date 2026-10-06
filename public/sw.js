/* Minimal service worker: network-first passthrough.
   Cukup untuk syarat installability PWA (SW terdaftar + fetch handler).
   NB: jangan cache agresif — update web tetap diambil dari network. */
const SW_VERSION = 'v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
