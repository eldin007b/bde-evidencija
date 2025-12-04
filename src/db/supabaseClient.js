// Dohvati osnovne statistike iz Supabase
export async function getQuickStatsCloud() {
  // Prilagodi prema strukturi tvoje tabele/statistike
  const fallback = { lastSync: null, unsyncedCount: 0, status: 'unknown', progress: 0 };
  try {
    const { data, error } = await supabase
      .from('quick_stats')
      .select('*')
      .single();
    if (error) {
      // Ako tabela ne postoji ili bilo koji drugi SQL error, vrati default umjesto da puca aplikacija
      if (error.code === '42P01') {
        console.warn('[getQuickStatsCloud] quick_stats ne postoji – vraćam default');
        return fallback;
      }
      console.warn('[getQuickStatsCloud] Greška pri čitanju – vraćam default:', error);
      return fallback;
    }
    return data || fallback;
  } catch (e) {
    console.warn('[getQuickStatsCloud] Exception – vraćam default:', e);
    return fallback;
  }
}
// Dohvati sve praznike za godinu iz Supabase
export async function getAllHolidaysCloud(year) {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('deleted', 0)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`);
  if (error) throw error;
  return data || [];
}
import { createClient } from '@supabase/supabase-js';

// Detekcija okruženja za Supabase konfiguraciju
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

if (typeof window !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
  // Browser (Vite)
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
  SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
} else if (typeof process !== 'undefined' && process.env) {
  // Node.js
  SUPABASE_URL = process.env.SUPABASE_URL;
  SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hard delete za extra_rides_pending na Supabase po original_id
export async function deleteExtraRidePendingCloud(original_id) {
  const { error } = await supabase.from('extra_rides_pending').delete().eq('original_id', original_id);
  if (error) throw error;
  return true;
}

// Hard delete za extra_rides na Supabase po original_id
export async function deleteExtraRideCloud(original_id) {
  const { error } = await supabase.from('extra_rides').delete().eq('original_id', original_id);
  if (error) throw error;
  return true;
}

// Cloud helper funkcije
export async function addDriver(driver) {
  return await supabase.from('drivers').insert([driver]);
}
export async function getAllDeliveriesCloud(year, month) {
  let query = supabase.from('deliveries').select('*').eq('deleted', 0);
  
  if (year && month !== undefined) {
    // Filtriraj po godini i mesecu ako su prosleđeni
    const nextMonthRaw = month + 2;
    const nextYear = nextMonthRaw > 12 ? year + 1 : year;
    const nextMonth = nextMonthRaw > 12 ? 1 : nextMonthRaw;

    query = query
      .gte('date', `${year}-${String(month + 1).padStart(2, '0')}-01`)
      .lt('date', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Dohvati ukupan broj dostava (sumu iz sve kolone dostava)
export async function getTotalDeliveryCountCloud() {
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('zustellung_paketi')
      .eq('deleted', 0);
    
    if (error) throw error;
    
    // Sumiraj sve brojeve dostava iz kolone zustellung_paketi
    const totalDeliveries = (data || []).reduce((sum, row) => {
      return sum + (parseInt(row.zustellung_paketi) || 0);
    }, 0);
    
    return totalDeliveries;
  } catch (error) {
    console.error('Greška pri dohvatanju ukupnog broja dostava:', error);
    return 0;
  }
}
export async function getAllDriversCloud() {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('deleted', 0)
    .eq('aktivan', true)
    .order('tura');
  if (error) throw error;
  return data || [];
}

// Dohvati vozača po turi (kodu vozača)
export async function getDriverByTura(tura) {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('tura', tura)
    .eq('deleted', 0)
    .single();
  if (error) throw error;
  return data;
}

// Dodaj novu dostavu
export async function addDeliveryCloud(delivery) {
  const { data, error } = await supabase
    .from('deliveries')
    .insert([delivery])
    .select();
  if (error) throw error;
  return data;
}

// Ažuriraj postojeću dostavu
export async function updateDeliveryCloud(id, delivery) {
  const { data, error } = await supabase
    .from('deliveries')
    .update(delivery)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

// Dohvati dostave po vozaču
export async function getDeliveriesByDriverCloud(driverName, year, month) {
  let query = supabase
    .from('deliveries')
    .select('*')
    .eq('deleted', 0)
    .eq('driver', driverName);
  
  if (year) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
  }
  
  if (month !== undefined) {
    const monthPadded = String(month + 1).padStart(2, '0');
    query = query.gte('date', `${year}-${monthPadded}-01`).lte('date', `${year}-${monthPadded}-31`);
  }
  
  const { data, error } = await query.order('date', { ascending: true });
  if (error) throw error;
  
  // Transformiraj podatke za DriversScreen format prema tabeli strukturi
  return (data || []).map(delivery => ({
    date: delivery.date,
    stopovi: delivery.produktivitaet_stops || 0,
    paketi: delivery.zustellung_paketi || 0,
    pickup: delivery.pickup_paketi || 0,
    reklamacije: delivery.probleme_prva ? 1 : 0, // Broj reklamacija
    efikasnost: delivery.zustellung_proc ? parseInt(delivery.zustellung_proc) : 0,
    stopH: delivery.produktivitaet_stops_pro_std || 0
  }));
}
export async function deleteDriverCloud(driverId) {
  const { error } = await supabase.from('drivers').delete().eq('id', driverId);
  if (error) throw error;
  return true;
}
export async function updateDriverCloud(driverId, data) {
  const { error } = await supabase.from('drivers').update(data).eq('id', driverId);
  if (error) throw error;
  return true;
}
// Device approvals
export async function getDeviceApprovals() {
  const { data, error } = await supabase.from('device_approvals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function blockDevice(device_id) {
  const { error } = await supabase.from('device_approvals').update({ blocked: true }).eq('device_id', device_id);
  if (error) throw error;
  return true;
}
