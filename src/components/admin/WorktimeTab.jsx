import React, { useState, useEffect, useMemo } from "react";
import { Printer, User, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf"; // Koristimo tvoju postojeću biblioteku

import { 
  supabase, 
  getAllDriversCloud, 
  getDeliveriesByDriverCloud 
} from "../../db/supabaseClient"; 

/* IMENA */
const PREFERRED_NAMES = {
  8640: "Arnes Hokić",
  8620: "Denis Frelih",
  8610: "Eldin Begić",
  8630: "Katarina Begić"
};

/* KONFIGURACIJA */
const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30-12:00";
const WORK_HOURS = 8;
const NOTE_WORK = "Ladezeit 3 Std./Tag";
const NOTE_VACATION = "URLAUB";

export default function WorktimeTab() {
  const [drivers, setDrivers] = useState([]); 
  const [selectedDriverTura, setSelectedDriverTura] = useState("8640"); 
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);
  const [workData, setWorkData] = useState([]);
  const [urlaubData, setUrlaubData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Učitavanje vozača
  useEffect(() => {
    async function loadDrivers() {
      try {
        const driversList = await getAllDriversCloud();
        setDrivers(driversList);
      } catch (error) {
        console.error("Greška vozači:", error);
      }
    }
    loadDrivers();
  }, []);

  // 2. Učitavanje podataka
  useEffect(() => {
    if (!selectedDriverTura) return;

    async function loadWorkData() {
      setLoading(true);
      try {
        const deliveries = await getDeliveriesByDriverCloud(selectedDriverTura, year, month - 1);
        setWorkData(deliveries);

        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

        const { data: urlaubs, error } = await supabase
          .from('urlaub_marks')
          .select('date')
          .eq('driver', selectedDriverTura)
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('is_active', true);

        if (error) throw error;
        setUrlaubData(urlaubs || []);
      } catch (error) {
        console.error("Greška podaci:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWorkData();
  }, [selectedDriverTura, month, year]);

  // 3. Priprema podataka
  const { rows, totalHours } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let sumHours = 0;

    const calculatedRows = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const isUrlaub = urlaubData.some(u => u.date === dateStr);
      const delivery = workData.find(d => d.date === dateStr);
      const hasPackages = delivery && Number(delivery.paketi) > 0;

      let row = {
        day,
        start: "—",
        end: "—",
        pause: "—",
        hours: "—",
        note: "", 
        isUrlaub: false
      };

      if (isUrlaub) {
        row.hours = "0";
        row.note = NOTE_VACATION;
        row.isUrlaub = true;
      } 
      else if (hasPackages) {
        sumHours += WORK_HOURS;
        row.start = WORK_START;
        row.end = WORK_END;
        row.pause = BREAK_TIME;
        row.hours = WORK_HOURS;
        row.note = NOTE_WORK;
      }
      return row;
    });

    return { rows: calculatedRows, totalHours: sumHours };
  }, [workData, urlaubData, month, year]);

  const dbDriver = drivers.find(d => d.tura == selectedDriverTura);
  const currentDriverName = PREFERRED_NAMES[selectedDriverTura] || (dbDriver ? (dbDriver.ime || dbDriver.name) : selectedDriverTura);

  // --- PDF GENERATOR (FIKSNE KOORDINATE) ---
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Fontovi
    doc.setFont("helvetica", "normal");
    
    // 1. NASLOV (Centriran na 105mm - sredina A4)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Arbeitszeitaufzeichnungen", 105, 15, { align: "center" });

    // 2. PODACI (Lijevo i Desno fiksno)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Ime vozača
    doc.text("Nachname und Vorname:", 14, 25);
    doc.setFont("helvetica", "bold");
    doc.text(currentDriverName, 55, 25);
    
    // Datum
    doc.setFont("helvetica", "normal");
    doc.text("Monat und Jahr:", 150, 25);
    doc.setFont("helvetica", "bold");
    doc.text(`${String(month).padStart(2, "0")}/${year}`, 180, 25);

    // 3. TABELA (FIKSNA MREŽA)
    let startY = 32;
    const rowHeight = 7.5; // Malo veći redovi da popune stranicu ljepše
    
    // DEFINICIJA ŠIRINA (Mora biti ukupno oko 182mm)
    // Ovo garantuje da je tabela ista za sve!
    const colWidths = [
      12, // Tag
      30, // Beginn
      30, // Ende
      35, // Pause
      25, // Std.
      50  // Notizen
    ]; 
    const colHeaders = ['Tag', 'Beginn', 'Ende', 'Pause', 'Std.', 'Notizen'];
    
    // Izračunaj X pozicije
    let currentX = 14;
    const colX = colWidths.map(w => {
      const x = currentX;
      currentX += w;
      return x;
    });

    // ZAGLAVLJE TABELE (Siva pozadina)
    doc.setFillColor(230, 230, 230);
    doc.rect(14, startY, 182, rowHeight, 'F'); 
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setLineWidth(0.1);
    doc.setDrawColor(0); // Crna linija

    colHeaders.forEach((header, i) => {
      doc.rect(colX[i], startY, colWidths[i], rowHeight);
      doc.text(header, colX[i] + (colWidths[i] / 2), startY + 5, { align: "center" });
    });

    // REDOVI TABELE
    doc.setFont("helvetica", "normal");
    let currentY = startY + rowHeight;

    rows.forEach((r) => {
      const rowData = [
        String(r.day),
        r.start,
        r.end,
        r.pause,
        r.hours,
        r.note
      ];

      // Provjera za boju (Ako je Urlaub -> Crveno)
      if (r.isUrlaub) {
        doc.setTextColor(200, 0, 0); // Crvena
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(0, 0, 0); // Crna
        doc.setFont("helvetica", "normal");
      }

      rowData.forEach((text, i) => {
        // Crtaj okvir (uvijek crn)
        doc.setDrawColor(0); 
        doc.rect(colX[i], currentY, colWidths[i], rowHeight);
        
        // Crtaj tekst (centriran)
        doc.text(String(text), colX[i] + (colWidths[i] / 2), currentY + 5, { align: "center" });
      });

      currentY += rowHeight;
    });

    // 4. FOOTER (Ispod tabele)
    const footerY = currentY + 10;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Gesamtarbeitszeit: ${totalHours} Stunden`, 14, footerY);

    // Linije za potpis
    const signY = footerY + 25;
    doc.setLineWidth(0.2);
    
    // Potpis lijevo
    doc.line(14, signY, 80, signY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Unterschrift Fahrer", 47, signY + 5, { align: "center" });

    // Potpis desno
    doc.line(130, signY, 196, signY);
    doc.text("Unterschrift Firma", 163, signY + 5, { align: "center" });

    // 5. OTVORI PDF
    doc.save(`Arbeitszeit_${currentDriverName.replace(/ /g, "_")}_${month}_${year}.pdf`);
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* MENU */}
      <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Vozač</label>
            <select 
              value={selectedDriverTura}
              onChange={(e) => setSelectedDriverTura(e.target.value)}
              className="pl-2 pr-8 py-2 border rounded-lg bg-gray-50 text-sm font-medium min-w-[150px]"
            >
              {Object.entries(PREFERRED_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
              {drivers.filter(d => !PREFERRED_NAMES[d.tura]).map((d) => (
                <option key={d.id} value={d.tura}>
                  {d.ime || d.name} ({d.tura})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Period</label>
            <div className="flex gap-2 items-center">
              <input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-14 py-2 border rounded-lg bg-gray-50 text-center text-sm font-medium" min={1} max={12}/>
              <span className="text-gray-400">/</span>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-20 py-2 border rounded-lg bg-gray-50 text-center text-sm font-medium"/>
            </div>
          </div>
          {loading && <Loader2 size={18} className="animate-spin text-blue-600 ml-2"/>}
        </div>

        <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
        >
            <Printer size={20} />
            Download PDF
        </button>
      </div>

      {/* PREVIEW (Samo za informaciju korisniku) */}
      <div className="bg-white text-black w-full max-w-[210mm] shadow-2xl p-8 mx-auto hidden md:block">
        <div className="opacity-50 text-center mb-4 text-xs uppercase tracking-widest text-gray-400">Preview (Klikni Download za pravi PDF)</div>
        
        <h1 className="text-xl font-bold mb-4 text-center uppercase border-b-0 pt-2">
          Arbeitszeitaufzeichnungen
        </h1>

        <div className="flex justify-between items-end mb-4 px-1 text-sm">
            <div><strong>Nachname und Vorname:</strong> {currentDriverName}</div>
            <div><strong>Monat und Jahr:</strong> {String(month).padStart(2, "0")}/{year}</div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-center text-xs">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border p-1 w-10">Tag</th>
                    <th className="border p-1">Arbeitsbeginn</th>
                    <th className="border p-1">Arbeitsende</th>
                    <th className="border p-1">Pause</th>
                    <th className="border p-1 w-12">Std.</th>
                    <th className="border p-1">Notizen</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr key={r.day} className={r.isUrlaub ? 'text-red-600 font-bold' : ''}>
                        <td className="border p-1 text-black">{r.day}</td>
                        <td className="border p-1">{r.start}</td>
                        <td className="border p-1">{r.end}</td>
                        <td className="border p-1">{r.pause}</td>
                        <td className="border p-1 text-black">{r.hours}</td>
                        <td className="border p-1">{r.note}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
    }
