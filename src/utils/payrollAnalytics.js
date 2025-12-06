import { supabase } from '../db/supabaseClient';

// Dohvati ukupni trosak poslodavca po vozacu i ukupno za sve, filtrirano po godini
// Godina se čita iz naziva fajla, npr. "01_2025.pdf" -> 2025
export async function getPayrollAnalytics(year) {
  // Povuci sve payroll_amounts (filtriranje po godini radimo u JS, na osnovu file_name)
  const { data, error } = await supabase
    .from('payroll_amounts')
    .select('driver_name, file_name, ukupni_trosak');

  if (error || !data) return { drivers: [], total: 0 };

  const targetYear = Number(year) || new Date().getFullYear();

  const filtered = data.filter((row) => {
    if (!row?.file_name) return false;
    // Očekivani format: MM_YYYY.pdf
    const match = row.file_name.match(/_(\d{4})\.pdf$/);
    if (!match) return false;
    const fileYear = Number(match[1]);
    return fileYear === targetYear;
  });

  // Grupisi po vozacu
  const byDriver = {};
  let total = 0;

  for (const row of filtered) {
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
