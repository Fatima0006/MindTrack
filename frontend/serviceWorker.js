const CACHE_NAME = 'mindtrack-cache-v4.6';
const urlsToCache = [
  './',
  './index.html',
  './dashboard.html',
  './admin-dashboard.html',
 // './users.html',
  './home.html',
  './about.html',
 // './profile.html',
  './style-about.css',
  './style-admin-dashboard.css',
  './style-dashboard.css',
  './style-home.css',
  './style-index.css',
  './style-profile.css',
  './manifest.json',
  './img/logo.png',
  './img/logo.jpg',
  './img/carrusel-1.jpg',
  './img/carrusel-2.jpg',
  './img/carrusel-3.jpg',
  './img/valores.png',
  './img/vision.png',
  './img/mision.png',
  './img/about-1.png',
  './img/about-2.png',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://code.jquery.com/jquery-3.4.1.min.js',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando y cacheando recursos...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Error al cachear recursos iniciales', err))
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activado correctamente');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando cache vieja:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then(networkResponse => {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(() => caches.match('./index.html'));
      })
  );
});
