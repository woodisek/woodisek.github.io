const CACHE_NAME = 'woodisek-pwa-v20';

// Při instalaci - jen otevře cache, nic nestahuje
self.addEventListener('install', event => {
  console.log('SW nainstalován');
  self.skipWaiting();
});

// Při aktivaci - vyčistí staré cache a převezme kontrolu
self.addEventListener('activate', event => {
  console.log('SW aktivován');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Mažu starou cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ŽÁDNÝ FETCH EVENT - nic nezachytává, nic neblokuje
// Všechny requesty jdou přímo na síť bez zásahu SW
