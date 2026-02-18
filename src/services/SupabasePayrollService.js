import { supabase } from '../db/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ========================================
// LIST FILES
// ========================================
export async function getPayrollFiles(driver) {
  const { data, error } = await supabase.storage
    .from('payrolls')
    .list(driver, { limit: 100, offset: 0 });

  if (error) {
    console.error('Greška pri listanju fajlova:', error);
    return [];
  }

  return (data || []).filter(
    f => f && f.name && f.name.endsWith('.pdf')
  );
}

// ========================================
// DOWNLOAD
// ========================================
export async function downloadPayrollFile(driver, fileName) {
  const { data, error } = await supabase.storage
    .from('payrolls')
    .download(`${driver}/${fileName}`);

  if (error) {
    console.error('Greška pri downloadu:', error);
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

// ========================================
// DELETE
// ========================================
export async function deletePayrollFile(driver, fileName) {
  await supabase.storage
    .from('payrolls')
    .remove([`${driver}/${fileName}`]);

  await supabase
    .from('payroll_amounts')
    .delete()
    .eq('driver_name', driver)
    .eq('file_name', fileName);
}

// ========================================
// 100% AUTOMATSKI UPLOAD + VALIDACIJA
// ========================================
export async function uploadPayrollFile(folderDriver, file) {
  try {
    if (!file) throw new Error('Nema izabranog fajla.');

    const folderName = folderDriver.trim().toLowerCase();

    // =========================
    // 1️⃣ UČITAJ PDF
    // =========================
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + ' ';
    }

    if (!fullText) {
      throw new Error('PDF je prazan ili nečitljiv.');
    }

    // =========================
    // 2️⃣ VALIDACIJA VOZAČA
    // =========================
    const nameMatch = fullText.match(
      /([A-ZČĆŽŠĐ][a-zčćžšđ]+)[,\s]+([A-ZČĆŽŠĐ][a-zčćžšđ]+)/
    );

    if (!nameMatch) {
      throw new Error('Ime vozača nije pronađeno u PDF-u.');
    }

    let imeIzPdf = nameMatch[0].includes(',')
      ? nameMatch[2]
      : nameMatch[1];

    imeIzPdf = imeIzPdf.trim().toLowerCase();

    if (imeIzPdf !== folderName) {
      throw new Error(
        `PDF pripada vozaču "${imeIzPdf}", a upload ide u folder "${folderName}".`
      );
    }

    // =========================
    // 3️⃣ PARSIRAJ NETO
    // =========================
    let neto = 0;
    const nettoIndex = fullText.indexOf('Netto');

    if (nettoIndex !== -1) {
      const afterNetto = fullText.substring(nettoIndex + 5);
      const euroMatches = afterNetto.match(/-?[\d\.\,]+/g);

      if (euroMatches) {
        const firstPositive = euroMatches.find(val => !val.startsWith('-'));
        if (firstPositive) {
          neto = parseFloat(
            firstPositive.replace(/\./g, '').replace(',', '.')
          );
        }
      }
    }

    // =========================
    // 4️⃣ PARSIRAJ BRUTO
    // =========================
    const bruttoMatch = fullText.match(/Brutto\s*([\d\.\,]+)/i);
    const bruto = bruttoMatch
      ? parseFloat(bruttoMatch[1].replace(/\./g, '').replace(',', '.'))
      : 0;

    // =========================
    // 5️⃣ PARSIRAJ UKUPNI TROŠAK
    // =========================
    let ukupni_trosak = 0;
    const gesamtMatch = fullText.match(
      /Gesamtaufwand[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i
    );

    if (gesamtMatch && gesamtMatch[1]) {
      ukupni_trosak = parseFloat(
        gesamtMatch[1].replace(/\./g, '').replace(',', '.')
      );
    }

    // =========================
    // 6️⃣ IZVUCI MJESEC I GODINU
    // =========================
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
    const storagePath = `${folderName}/${newFileName}`;

    // =========================
    // 7️⃣ UPLOAD (OVERWRITE)
    // =========================
    const { error: uploadError } = await supabase.storage
      .from('payrolls')
      .upload(storagePath, file, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // =========================
    // 8️⃣ UPSERT U BAZU
    // =========================
    const { error: dbError } = await supabase
      .from('payroll_amounts')
      .upsert(
        {
          driver_name: folderName,
          file_name: newFileName,
          neto,
          bruto,
          ukupni_trosak,
          created_at: new Date()
        },
        {
          onConflict: ['driver_name', 'file_name']
        }
      );

    if (dbError) throw dbError;

    return {
      success: true,
      fileName: newFileName,
      neto,
      bruto,
      ukupni_trosak
    };

  } catch (err) {
    console.error('Payroll upload error:', err);
    return {
      success: false,
      message: err.message
    };
  }
}
