import { supabase } from '../db/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.js?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();

/* =======================================================
   POMOĆNE FUNKCIJE
======================================================= */

function normalizeName(str) {
  return str
    ?.trim()
    .toLowerCase()
    .replace(/č/g, 'c')
    .replace(/ć/g, 'c')
    .replace(/ž/g, 'z')
    .replace(/š/g, 's')
    .replace(/đ/g, 'd');
}

function parseMoney(value) {
  if (!value) return 0;
  return parseFloat(
    value.replace(/\./g, '').replace(',', '.')
  );
}

/* =======================================================
   DOHVAT FILEOVA
======================================================= */

export async function getPayrollFiles(driver) {
  const folder = normalizeName(driver);

  const { data, error } = await supabase.storage
    .from('payrolls')
    .list(folder, { limit: 100 });

  if (error) {
    console.error('Greška pri listanju:', error);
    return [];
  }

  return (data || []).filter(f =>
    f?.name?.endsWith('.pdf')
  );
}

/* =======================================================
   DOWNLOAD
======================================================= */

export async function downloadPayrollFile(driver, fileName) {
  const folder = normalizeName(driver);

  const { data, error } = await supabase.storage
    .from('payrolls')
    .download(`${folder}/${fileName}`);

  if (error) {
    console.error('Download greška:', error);
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

/* =======================================================
   DELETE
======================================================= */

export async function deletePayrollFile(driver, fileName) {
  const folder = normalizeName(driver);

  await supabase.storage
    .from('payrolls')
    .remove([`${folder}/${fileName}`]);

  await supabase
    .from('payroll_amounts')
    .delete()
    .eq('driver_name', folder)
    .eq('file_name', fileName);
}

/* =======================================================
   UPLOAD + VALIDACIJA + PARSIRANJE
======================================================= */

export async function uploadPayrollFile(driver, file) {
  try {
    const folder = normalizeName(driver);

    if (!file || file.type !== 'application/pdf') {
      throw new Error('Fajl mora biti PDF.');
    }

    // ===============================
    // UČITAJ PDF
    // ===============================

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(i => i.str).join(' ') + ' ';
    }

    // ===============================
    // VALIDACIJA IMENA VOZAČA
    // ===============================

    const nameMatch = fullText.match(
      /([A-ZČĆŽŠĐ][a-zčćžšđ]+)[,\s]+([A-ZČĆŽŠĐ][a-zčćžšđ]+)/
    );

    if (!nameMatch) {
      throw new Error('Ime vozača nije pronađeno u PDF-u.');
    }

    const imeIzPdf = normalizeName(
      nameMatch[0].includes(',')
        ? nameMatch[2]
        : nameMatch[1]
    );

    if (imeIzPdf !== folder) {
      throw new Error(
        `PDF pripada vozaču "${imeIzPdf}", a pokušavaš upload u folder "${folder}".`
      );
    }

    // ===============================
    // NETO
    // ===============================

    const netoMatch = fullText.match(/Auszahlung\s+([\d.,]+)/i);
    const neto = parseMoney(netoMatch?.[1]);

    // ===============================
    // BRUTO
    // ===============================

    const brutoMatch = fullText.match(/Brutto\s+([\d.,]+)/i);
    const bruto = parseMoney(brutoMatch?.[1]);

    // ===============================
    // UKUPNI TROŠAK (Gesamtaufwand)
    // ===============================

    const totalMatch = fullText.match(/Gesamtaufwand\s+([\d.,]+)/i);
    let ukupni_trosak = parseMoney(totalMatch?.[1]);

    // fallback ako ne postoji
    if (!ukupni_trosak) {
      ukupni_trosak = bruto;
    }

    // ===============================
    // MJESEC + GODINA
    // ===============================

    const monthMatch = fullText.match(
      /(Jänner|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i
    );

    if (!monthMatch) {
      throw new Error('Mjesec i godina nisu pronađeni.');
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
    const storagePath = `${folder}/${newFileName}`;

    // ===============================
    // UPLOAD (OVERWRITE)
    // ===============================

    const { error: uploadError } = await supabase.storage
      .from('payrolls')
      .upload(storagePath, file, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // ===============================
    // UPSERT U BAZU
    // ===============================

    const { error: dbError } = await supabase
      .from('payroll_amounts')
      .upsert({
        driver_name: folder,
        file_name: newFileName,
        neto,
        bruto,
        ukupni_trosak,
        created_at: new Date()
      }, {
        onConflict: ['driver_name', 'file_name']
      });

    if (dbError) throw dbError;

    return true;

  } catch (err) {
    console.error('Upload greška:', err);
    alert(err.message);
    return false;
  }
}
