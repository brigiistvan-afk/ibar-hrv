// IBAR Egyensúly – Service Worker
// Verzió: 2026-03-10-r2
const CACHE_VERSION = '2026-03-20-r1';
const CACHE_NAME = 'ibar-cache-' + CACHE_VERSION;

const ASSETS = [
  '/ibar-hrv/',
  '/ibar-hrv/index.html',
  '/ibar-hrv/manifest.json',
  '/ibar-hrv/icon-192.png',
  '/ibar-hrv/icon-512.png',
];

self.addEventListener('install', event => {
  console.log('[SW] Telepítés:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('[SW] Cache hiba (nem kritikus):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Aktiválás:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Régi cache törölve:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname !== self.location.hostname) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Háttérben mindig frissít
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    console.log('[SW] Emlékeztető:', event.data.hour);
  }
});
