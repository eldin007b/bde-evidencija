// 🧪 Direct Push Test Utility
// Testira push notifikacije direktno preko Service Worker-a

/**
 * Test push notification direktno preko Service Worker-a
 */
export async function testDirectPushNotification() {
  console.log('🧪 === DIRECT PUSH TEST ===');
  
  try {
    // 1. Get service worker registration
    const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
    
    if (!registration) {
      console.error('❌ Service Worker not registered');
      return false;
    }
    
    console.log('✅ Service Worker found:', registration);
    
    // 2. Check if push subscription exists
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.error('❌ No push subscription found');
      return false;
    }
    
    console.log('✅ Push subscription found:', subscription);
    
    // 3. Send test notification via service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: '🧪 Direktni test',
          body: 'Test notifikacija direktno iz browser-a!',
          icon: '/bde-evidencija/icon-192x192.png',
          badge: '/bde-evidencija/badge-96x96.png',
          data: {
            type: 'test',
            url: '/',
            test: true
          },
          requireInteraction: false,
          actions: [
            {
              action: 'open',
              title: 'Otvori app'
            }
          ]
        }
      });
      
      console.log('✅ Test notification sent via Service Worker');
      return true;
    } else {
      console.error('❌ Service Worker not active');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Direct push test failed:', error);
    return false;
  }
}

/**
 * Test browser notification API directly
 */
export async function testBrowserNotificationAPI() {
  console.log('🧪 === BROWSER NOTIFICATION API TEST ===');
  
  try {
    // Check permission
    if (Notification.permission !== 'granted') {
      console.error('❌ Notification permission not granted');
      return false;
    }
    
    // Create simple browser notification
    const notification = new Notification('🧪 Browser API Test', {
      body: 'Test notifikacije preko Browser Notification API',
      icon: '/bde-evidencija/icon-192x192.png',
      badge: '/bde-evidencija/badge-96x96.png',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        type: 'browser_api_test',
        url: '/'
      }
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    console.log('✅ Browser notification created:', notification);
    return true;
    
  } catch (error) {
    console.error('❌ Browser notification test failed:', error);
    return false;
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testDirectPush = testDirectPushNotification;
  window.testBrowserAPI = testBrowserNotificationAPI;
}