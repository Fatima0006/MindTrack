const CACHE_NAME = 'mindtrack-cache-v1.1.20';
const urlsToCache = [
  './','./index.html',
  './dashboard.html',
  './admin-dashboard.html',
  './home.html',
  './about.html',
  './resources.html',
  './profile.html',
  './style2.css',
  './img/logo.jpg',
  './img/carrusel-1.jpg',
  './img/carrusel-2.jpg',
  './img/carrusel-3.jpg',
  './img/valores.png',
  './img/vision.png',
  './img/mision.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
          console.log(`[SW] Cacheado: ${url}`);
        } catch (err) {
          console.warn(`[SW] No se pudo cachear: ${url}`, err);
        }
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cachedResp => {
      if(cachedResp) return cachedResp;
      return fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    })
  );
});
