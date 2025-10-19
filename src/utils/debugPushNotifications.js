// 🐛 Debug utilities za push notifications

/**
 * Proverava sve uslove za push notifications i prikazuje detaljne informacije
 */
export function debugPushNotifications() {
  console.log('🔍 === PUSH NOTIFICATIONS DEBUG ===');
  
  // 1. Browser support
  console.log('1. Browser Support:');
  console.log('  serviceWorker:', 'serviceWorker' in navigator);
  console.log('  PushManager:', 'PushManager' in window);
  console.log('  Notification:', 'Notification' in window);
  
  // 2. Permissions
  console.log('2. Permissions:');
  if ('Notification' in window) {
    console.log('  Notification.permission:', Notification.permission);
  }
  
  // 3. Service Worker status
  console.log('3. Service Worker:');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js')
      .then(registration => {
        if (registration) {
          console.log('  ✅ Service Worker registered:', registration);
          console.log('  SW scope:', registration.scope);
          console.log('  SW active:', !!registration.active);
          
          // 4. Push subscription
          if (registration.pushManager) {
            registration.pushManager.getSubscription().then(subscription => {
              console.log('4. Push Subscription:');
              if (subscription) {
                console.log('  ✅ Push subscription exists:', subscription);
                console.log('  Endpoint:', subscription.endpoint);
                console.log('  Keys:', subscription.keys);
              } else {
                console.log('  ❌ No push subscription found');
              }
            });
          }
        } else {
          console.log('  ❌ Service Worker not registered');
        }
      })
      .catch(error => {
        console.log('  ❌ Service Worker error:', error);
      });
  }
  
  // 5. Environment variables
  console.log('5. Environment Variables:');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[MISSING]');
  console.log('  VITE_VAPID_PUBLIC_KEY:', import.meta.env.VITE_VAPID_PUBLIC_KEY ? '[SET]' : '[MISSING]');
  console.log('  VITE_PUSH_API_URL:', import.meta.env.VITE_PUSH_API_URL);
  
  console.log('🔍 === END DEBUG ===');
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  console.log('🔍 === SUPABASE CONNECTION TEST ===');
  
  try {
    const { supabase } = await import('../db/supabaseClient.js');
    
    // Test basic connection
    const { data, error } = await supabase.from('push_subscriptions').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    } else {
      console.log('✅ Supabase connected successfully');
      console.log('  Push subscriptions count:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase import/connection error:', error);
    return false;
  }
}

/**
 * Test Edge Function
 */
export async function testEdgeFunction() {
  console.log('🔍 === EDGE FUNCTION TEST ===');
  
  const pushApiUrl = import.meta.env.VITE_PUSH_API_URL;
  
  if (!pushApiUrl) {
    console.error('❌ VITE_PUSH_API_URL not set');
    return false;
  }
  
  try {
    const response = await fetch(pushApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '🧪 Debug Test',
        message: 'Testing Edge Function connectivity',
        targetType: 'all'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Edge Function responded:', result);
      return true;
    } else {
      console.error('❌ Edge Function error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Edge Function request failed:', error);
    return false;
  }
}

/**
 * Complete diagnostic
 */
export async function runCompleteDiagnostic() {
  console.log('🚀 === COMPLETE PUSH NOTIFICATIONS DIAGNOSTIC ===');
  
  debugPushNotifications();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const supabaseOk = await testSupabaseConnection();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const edgeFunctionOk = await testEdgeFunction();
  
  console.log('📊 === DIAGNOSTIC SUMMARY ===');
  console.log('  Supabase connection:', supabaseOk ? '✅' : '❌');
  console.log('  Edge Function:', edgeFunctionOk ? '✅' : '❌');
  
  return { supabaseOk, edgeFunctionOk };
}