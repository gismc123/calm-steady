const CACHE_NAME = 'calm-down-v1.0-__BUILD_DATE__';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './i18n.js',
  './manifest.json',
  './locales/en.json',
  './locales/es.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-apple.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cache-first for icons — they rarely change and saves bandwidth
  if (/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML, JS, CSS, JSON, and lesson files
  // Users always get fresh content when online; cache is the offline fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
