import { supabase } from '../db/supabaseClient';

// Dohvati sve platne liste za korisnika (folder = tura)
// Dohvati sve platne liste za vozača (folder = ime)
export async function getPayrollFiles(ime) {
  const { data, error } = await supabase.storage
    .from('payrolls')
    .list(ime, { limit: 100, offset: 0 });
  if (error) {
    console.error('Greška pri listanju fajlova:', error);
    return [];
  }
  // Vrati samo PDF fajlove, ignoriši foldere
  return (data || []).filter(f => f.name && f.name.endsWith('.pdf'));
}

// Download platne liste
export async function downloadPayrollFile(ime, fileName) {
  const { data, error } = await supabase.storage
    .from('payrolls')
    .download(`${ime}/${fileName}`);
  if (error) {
    console.error('Greška pri downloadu fajla:', error);
    return null;
  }
  // Kreiraj download link
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Briši platnu listu
export async function deletePayrollFile(ime, fileName) {
  await supabase.storage.from('payrolls').remove([`${ime}/${fileName}`]);
}

// Upload platne liste (overwrite ako postoji)
export async function uploadPayrollFile(ime, file) {
  console.log('[uploadPayrollFile] Početak upload:', ime, file.name);
  const { error } = await supabase.storage
    .from('payrolls')
    .upload(`${ime}/${file.name}`, file, {
      cacheControl: '3600',
      upsert: true, // automatski overwrite
      contentType: 'application/pdf'
    });
  if (error) {
    console.error('[uploadPayrollFile] Greška pri uploadu:', error);
    throw error;
  }
  console.log('[uploadPayrollFile] Upload OK:', ime, file.name);

  // Parsiraj PDF i upsert neto/bruto odmah nakon upload-a
  try {
    const { data, error: dlError } = await supabase.storage
      .from('payrolls')
      .download(`${ime}/${file.name}`);
    if (dlError || !data) {
      console.error('[uploadPayrollFile] Greška pri downloadu PDF-a:', dlError);
      return true;
    }
    console.log('[uploadPayrollFile] Download OK:', ime, file.name);
    const arrayBuffer = await data.arrayBuffer();
    const { extractNetoBrutoFromPDF } = await import('../utils/pdfPayrollParser');
    const { neto, bruto } = await extractNetoBrutoFromPDF(arrayBuffer);
    console.log('[uploadPayrollFile] Parsed PDF:', file.name, 'neto:', neto, 'bruto:', bruto);
    if (neto > 0 || bruto > 0) {
      const upsertRes = await supabase
        .from('payroll_amounts')
        .upsert({
          driver_name: ime,
          file_name: file.name,
          neto,
          bruto
        }, { onConflict: ['driver_name', 'file_name'] });
      console.log('[uploadPayrollFile] Upsert payroll_amounts:', upsertRes);
    } else {
      console.warn('[uploadPayrollFile] Neto/bruto nisu > 0, preskačem upsert.');
    }
  } catch (e) {
    console.error('[uploadPayrollFile] Greška u parsiranju/upsertu:', e);
  }
  return true;
}
