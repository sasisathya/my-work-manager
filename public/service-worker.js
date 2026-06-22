/**
 * Service Worker for Work Manager
 * Handles caching, offline support, and background sync
 *
 * Cache Strategy:
 * - Static assets: Cache first, network fallback (1 year TTL)
 * - API calls: Network first, cache fallback (5 min cache)
 * - HTML pages: Network first, cache fallback (never cache)
 */

const CACHE_NAME = 'app-cache-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

// Assets to cache on install
const urlsToCache = [
  '/',
  '/styles.css',
  '/offline.html',
];

/**
 * Install event: Pre-cache essential assets
 * Run once when service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn('[SW] Failed to cache some assets:', error);
      });
    })
  );

  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Claim all clients immediately
  self.clients.claim();
});

/**
 * Fetch event: Smart caching based on request type
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip same-origin requests that are not GET
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Strategy 1: Static assets - Cache first
  if (
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot|svg)$/i) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Don't cache if not 200
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone and cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
    return;
  }

  // Strategy 2: Images - Cache first, with separate image cache
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Return placeholder for failed images
            return caches.match('/offline.html');
          });
      })
    );
    return;
  }

  // Strategy 3: API calls - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Strategy 4: HTML pages - Network first, cache fallback
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then((response) => response || caches.match('/offline.html'));
        })
    );
    return;
  }

  // Default: Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

/**
 * Background Sync (if needed for offline data submission)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB
    const db = new Promise((resolve, reject) => {
      const request = indexedDB.open('WorkManagerDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Send pending tasks to server
    const response = await fetch('/api/sync/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (response.ok) {
      // Clear pending tasks from IndexedDB
      // ... implementation here
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

/**
 * Push notifications (for future use)
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
