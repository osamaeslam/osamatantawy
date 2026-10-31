// Service Worker for Tantawy Group PWA (Network-First to always serve latest code)
const CACHE_NAME = 'tantawy-group-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Always fetch latest from network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
