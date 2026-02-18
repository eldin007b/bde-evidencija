import { supabase } from '../db/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.js?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();

// ==============================
// UPLOAD + PARSE + VALIDACIJA
// ==============================
export async function uploadPayrollFile(folderDriver, file) {
  try {
    const folderName = folderDriver.trim().toLowerCase();

    // ===== UČITAJ PDF =====
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + ' ';
    }

    // ===== IZVUCI IME =====
    const nameMatch = fullText.match(/([A-ZČĆŽŠĐ][a-zčćžšđ]+)[,\s]+([A-ZČĆŽŠĐ][a-zčćžšđ]+)/);

    if (!nameMatch) {
      throw new Error('Ime nije pronađeno u PDF-u.');
    }

    let imeIzPdf = nameMatch[0].includes(',')
      ? nameMatch[2]
      : nameMatch[1];

    imeIzPdf = imeIzPdf.trim().toLowerCase();

    // ===== VALIDACIJA VOZAČA =====
    if (imeIzPdf !== folderName) {
      throw new Error(
        `PDF pripada vozaču "${imeIzPdf}", a pokušavaš upload u folder "${folderName}".`
      );
    }

    // ===== NETO =====
    const nettoMatch = fullText.match(/Auszahlung\s+([\d.,]+)/i);
    const neto = nettoMatch
      ? parseFloat(nettoMatch[1].replace(/\./g, '').replace(',', '.'))
      : 0;

    // ===== BRUTO =====
    const bruttoMatch = fullText.match(/Brutto\s+([\d.,]+)/i);
    const bruto = bruttoMatch
      ? parseFloat(bruttoMatch[1].replace(/\./g, '').replace(',', '.'))
      : 0;

    // ===== MJESEC + GODINA =====
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

    // ===== UPLOAD (OVERWRITE) =====
    const { error: uploadError } = await supabase.storage
      .from('payrolls')
      .upload(storagePath, file, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // ===== UPSERT U BAZU =====
    const { error: dbError } = await supabase
      .from('payroll_amounts')
      .upsert({
        driver_name: folderName,
        file_name: newFileName,
        neto,
        bruto,
        created_at: new Date()
      }, {
        onConflict: ['driver_name', 'file_name']
      });

    if (dbError) throw dbError;

    alert(`Uspješno dodano: ${newFileName}`);
    return true;

  } catch (err) {
    console.error('Greška:', err);
    alert(err.message);
    return false;
  }
}
