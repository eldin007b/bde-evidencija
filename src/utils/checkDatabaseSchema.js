// Utilitiy za provjeru schema baze podataka
import { supabase } from '../db/supabaseClient.js';

export const checkDatabaseSchema = async () => {
  console.log('🔍 === PROVJERA SCHEMA BAZE ===');
  
  try {
    // Provjeri drivers schema
    console.log('👥 Provjera drivers tabele...');
    const { data: driversTest, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);
    
    if (driversError) {
      console.error('❌ Greška drivers:', driversError);
    } else {
      console.log('✅ Drivers tabela OK');
      if (driversTest?.[0]) {
        console.log('📊 Drivers kolone:', Object.keys(driversTest[0]));
        console.log('📋 Primjer driver:', driversTest[0]);
      }
    }
    
    // Provjeri deliveries schema
    console.log('📦 Provjera deliveries tabele...');
    const { data: deliveriesTest, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('*')
      .limit(1);
    
    if (deliveriesError) {
      console.error('❌ Greška deliveries:', deliveriesError);
    } else {
      console.log('✅ Deliveries tabela OK');
      if (deliveriesTest?.[0]) {
        console.log('📊 Deliveries kolone:', Object.keys(deliveriesTest[0]));
        console.log('📋 Primjer delivery:', deliveriesTest[0]);
      }
    }
    
    // Provjeri push_subscriptions schema
    console.log('🔔 Provjera push_subscriptions tabele...');
    const { data: subsTest, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(1);
    
    if (subsError) {
      console.error('❌ Greška push_subscriptions:', subsError);
    } else {
      console.log('✅ Push_subscriptions tabela OK');
      if (subsTest?.[0]) {
        console.log('📊 Push_subscriptions kolone:', Object.keys(subsTest[0]));
        console.log('📋 Primjer subscription:', subsTest[0]);
      }
    }
    
    // Lista svih tabela
    console.log('📋 Dohvaćanje liste svih tabela...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_list'); // Ova funkcija možda neće raditi
    
    if (tablesError) {
      console.log('ℹ️ Nemoguće dohvatiti listu tabela:', tablesError.message);
    } else {
      console.log('📋 Sve tabele:', tables);
    }
    
    return {
      success: true,
      drivers: driversTest?.[0] ? Object.keys(driversTest[0]) : null,
      deliveries: deliveriesTest?.[0] ? Object.keys(deliveriesTest[0]) : null,
      push_subscriptions: subsTest?.[0] ? Object.keys(subsTest[0]) : null
    };
    
  } catch (error) {
    console.error('💥 Greška u provjeri schema:', error);
    return { success: false, error };
  }
};

export default checkDatabaseSchema;