const CACHE_NAME = 'mindtrack-cache-v5.5';

const urlsToCache = [
  './',
  './home.html',
  './index.html',
  './about.html',
  './style-about.css',
  './style-index.css',
  './style-home.css',
  './style-admin-dashboard.css',
  './style-dashboard.css',
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
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://code.jquery.com/jquery-3.4.1.min.js',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

const PRIVATE_PAGES = [
  '/dashboard.html',
  '/admin-dashboard.html'
  //'/profile.html',
  //'/users.html', 
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando modo seguro...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activado (modo seguro)');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (PRIVATE_PAGES.includes(url.pathname)) {
    console.log('[SW] Página protegida, forzando red…', url.pathname);

    return event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(networkRes => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return networkRes;
        })
        .catch(() => caches.match('./index.html'))
      )
  );
});

