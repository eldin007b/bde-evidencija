import { supabase } from './supabaseClient';

// Sync deliveries
export async function syncDeliveries() {
  // Povuci sve deliveries sa Supabase
  const { data: remoteRows, error } = await supabase.from('deliveries').select('*');
  if (error) throw error;
  return remoteRows;
}

// Sync drivers
export async function syncDrivers() {
  const { data: remoteRows, error } = await supabase.from('drivers').select('*');
  if (error) throw error;
  return remoteRows;
}
