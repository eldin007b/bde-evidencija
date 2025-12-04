import { supabase } from '../db/supabaseClient';

// Dohvati ukupni trosak poslodavca po vozacu i ukupno za sve
export async function getPayrollAnalytics() {
  // Povuci sve payroll_amounts
  const { data, error } = await supabase
    .from('payroll_amounts')
    .select('driver_name, ukupni_trosak');
  if (error || !data) return { drivers: [], total: 0 };

  // Grupisi po vozacu
  const byDriver = {};
  let total = 0;
  for (const row of data) {
    const name = row.driver_name;
    const cost = Number(row.ukupni_trosak || 0);
    if (!byDriver[name]) byDriver[name] = 0;
    byDriver[name] += cost;
    total += cost;
  }
  // Formatiraj za prikaz
  const drivers = Object.entries(byDriver).map(([name, cost]) => ({ name, cost }));
  return { drivers, total };
}
