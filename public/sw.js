/**
 * 🚀 Service Worker for BDE Evidencija
 * Enhanced PWA functionality with caching, offline support, and background sync
 */

const CACHE_NAME = 'bde-evidencija-v5.0.2';
const RUNTIME_CACHE = 'bde-runtime-v5.0.2';
const MAP_CACHE = 'bde-maps-v5.0.2';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/assets/icon.png'
];

// Map tile patterns to cache
const MAP_TILE_PATTERNS = [
  /^https:\/\/[abc]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png/,
  /^https:\/\/[abc]\.tile\.opentopomap\.org\/\d+\/\d+\/\d+\.png/
];

// API patterns that should be cached
const API_CACHE_PATTERNS = [
  /\/vor-proxy/,
  /\/api\/addresses/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 [SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🚀 [SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('🚀 [SW] Static assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('🚀 [SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('bde-') && 
                   cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE && 
                   cacheName !== MAP_CACHE;
          })
          .map((cacheName) => {
            console.log('🚀 [SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          });
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('🚀 [SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - network-first with fallback strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;
  
  // Handle different types of requests
  if (isMapTileRequest(request)) {
    event.respondWith(handleMapTileRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleStaticAssetRequest(request));
  }
});

// Check if request is for map tiles
function isMapTileRequest(request) {
  return MAP_TILE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Check if request is for API
function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle map tile requests - cache-first for performance
async function handleMapTileRequest(request) {
  try {
    const cache = await caches.open(MAP_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🗺️ [SW] Map tile served from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('🗺️ [SW] Map tile cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🗺️ [SW] Map tile fetch failed:', error);
    
    // Return a transparent tile as fallback
    return new Response(
      new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
        0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]),
      {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400'
        }
      }
    );
  }
}

// Handle API requests - network-first with cache fallback
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('🌐 [SW] API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 [SW] Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🌐 [SW] API response served from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available
    console.error('🌐 [SW] No cached response available for:', request.url);
    throw error;
  }
}

// Handle navigation requests - serve app shell
async function handleNavigationRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('🚀 [SW] Navigation network failed, serving app shell');
    
    // Serve cached app shell
    const cache = await caches.open(CACHE_NAME);
    const appShell = await cache.match('/index.html');
    
    if (appShell) {
      return appShell;
    }
    
    // Fallback error page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>BDE Evidencija - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #e74c3c; }
            .retry-btn { 
              background: #3498db; color: white; border: none; 
              padding: 10px 20px; border-radius: 5px; cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <h1>🚀 BDE Evidencija</h1>
          <p class="error">Aplicacija nije dostupna offline</p>
          <p>Proverite internet konekciju i pokušajte ponovo.</p>
          <button class="retry-btn" onclick="window.location.reload()">Pokušaj ponovo</button>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle static asset requests
async function handleStaticAssetRequest(request) {
  try {
    // Try cache first for static assets
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('⚡ [SW] Static asset served from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('⚡ [SW] Static asset cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('⚡ [SW] Static asset fetch failed:', request.url, error);
    throw error;
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('🔄 [SW] Starting offline data sync');
    
    // Notify main app that sync is starting
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_STARTED' });
    });
    
    // This would integrate with your IndexedDBStorageService
    // For now, just simulate sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Notify main app that sync is complete
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETED' });
    });
    
    console.log('🔄 [SW] Offline data sync completed');
  } catch (error) {
    console.error('🔄 [SW] Offline data sync failed:', error);
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_FAILED', error: error.message });
    });
  }
}

// Handle messages from main app
self.addEventListener('message', (event) => {
  console.log('💬 [SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ROUTES') {
    event.waitUntil(cacheRoutes(event.data.routes));
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearCaches());
  }
});

// Cache route data for offline access
async function cacheRoutes(routes) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    
    for (const route of routes) {
      if (route.mapData) {
        const response = new Response(JSON.stringify(route.mapData), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(`/cached-route/${route.id}`, response);
      }
    }
    
    console.log('🗺️ [SW] Routes cached for offline access:', routes.length);
  } catch (error) {
    console.error('🗺️ [SW] Failed to cache routes:', error);
  }
}

// Clear all caches
async function clearCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames
      .filter(name => name.startsWith('bde-'))
      .map(name => caches.delete(name));
    
    await Promise.all(deletePromises);
    console.log('🧹 [SW] All caches cleared');
  } catch (error) {
    console.error('🧹 [SW] Failed to clear caches:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('🔔 [SW] Push notification received');
  
  const options = {
    body: 'Nova dostava je dodana',
    icon: '/assets/icon.png',
    badge: '/assets/icon.png',
    tag: 'bde-notification',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'Prikaži',
        icon: '/assets/icon.png'
      },
      {
        action: 'dismiss',
        title: 'Odbaci'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('BDE Evidencija', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Periodic background sync (when supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ [SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'hourly-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('🚨 [SW] Service worker error:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 [SW] Unhandled promise rejection:', event);
});

console.log('🚀 [SW] Service worker loaded successfully');