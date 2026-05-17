import { supabase } from '../db/supabaseClient'
import { toast } from 'react-hot-toast'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'
import { PDFDocument } from 'pdf-lib'

/* PDF worker konfiguracija za Vite + PWA */
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

/* =====================================
   1. POMOĆNE FUNKCIJE
===================================== */

function normalizeName(str) {
  if (typeof str !== 'string') {
    // If it's an object (like the driver object), try to access the 'ime' property
    if (str && typeof str === 'object' && str.ime) {
      str = str.ime;
    } else {
      return '';
    }
  }
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/đ/g, "d")
}

function parseMoney(value) {
  if (!value) return 0
  // Čisti format brojeva (npr. 3.361,56 -> 3361.56)
  const clean = value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0
}

/* =====================================
   2. GLAVNA FUNKCIJA ZA OBRADU (Upload & Parse)
===================================== */

export async function processCombinedPayroll(file) {
  try {
    const processedDrivers = []
    const arrayBuffer = await file.arrayBuffer()
    
    // Fix za memoriju
    const pdfBufferForSlicing = arrayBuffer.slice(0);

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const originalPdfDoc = await PDFDocument.load(pdfBufferForSlicing)

    const { data: dbDrivers } = await supabase.from('drivers').select('ime');
    const allowedDrivers = (dbDrivers || []).map(d => normalizeName(d.ime));

    const driverGroups = {}
    const driverData = {}

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(" ")
      const lowerText = normalizeName(pageText)

      if (lowerText.includes("summenbeleg")) continue

      const foundDriver = allowedDrivers.find(d => lowerText.includes(d))
      if (!foundDriver) continue

      if (!driverGroups[foundDriver]) driverGroups[foundDriver] = []
      driverGroups[foundDriver].push(i - 1)

      if (lowerText.includes("auszahlung") || lowerText.includes("abrechnung")) {
        // 1. DATUM
        const dateRegex = /(Janner|Januar|Februar|Marz|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i;
        const normalizedPageTextForDate = pageText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const monthMatch = normalizedPageTextForDate.match(dateRegex);

        // 2. PRVO NAĐEMO BRUTTO I TROŠAK (Oni su lakši za naći)
        const brutoMatch = pageText.match(/Brutto[^]*?([\d.,]+)/i);
        const bruto = parseMoney(brutoMatch?.[1]);

        const trosakMatch = pageText.match(/beträgt\s+somit\s+([\d.,]+)/i) || pageText.match(/Gesamtaufwand[^]*?([\d.,]+)/i);
        const trosak = parseMoney(trosakMatch?.[1]);

        // 3. NAĐEMO PRAVI NETO (Auszahlung) ELIMINACIJOM
        let neto = 0;
        const auszahlungIdx = pageText.lastIndexOf("Auszahlung");
        if (auszahlungIdx !== -1) {
          const region = pageText.substring(auszahlungIdx);
          const allNumbers = region.match(/[\d.,]+/g); // Uzmi sve brojeve nakon riječi Auszahlung

          if (allNumbers) {
            for (let numStr of allNumbers) {
              const val = parseMoney(numStr);
              // Tražimo broj koji:
              // - je veći od 500 (da preskočimo sitne poreze)
              // - NIJE bruto iznos (jer on često dođe prvi u PDF-u)
              // - NIJE ukupni trošak
              if (val > 500 && val !== bruto && val !== trosak) {
                neto = val;
                break; // Našli smo prvu cifru koja odgovara neto plaći
              }
            }
          }
        }

        driverData[foundDriver] = {
          neto: neto,
          bruto: bruto,
          trosak: trosak,
          month: monthMatch?.[1] || "Januar",
          year: monthMatch?.[2] || new Date().getFullYear().toString()
        }
      }
    }

    if (Object.keys(driverGroups).length === 0) {
      toast.error("Nije pronađen nijedan vozač u ovom PDF-u.")
      return []
    }

    const monthMap = { 
      Januar: "01", Janner: "01", Februar: "02", Marz: "03", Maerz: "03",
      April: "04", Mai: "05", Juni: "06", Juli: "07", August: "08", 
      September: "09", Oktober: "10", November: "11", Dezember: "12" 
    };

    for (const driver of Object.keys(driverGroups)) {
      const data = driverData[driver]
      if (!data || data.neto === 0) continue

      const newPdfDoc = await PDFDocument.create()
      const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, driverGroups[driver])
      copiedPages.forEach(p => newPdfDoc.addPage(p))

      const pdfBytes = await newPdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const fileName = `${monthMap[data.month] || "01"}_${data.year}.pdf`

      await supabase.storage.from("payrolls").upload(`${driver}/${fileName}`, blob, {
        upsert: true, contentType: "application/pdf"
      })

      await supabase.from("payroll_amounts").upsert({
        driver_name: driver,
        file_name: fileName,
        neto: data.neto,
        bruto: data.bruto,
        ukupni_trosak: data.trosak,
        created_at: new Date()
      }, { onConflict: ["driver_name", "file_name"] })

      processedDrivers.push(driver)
    }

    toast.success(`Uspješno spremljeno za: ${processedDrivers.join(", ")}`)
    return processedDrivers

  } catch (err) {
    console.error("Greška:", err)
    toast.error(`Greška: ${err.message}`)
    throw err
  }
}

/* =====================================
   3. OSTALE FUNKCIJE (Exporti za build)
===================================== */

export async function getPayrollFiles(driver) {
  const folder = normalizeName(driver)
  const { data, error } = await supabase.storage.from("payrolls").list(folder, { limit: 100 })
  if (error) return []
  return (data || []).filter(f => f?.name?.endsWith(".pdf"))
}

export async function downloadPayrollFile(driver, fileName) {
  try {
    const folder = normalizeName(driver)
    console.log(`[downloadPayrollFile] Attempting to download: ${folder}/${fileName}`);
    const { data, error } = await supabase.storage.from("payrolls").download(`${folder}/${fileName}`)
    if (error) {
      console.error("[downloadPayrollFile] Supabase storage error:", error);
      throw error;
    }
    console.log("[downloadPayrollFile] File downloaded successfully, creating blob URL...");
    const url = window.URL.createObjectURL(data)
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click();
    window.URL.revokeObjectURL(url)
    console.log("[downloadPayrollFile] Download triggered.");
  } catch (err) {
    console.error("[downloadPayrollFile] Final error:", err);
    toast.error(`Greška pri preuzimanju: ${err.message || 'Nepoznata greška'}`)
  }
}

export async function deletePayrollFile(driver, fileName) {
  try {
    const folder = normalizeName(driver)
    await supabase.storage.from("payrolls").remove([`${folder}/${fileName}`])
    await supabase.from("payroll_amounts").delete().eq("driver_name", folder).eq("file_name", fileName)
  } catch (err) { console.error("Greška pri brisanju:", err) }
}

export async function getArchiveCounts(driverNames) {
  try {
    const { data } = await supabase.from('payroll_amounts').select('driver_name')
    const counts = {}
    driverNames.forEach(name => {
      counts[name] = (data || []).filter(r => r.driver_name === name).length
    })
    return counts
  } catch (err) { return {} }
}
