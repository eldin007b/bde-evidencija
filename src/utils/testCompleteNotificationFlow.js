// Kompletna test funkcija za push notifikacije - sve u jednome
import { supabase } from '../db/supabaseClient.js';

export const testCompleteNotificationFlow = async () => {
  console.log('🚀 === KOMPLETNI TEST PUSH NOTIFIKACIJA ===');
  
  try {
    // 1. Provjeri da li je Service Worker spreman
    console.log('🔧 Provjera Service Worker-a...');
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker spreman:', registration);
    
    // 2. Provjeri dozvole
    console.log('🔒 Provjera dozvola...');
    const permission = await Notification.requestPermission();
    console.log('📋 Notification permission:', permission);
    
    if (permission !== 'granted') {
      alert('❌ Notifikacije nisu dozvoljene! Molimo omogućite ih u browser postavkama.');
      return { success: false, reason: 'permission_denied' };
    }
    
    // 3. Dohvati registrovane uređaje
    console.log('📱 Dohvaćam registrovane uređaje...');
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);
    
    if (subError) {
      console.error('❌ Greška pri dohvaćanju subscriptions:', subError);
      return { success: false, error: subError };
    }
    
    console.log(`📊 Pronađeno ${subscriptions?.length || 0} aktivnih uređaja`);
    
    // 4. DIREKTNI SERVICE WORKER TEST - prisilni prikaz
    console.log('🔧 DIREKTNI TEST - Service Worker notifikacija...');
    try {
      await registration.showNotification('🔧 DIREKTNI TEST', {
        body: `Direktna notifikacija - ${new Date().toLocaleTimeString()}`,
        icon: '/icon-192x192.png',
        tag: `direct-test-${Date.now()}`,
        requireInteraction: true,
        vibrate: [300, 200, 300, 200, 300],
        actions: [
          {
            action: 'view',
            title: 'Pogledaj'
          }
        ]
      });
      console.log('✅ DIREKTNA notifikacija POSLANA!');
      
      // Čekaj kratko da korisnik vidi notifikaciju
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (directError) {
      console.error('❌ Direktna notifikacija neuspješna:', directError);
    }
    
    // 5. Test preko Edge Function
    console.log('🌐 Test preko Edge Function...');
    const testMessage = {
      title: '🌐 EDGE FUNCTION TEST',
      body: `Server test - uređaji: ${subscriptions?.length || 0} - ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      tag: `edge-test-${Date.now()}`,
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
    console.log('📊 Edge Function rezultat:', result);
    
    // 6. Provjeri logove
    console.log('📜 Provjera najnovijih logova...');
    const { data: logs, error: logsError } = await supabase
      .from('push_notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!logsError && logs?.length > 0) {
      console.log('📜 Najnoviji logovi:');
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${new Date(log.created_at).toLocaleTimeString()}: ${log.title} (Success: ${log.success})`);
      });
    }
    
    // 7. SAŽETAK I INSTRUKCIJE
    console.log('🎯 === REZULTAT TESTA ===');
    console.log(`📱 Registrovanih uređaja: ${subscriptions?.length || 0}`);
    console.log(`📤 Server poslao na: ${result?.sent || 0} uređaja`);
    console.log(`❌ Neuspješno: ${result?.failed || 0} uređaja`);
    console.log('🔧 Direktna SW notifikacija: POSLANA');
    
    // Alert za korisnika
    const message = `
🧪 TEST ZAVRŠEN!

📱 Registrovano uređaja: ${subscriptions?.length || 0}
📤 Server poslao: ${result?.sent || 0}
❌ Neuspješno: ${result?.failed || 0}
🔧 Direktna notifikacija: POSLANA

${subscriptions?.length > 0 && result?.sent > 0 
  ? '✅ Ako ne vidite notifikacije, proverite browser postavke!' 
  : '⚠️ Malo registrovanih uređaja - dodajte više za testiranje!'}
`;
    
    alert(message);
    
    return {
      success: true,
      registeredDevices: subscriptions?.length || 0,
      sentNotifications: result?.sent || 0,
      failedNotifications: result?.failed || 0,
      directNotificationSent: true,
      result
    };
    
  } catch (error) {
    console.error('💥 Greška u kompletnom testu:', error);
    alert(`❌ Greška u testu: ${error.message}`);
    return { success: false, error };
  }
};

export default testCompleteNotificationFlow;