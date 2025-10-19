// Brza funkcija za dodavanje test drivera da testiramo notifikacije
import { supabase } from '../db/supabaseClient.js';

export const addTestDriver = async () => {
  console.log('👤 Dodajem test drivera...');
  
  try {
    const testDriver = {
      ime: `Test Driver ${Date.now()}`,
      tura: 'prva',
      status: 'aktivan',
      role: 'driver',
      password: 'test123',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('drivers')
      .insert([testDriver])
      .select();
    
    if (error) {
      console.error('❌ Greška pri dodavanju test drivera:', error);
      return { success: false, error };
    }
    
    console.log('✅ Test driver dodan:', data[0]);
    
    // Simuliraj notifikaciju za novi driver
    console.log('📤 Šaljem notifikaciju za novog drivera...');
    
    const response = await fetch(import.meta.env.VITE_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'new_driver',
        driver_name: testDriver.ime,
        driver_tura: testDriver.tura
      })
    });
    
    const result = await response.json();
    console.log('📊 Rezultat notifikacije za novog drivera:', result);
    
    return {
      success: true,
      driver: data[0],
      notificationResult: result
    };
    
  } catch (error) {
    console.error('💥 Greška:', error);
    return { success: false, error };
  }
};

export const addTestDelivery = async () => {
  console.log('📦 Dodajem test dostavu...');
  
  try {
    // Prvo dohvati random drivera
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, ime')
      .limit(1);
    
    if (driversError || !drivers?.length) {
      console.error('❌ Nema drivera za test dostavu');
      return { success: false, error: 'Nema drivera' };
    }
    
    const randomDriver = drivers[0];
    
    const testDelivery = {
      driver_id: randomDriver.id,
      adresa: `Test Adresa ${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('deliveries')
      .insert([testDelivery])
      .select();
    
    if (error) {
      console.error('❌ Greška pri dodavanju test dostave:', error);
      return { success: false, error };
    }
    
    console.log('✅ Test dostava dodana:', data[0]);
    
    // Simuliraj notifikaciju za novu dostavu
    console.log('📤 Šaljem notifikaciju za novu dostavu...');
    
    const response = await fetch(import.meta.env.VITE_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'new_delivery',
        driver_name: randomDriver.ime,
        delivery_address: testDelivery.adresa
      })
    });
    
    const result = await response.json();
    console.log('📊 Rezultat notifikacije za novu dostavu:', result);
    
    return {
      success: true,
      delivery: data[0],
      driver: randomDriver,
      notificationResult: result
    };
    
  } catch (error) {
    console.error('💥 Greška:', error);
    return { success: false, error };
  }
};

export default { addTestDriver, addTestDelivery };