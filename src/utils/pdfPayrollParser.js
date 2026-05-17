import { getPayrollFiles } from '../services/SupabasePayrollService'
import { supabase } from '../db/supabaseClient'
import * as pdfjsLib from 'pdfjs-dist'

// GASIMO WORKER zbog PWA + mobile konflikta
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = null
}

/**
 * Extract Neto / Bruto / Gesamtaufwand from PDF
 */
export async function extractNetoBrutoFromPDF(arrayBuffer) {

  try {

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      disableWorker: true,
      isEvalSupported: false,
      disableRange: true,
      disableAutoFetch: true
    })

    const pdf = await loadingTask.promise

    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {

      const page = await pdf.getPage(i)
      const content = await page.getTextContent()

      fullText += content.items
        .map(item => item.str)
        .join(' ') + '\n'

    }

    const parseEuroValue = (val) => {

      if (!val) return 0

      const clean = val
        .replace(/\./g, '')
        .replace(',', '.')

      return parseFloat(clean) || 0

    }

    let neto = 0
    let bruto = 0
    let ukupni_trosak = 0

    /* -------- Brutto -------- */

    const brutoMatch = fullText.match(/Brutto\s*([\d.,]+)/i)

    if (brutoMatch) {
      bruto = parseEuroValue(brutoMatch[1])
    }

    /* -------- Netto -------- */

    const nettoIndex = fullText.indexOf('Netto')

    if (nettoIndex !== -1) {

      const region = fullText.substring(nettoIndex + 5, nettoIndex + 120)

      const amounts = region.match(/-?[\d.,]+/g)

      if (amounts) {

        const positive = amounts.find(v => !v.startsWith('-'))

        if (positive) {
          neto = parseEuroValue(positive)
        }

      }

    }

    /* -------- Gesamtaufwand -------- */

    const gesamtMatch =
      fullText.match(/Gesamtaufwand[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i)

    if (gesamtMatch) {
      ukupni_trosak = parseEuroValue(gesamtMatch[1])
    }

    return {
      neto,
      bruto,
      ukupni_trosak
    }

  }
  catch (err) {

    console.error('PDF parse error:', err)

    return {
      neto: 0,
      bruto: 0,
      ukupni_trosak: 0
    }

  }

}

/**
 * Parse payroll PDFs and store results
 */
export async function getTotalPayrollAmounts(driverName) {

  try {

    const folder = driverName.toLowerCase()

    const files = await getPayrollFiles(folder)

    if (!files || files.length === 0) {
      return
    }

    for (const file of files) {

      try {

        const { data, error } =
          await supabase
            .storage
            .from('payrolls')
            .download(`${folder}/${file.name}`)

        if (error || !data) continue

        const buffer = await data.arrayBuffer()

        const result =
          await extractNetoBrutoFromPDF(buffer)

        if (
          result.neto > 0 ||
          result.bruto > 0 ||
          result.ukupni_trosak > 0
        ) {

          await supabase
            .from('payroll_amounts')
            .upsert({
              driver_name: folder,
              file_name: file.name,
              neto: result.neto,
              bruto: result.bruto,
              ukupni_trosak: result.ukupni_trosak
            },
            {
              onConflict: 'driver_name,file_name'
            })

        }

      }
      catch (err) {

        console.error('Payroll file parse error:', err)

      }

    }

  }
  catch (err) {

    console.error('Payroll processing error:', err)

  }

}
