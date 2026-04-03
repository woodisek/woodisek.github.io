/**
 * WOODISEK E-SHOP
 * Copyright (c) 2025 Michal Plíšek (Woodisek)
 * License: Proprietary - All rights reserved
 * Unauthorized copying, modification, or distribution is prohibited.
 * Contact: hello.plisek@gmail.com
 */

// sw.js - Service Worker pro Woodisek (cachuje JEN obrázky)

const IMAGE_CACHE_NAME = 'woodisek-images-v1';

self.addEventListener('install', event => {
  console.log('Service Worker instalován (cachuji pouze obrázky)');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker aktivován');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Smazat staré cache, ale zachovat IMAGE_CACHE_NAME
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== IMAGE_CACHE_NAME) {
            console.log('Odstraňuji starou cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // ============================================================
  // CACHOVÁNÍ POUZE PRO OBRÁZKY
  // ============================================================
  if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || 
      url.includes('i.postimg.cc') || 
      url.includes('i.ibb.co')) {
    
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Pokud je obrázek v cache, vrátíme ho
        if (cachedResponse) {
          console.log('Obrázek z cache:', url.split('/').pop());
          return cachedResponse;
        }
        
        // Jinak stáhneme z network a uložíme do cache
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
              console.log('Obrázek uložen do cache:', url.split('/').pop());
            });
          }
          return response;
        });
      })
    );
    
  // ============================================================
  // VŠECHNY OSTATNÍ POŽADAVKY (HTML, JS, CSV) – ŽÁDNÁ CACHE
  // ============================================================
  } else {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    );
  }
});
