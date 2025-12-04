import { getPayrollFiles, downloadPayrollFile } from '../services/SupabasePayrollService';
import { supabase } from '../db/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Parsiraj tekst iz PDF-a i izvuci neto/bruto
export async function extractNetoBrutoFromPDF(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join('\n');
  }
  // Parsiranje Brutto
  const brutoMatch = (text && typeof text === 'string') ? text.match(/Brutto\s*([\d\.\,]+)/i) : null;
  let neto = 0;
  if (text && typeof text === 'string') {
    const nettoIndex = text.indexOf('Netto');
    if (nettoIndex !== -1) {
      const afterNetto = text.substring(nettoIndex + 5);
      const euroMatches = afterNetto.match(/-?[\d\.\,]+/g);
      if (euroMatches) {
        const firstPositive = euroMatches.find(val => !val.startsWith('-'));
        if (firstPositive) {
          neto = parseFloat(firstPositive.replace(/\./g, '').replace(',', '.'));
        }
      }
    }
  }
  // Parsiranje Gesamtaufwand (ukupni trosak poslodavca)
  let ukupni_trosak = 0;
  // Regex dozvoljava razmak, dvotačku, više linija između riječi i iznosa
  const gesamtMatch = (text && typeof text === 'string') ? text.match(/Gesamtaufwand[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i) : null;
  if (gesamtMatch && gesamtMatch[1]) {
    ukupni_trosak = parseFloat(gesamtMatch[1].replace(/\./g, '').replace(',', '.'));
  }
  const parseEuro = (val) => val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;
  const bruto = brutoMatch ? parseEuro(brutoMatch[1]) : 0;
  return { neto, bruto, ukupni_trosak };
}

// Dohvati ukupni neto/bruto za vozača
export async function getTotalPayrollAmounts(driverName) {
  const files = await getPayrollFiles(driverName);
  let totalNeto = 0;
  let totalBruto = 0;
  for (const file of files) {
    const { data, error } = await supabase
      .storage
      .from('payrolls')
      .download(`${driverName}/${file.name}`);
    if (error || !data) {
      continue;
    }
    try {
      const arrayBuffer = await data.arrayBuffer();
      const { neto, bruto, ukupni_trosak } = await extractNetoBrutoFromPDF(arrayBuffer);
      // Upsert payroll_amounts: insert ako ne postoji, update ako postoji
      if (neto > 0 || bruto > 0 || ukupni_trosak > 0) {
        await supabase
          .from('payroll_amounts')
          .upsert({
            driver_name: driverName,
            file_name: file.name,
            neto,
            bruto,
            ukupni_trosak
          }, { onConflict: ['driver_name', 'file_name'] });
      }
      totalNeto += neto;
      totalBruto += bruto;
    } catch (e) {
      // skip
    }
  }
  return { neto: totalNeto, bruto: totalBruto };
}
