import { supabase } from '../db/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();
// LIST FILES
// ==============================
export async function getPayrollFiles(ime) {
  const { data, error } = await supabase.storage
    .from('payrolls')
    .list(ime, { limit: 100, offset: 0 });

  if (error) {
    console.error('Greška pri listanju fajlova:', error);
    return [];
  }

  return (data || []).filter(f =>
    f &&
    f.name &&
    typeof f.name === 'string' &&
    f.name.endsWith('.pdf')
  );
}

// ==============================
// DOWNLOAD
// ==============================
export async function downloadPayrollFile(ime, fileName) {
  const { data, error } = await supabase.storage
    .from('payrolls')
    .download(`${ime}/${fileName}`);

  if (error) {
    console.error('Greška pri downloadu fajla:', error);
    return null;
  }

  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ==============================
// DELETE
// ==============================
export async function deletePayrollFile(ime, fileName) {
  await supabase.storage.from('payrolls').remove([`${ime}/${fileName}`]);
}

// ==============================
// UPLOAD (AUTOMATSKI PARSE + VALIDACIJA)
// ==============================
export async function uploadPayrollFile(imeFolder, file) {
  try {
    const folderName = imeFolder.trim().toLowerCase();

    // ====== UČITAJ PDF ======
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(' ') + ' ';
    }

    // ====== IZVUCI IME ======
    const nameMatch = fullText.match(/([A-ZČĆŽŠĐ][a-zčćžšđ]+)[,\s]+([A-ZČĆŽŠĐ][a-zčćžšđ]+)/);

    if (!nameMatch) {
      throw new Error('Ime nije pronađeno u PDF-u.');
    }

    let imeIzPdf = nameMatch[0].includes(',')
      ? nameMatch[2]
      : nameMatch[1];

    imeIzPdf = imeIzPdf.trim().toLowerCase();

    // ====== VALIDACIJA IMENA ======
    if (imeIzPdf !== folderName) {
      throw new Error(
        `PDF pripada vozaču "${imeIzPdf}", ali pokušavaš upload u folder "${folderName}".`
      );
    }

    // ====== IZVUCI NETO ======
    const nettoMatch = fullText.match(/Auszahlung\s+([\d.,]+)/i);
    const neto = nettoMatch
      ? parseFloat(nettoMatch[1].replace(/\./g, '').replace(',', '.'))
      : 0;

    // ====== IZVUCI BRUTO ======
    const bruttoMatch = fullText.match(/Brutto\s+([\d.,]+)/i);
    const bruto = bruttoMatch
      ? parseFloat(bruttoMatch[1].replace(/\./g, '').replace(',', '.'))
      : 0;

    // ====== IZVUCI MJESEC + GODINU ======
    const monthMatch = fullText.match(
      /(Jänner|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i
    );

    if (!monthMatch) {
      throw new Error('Mjesec i godina nisu pronađeni u PDF-u.');
    }

    const monthMap = {
      'Jänner': '01',
      'Januar': '01',
      'Februar': '02',
      'März': '03',
      'April': '04',
      'Mai': '05',
      'Juni': '06',
      'Juli': '07',
      'August': '08',
      'September': '09',
      'Oktober': '10',
      'November': '11',
      'Dezember': '12'
    };

    const month = monthMap[monthMatch[1]];
    const year = monthMatch[2];

    const newFileName = `${month}_${year}.pdf`;
    const storagePath = `${folderName}/${newFileName}`;

    // ====== UPLOAD SA OVERWRITE ======
    const { error: uploadError } = await supabase.storage
      .from('payrolls')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw uploadError;
    }

    // ====== UPSERT U BAZU ======
    const { error: dbError } = await supabase
      .from('payroll_amounts')
      .upsert({
        driver_name: folderName,
        file_name: newFileName,
        neto,
        bruto
      }, {
        onConflict: ['driver_name', 'file_name']
      });

    if (dbError) {
      throw dbError;
    }

    alert(`Uspješan upload: ${newFileName}`);
    return true;

  } catch (err) {
    console.error('Greška:', err);
    alert(err.message);
    return false;
  }
}
