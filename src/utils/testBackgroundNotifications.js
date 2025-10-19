// Test background push notifikacija - kad je browser zatvoren
import { supabase } from '../db/supabaseClient.js';

export const testBackgroundNotifications = async () => {
  console.log('🌙 === TEST BACKGROUND NOTIFIKACIJA ===');
  
  try {
    // 1. Registriraj trenutni uređaj ako nije
    console.log('📱 Osiguravamo registraciju...');
    
    // 2. Pošalji test notifikaciju nakon 10 sekundi
    console.log('⏰ Šaljem test notifikaciju za 10 sekundi...');
    console.log('💡 ZATVORITE BROWSER SADA - imate 10 sekundi!');
    
    // Alert korisniku
    alert(`🌙 BACKGROUND TEST!

⏰ Za 10 sekundi ću poslati notifikaciju
💡 ZATVORITE BROWSER SADA!
📱 Trebate vidjeti notifikaciju na desktop-u

Timer počinje... ZATVORITE BROWSER!`);
    
    // Čekaj 10 sekundi
    setTimeout(async () => {
      try {
        console.log('📤 Šaljem background test notifikaciju...');
        
        const testMessage = {
          title: '🌙 BACKGROUND TEST',
          body: `Test notifikacija dok je browser zatvoren - ${new Date().toLocaleTimeString()}`,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: `background-test-${Date.now()}`,
          requireInteraction: true,
          renotify: true,
          vibrate: [500, 200, 500, 200, 500],
          actions: [
            {
              action: 'open',
              title: 'Otvori App'
            }
          ],
          data: {
            type: 'background_test',
            url: '/',
            timestamp: Date.now()
          }
        };
        
        // Pošalji preko Edge Function
        const response = await fetch(import.meta.env.VITE_PUSH_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            type: 'custom_message',
            message: testMessage
          })
        });
        
        const result = await response.json();
        console.log('📊 Background test rezultat:', result);
        
        // Log u bazu za later analysis
        await supabase.from('push_notification_logs').insert({
          title: 'Background Test',
          body: testMessage.body,
          success: result?.sent > 0,
          device_count: result?.total || 0,
          sent_count: result?.sent || 0,
          created_at: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Greška u background test-u:', error);
      }
    }, 10000); // 10 sekundi delay
    
    return {
      success: true,
      message: 'Background test zakazan za 10 sekundi - zatvorite browser!'
    };
    
  } catch (error) {
    console.error('💥 Greška u background test setup:', error);
    return { success: false, error };
  }
};

// Funkcija za trenutnu notifikaciju s malim delay-em
export const testDelayedNotification = async (delaySeconds = 5) => {
  console.log(`⏰ Šaljem notifikaciju za ${delaySeconds} sekundi...`);
  
  alert(`⏰ DELAYED TEST!

Za ${delaySeconds} sekundi ću poslati notifikaciju.
Možete minimizirati browser ili prebaciti na drugi tab.
📱 Trebate vidjeti notifikaciju!`);
  
  setTimeout(async () => {
    try {
      const testMessage = {
        title: '⏰ DELAYED TEST',
        body: `Test s ${delaySeconds}s delay - ${new Date().toLocaleTimeString()}`,
        icon: '/icon-192x192.png',
        tag: `delayed-test-${Date.now()}`,
        requireInteraction: true,
        renotify: true
      };
      
      const response = await fetch(import.meta.env.VITE_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'custom_message',
          message: testMessage
        })
      });
      
      const result = await response.json();
      console.log(`📊 Delayed test (${delaySeconds}s) rezultat:`, result);
      
    } catch (error) {
      console.error('❌ Greška u delayed test:', error);
    }
  }, delaySeconds * 1000);
  
  return { success: true, delaySeconds };
};

export default { testBackgroundNotifications, testDelayedNotification };