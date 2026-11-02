// Service Worker for Tantawy Group PWA (Network-First, same-origin only)
const CACHE_NAME = 'tantawy-group-v4';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const offlineResponse = () =>
  new Response(
    '<!doctype html><html lang="ar"><body style="font-family:sans-serif;text-align:center;padding:40px">تعذر الاتصال بالإنترنت. من فضلك حدّث الصفحة.</body></html>',
    { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // لا نتدخل في أي طلب خارجي (صور unsplash/drive، أو Supabase API)
  if (url.origin !== self.location.origin) return;

  // نفس الأصل: نجرب الشبكة أولاً، ولو فشلت نرجع من الكاش أو رد آمن
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(req).then((cached) => cached || offlineResponse())
    )
  );
});
