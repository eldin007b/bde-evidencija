import { supabase } from './supabaseClient';

/**
 * Inkrementalni sync za dostave
 * @param {string} lastSyncTime - ISO timestamp zadnjeg uspješnog synca
 */
export async function syncDeliveries(lastSyncTime = null) {
  let query = supabase.from('deliveries').select('*');
  
  if (lastSyncTime) {
    // Pretpostavljamo da postoji updated_at kolona u bazi
    // Ako ne postoji, koristićemo 'date' ili drugu dostupnu kolonu
    query = query.gt('updated_at', lastSyncTime);
  }
  
  const { data: remoteRows, error } = await query;
  if (error) throw error;
  return remoteRows;
}

/**
 * Inkrementalni sync za vozače
 * @param {string} lastSyncTime - ISO timestamp zadnjeg uspješnog synca
 */
export async function syncDrivers(lastSyncTime = null) {
  let query = supabase.from('drivers').select('*');
  
  if (lastSyncTime) {
    query = query.gt('updated_at', lastSyncTime);
  }

  const { data: remoteRows, error } = await query;
  if (error) throw error;
  return remoteRows;
}
