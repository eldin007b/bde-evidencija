import { supabase } from '../db/supabaseClient';
import { getPayrollFiles } from '../services/SupabasePayrollService';
import { extractNetoBrutoFromPDF } from './pdfPayrollParser';

// Batch refresh za sve vozače
export async function refreshAllPayrolls() {
  console.log('[payrollBatchRefresh] Start batch refresh');
  // Dohvati sve vozače
  const { data: drivers, error } = await supabase.from('drivers').select('ime');
  if (error || !drivers) {
    console.warn('[payrollBatchRefresh] Nema vozača ili greška:', error);
    return;
  }
  console.log(`[payrollBatchRefresh] Ukupno vozača: ${drivers.length}`);
  for (const driver of drivers) {
  const driverName = driver.ime.trim().toLowerCase();
    const files = await getPayrollFiles(driverName);
    if (!files || files.length === 0) {
      console.warn(`[payrollBatchRefresh] Nema PDF fajlova za vozača: ${driverName}`);
      continue;
    }
    console.log(`[payrollBatchRefresh] Vozač: ${driverName}, broj PDF fajlova: ${files.length}`);
    for (const file of files) {
      console.log(`[payrollBatchRefresh] Downloadujem PDF: ${driverName}/${file.name}`);
      const { data, error: dlError } = await supabase
        .storage
        .from('payrolls')
        .download(`${driverName}/${file.name}`);
      if (dlError || !data) {
        console.error(`[payrollBatchRefresh] Greška pri downloadu: ${driverName}/${file.name}`, dlError);
        continue;
      }
      try {
        const arrayBuffer = await data.arrayBuffer();
        const { neto, bruto, ukupni_trosak } = await extractNetoBrutoFromPDF(arrayBuffer);
        console.log(`[payrollBatchRefresh] Parsed PDF: ${file.name} neto=${neto} bruto=${bruto} ukupni_trosak=${ukupni_trosak}`);
        if (neto > 0 || bruto > 0 || ukupni_trosak > 0) {
          const upsertRes = await supabase
            .from('payroll_amounts')
            .upsert({
              driver_name: driverName,
              file_name: file.name,
              neto,
              bruto,
              ukupni_trosak
            }, { onConflict: ['driver_name', 'file_name'] });
          console.log(`[payrollBatchRefresh] Upsert payroll_amounts:`, upsertRes);
        } else {
          console.warn(`[payrollBatchRefresh] Nema podataka za upis (${file.name})`);
        }
      } catch (e) {
        console.error(`[payrollBatchRefresh] Greška pri parsiranju PDF-a ${file.name}:`, e);
      }
    }
  }
}