/**
 * 🔔 Service Worker for Push Notifications
 * Handles incoming push messages and notification clicks
 */

// Workbox precaching
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = 'bd-evidencija-v1';
const APP_NAME = 'BD Evidencija';

// Install event
self.addEventListener('install', (event) => {
  console.log('📱 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('📱 Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - incoming push notification
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event);
  
  if (!event.data) {
    console.log('No push data received');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📱 Push data:', data);

    const options = {
      body: data.body || 'Nova obavest!',
      icon: data.icon || './assets/icon.png',
      badge: data.badge || './assets/favicon.png',
      image: data.image,
      data: {
        url: data.data?.url || '/',
        type: data.data?.type || 'general',
        timestamp: Date.now(),
        ...data.data
      },
      actions: getActionsForType(data.data?.type),
      tag: data.tag || data.data?.type || 'general',
      renotify: data.renotify || false,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      dir: 'ltr',
      lang: 'sr'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || APP_NAME, options)
    );

  } catch (error) {
    console.error('❌ Error processing push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('BD Evidencija', {
        body: 'Nova obavest je stigla!',
        icon: '/icon-192x192.png',
        data: { url: '/' }
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close notification
  notification.close();

  // Handle different actions
  if (action === 'dismiss') {
    console.log('📱 Notification dismissed');
    return;
  }

  // Determine URL to open
  let urlToOpen = '/';
  
  if (action === 'view' || !action) {
    urlToOpen = data.url || getUrlForType(data.type);
  } else if (action === 'quick_reply') {
    urlToOpen = getQuickReplyUrl(data);
  }

  console.log('🔗 Opening URL:', urlToOpen);

  // Log click event
  logNotificationClick(data);

  // Open/focus app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              } else {
                return client.postMessage({
                  type: 'NAVIGATE',
                  url: urlToOpen,
                  notificationData: data
                });
              }
            });
          }
        }
        
        // Open new window
        return clients.openWindow(self.location.origin + urlToOpen);
      })
      .catch((error) => {
        console.error('❌ Error opening window:', error);
        return clients.openWindow(self.location.origin);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('📱 Notification closed:', event.notification.data);
  
  // Log dismiss event
  const data = event.notification.data || {};
  logNotificationDismiss(data);
});

// Helper functions
function getActionsForType(type) {
  const baseActions = [
    {
      action: 'view',
      title: '👀 Pogledaj',
      icon: '/icons/view.png'
    },
    {
      action: 'dismiss',
      title: '❌ Zatvori',
      icon: '/icons/close.png'
    }
  ];

  switch (type) {
    case 'statistics':
      return [
        {
          action: 'view',
          title: '📊 Pogledaj statistike',
          icon: '/icons/stats.png'
        },
        ...baseActions.slice(1)
      ];
      
    case 'achievement':
      return [
        {
          action: 'view',
          title: '🏆 Pogledaj postignuće',
          icon: '/icons/trophy.png'
        },
        ...baseActions.slice(1)
      ];
      
    case 'payroll':
      return [
        {
          action: 'view',
          title: '💰 Otvori platnu listu',
          icon: '/icons/money.png'
        },
        ...baseActions.slice(1)
      ];
      
    case 'extra_ride':
      return [
        {
          action: 'view',
          title: '🚗 Pregledaj vožnju',
          icon: '/icons/car.png'
        },
        {
          action: 'quick_reply',
          title: '✅ Brzo odobri',
          icon: '/icons/approve.png'
        },
        ...baseActions.slice(1)
      ];
      
    default:
      return baseActions;
  }
}

function getUrlForType(type) {
  switch (type) {
    case 'statistics': 
      return '/statistics';
    case 'achievement':
      return '/achievements';
    case 'payroll':
      return '/payroll';
    case 'extra_ride':
      return '/admin/rides';
    case 'system':
      return '/admin';
    default:
      return '/';
  }
}

function getQuickReplyUrl(data) {
  if (data.type === 'extra_ride' && data.rideId) {
    return `/admin/rides?approve=${data.rideId}`;
  }
  return getUrlForType(data.type);
}

// Logging functions
function logNotificationClick(data) {
  try {
    // Send to analytics or logging service
    fetch('/api/analytics/notification-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: data.type,
        timestamp: Date.now(),
        url: data.url,
        notificationId: data.notificationId
      })
    }).catch(error => {
      console.log('📊 Analytics logging failed:', error);
    });
  } catch (error) {
    console.log('📊 Click logging error:', error);
  }
}

function logNotificationDismiss(data) {
  try {
    fetch('/api/analytics/notification-dismiss', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: data.type,
        timestamp: Date.now(),
        notificationId: data.notificationId
      })
    }).catch(error => {
      console.log('📊 Dismiss logging failed:', error);
    });
  } catch (error) {
    console.log('📊 Dismiss logging error:', error);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'notification-actions') {
    event.waitUntil(processOfflineActions());
  }
});

async function processOfflineActions() {
  try {
    // Process any queued notification actions
    const cache = await caches.open(CACHE_NAME);
    const offlineActions = await cache.match('/offline-actions');
    
    if (offlineActions) {
      const actions = await offlineActions.json();
      
      for (const action of actions) {
        await processAction(action);
      }
      
      // Clear processed actions
      await cache.delete('/offline-actions');
    }
  } catch (error) {
    console.error('❌ Error processing offline actions:', error);
  }
}

async function processAction(action) {
  try {
    const response = await fetch(action.url, {
      method: action.method || 'POST',
      headers: action.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.data)
    });
    
    console.log('✅ Offline action processed:', action.type);
  } catch (error) {
    console.error('❌ Failed to process offline action:', error);
  }
}

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('💬 Message from app:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});