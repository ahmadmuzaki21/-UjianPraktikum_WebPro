const CACHE_NAME = 'task-manager-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Hanya intercept request GET ke file statis (bukan API / POST)
  if (event.request.method === 'GET' && !event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Notifikasi', body: 'Pesan baru!' };
  
  const options = {
    body: data.body,
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Check_icon.svg/512px-Check_icon.svg.png',
    badge: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Check_icon.svg/512px-Check_icon.svg.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
