// Test funkcija za slanje notifikacija na sve registrovane uređaje
import { supabase } from '../db/supabaseClient.js';

export const testNotificationDelivery = async () => {
  console.log('🧪 === TEST DOSTAVE NOTIFIKACIJA ===');
  
  try {
    // 1. Prvo dohvatimo sve registrovane uređaje
    console.log('📱 Dohvaćam sve registrovane uređaje...');
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);
    
    if (subError) {
      console.error('❌ Greška pri dohvaćanju subscriptions:', subError);
      return { success: false, error: subError };
    }
    
    console.log(`📊 Pronađeno ${subscriptions?.length || 0} aktivnih uređaja:`);
    
    // 2. Prikaži detalje svih uređaja
    subscriptions?.forEach((sub, index) => {
      console.log(`📱 Uređaj ${index + 1}:`);
      console.log(`   - Driver ID: ${sub.driver_id}`);
      console.log(`   - Driver Tura: ${sub.driver_tura}`);
      console.log(`   - Browser: ${sub.browser}`);
      console.log(`   - Platform: ${sub.platform}`);
      console.log(`   - Endpoint: ${sub.endpoint.substring(0, 50)}...`);
      console.log(`   - Kreiran: ${new Date(sub.created_at).toLocaleString()}`);
      console.log('   ---');
    });
    
    // 3. Dohvati sve drivere za referentaciju
    console.log('👥 Dohvaćam informacije o driverima...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, ime, role, tura');
    
    if (driversError) {
      console.error('❌ Greška pri dohvaćanju drivera:', driversError);
    } else {
      console.log('👥 Svi driveri u sistemu:');
      drivers?.forEach(driver => {
        const hasSubscription = subscriptions?.some(sub => sub.driver_id === driver.id);
        console.log(`   ${driver.ime} (ID: ${driver.id}, Role: ${driver.role}, Tura: ${driver.tura}) - Notifikacije: ${hasSubscription ? '✅' : '❌'}`);
      });
    }
    
    // 4. Pošalji test notifikaciju
    console.log('📤 Šaljem test notifikaciju na sve uređaje...');
    
    const testMessage = {
      title: '🧪 TEST NOTIFIKACIJA',
      body: `Test dostave na ${subscriptions?.length || 0} uređaja - ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'test-delivery',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        url: '/'
      }
    };
    
    // Pozovi Edge Function
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
    console.log('📊 Rezultat slanja:', result);
    
    // 5. Provjeri logove
    console.log('📜 Provjera logova...');
    const { data: logs, error: logsError } = await supabase
      .from('push_notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!logsError && logs?.length > 0) {
      console.log('📜 Najnoviji logovi:');
      logs.forEach(log => {
        console.log(`   - ${new Date(log.created_at).toLocaleTimeString()}: ${log.title} (Success: ${log.success})`);
      });
    }
    
    // 6. Sažetak
    console.log('🎯 === SAŽETAK TESTA ===');
    console.log(`📱 Ukupno registrovanih uređaja: ${subscriptions?.length || 0}`);
    console.log(`👥 Ukupno drivera u sistemu: ${drivers?.length || 0}`);
    console.log(`📤 Poslano na uređaje: ${result?.sent || 0}`);
    console.log(`❌ Neuspješno: ${result?.failed || 0}`);
    console.log(`📊 Ukupno pokušaja: ${result?.total || 0}`);
    
    if (result?.sent > 0) {
      console.log('✅ Notifikacije su poslane! Provjerite uređaje.');
    } else {
      console.log('⚠️ Nijedna notifikacija nije uspješno poslana.');
    }
    
    return {
      success: true,
      registeredDevices: subscriptions?.length || 0,
      totalDrivers: drivers?.length || 0,
      sentNotifications: result?.sent || 0,
      failedNotifications: result?.failed || 0,
      result
    };
    
  } catch (error) {
    console.error('💥 Greška u testu:', error);
    return { success: false, error };
  }
};

export default testNotificationDelivery;