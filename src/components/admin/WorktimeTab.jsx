import React, { useState, useEffect, useMemo } from "react";
import { Printer, Download, User, Loader2 } from "lucide-react";
// Import biblioteke za PDF export
import html2pdf from 'html2pdf.js';

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

  // 3. Logika tabele
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
        isWork: false,
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
        row.isWork = true;
      }
      
      return row;
    });

    return { rows: calculatedRows, totalHours: sumHours };
  }, [workData, urlaubData, month, year]);

  const dbDriver = drivers.find(d => d.tura == selectedDriverTura);
  const currentDriverName = PREFERRED_NAMES[selectedDriverTura] || (dbDriver ? (dbDriver.ime || dbDriver.name) : selectedDriverTura);

  // --- FUNKCIJA ZA EXPORT PDF-a ---
  const handleDownloadPDF = () => {
    const element = document.getElementById('print-section');
    const opt = {
      margin: 10, // mm
      filename: `Arbeitszeit_${currentDriverName}_${month}_${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 }, // Veća kvaliteta
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Privremeno učinimo element vidljivim za html2pdf ako je skriven
    const originalPosition = element.style.position;
    element.style.position = 'relative'; 
    
    html2pdf().set(opt).from(element).save().then(() => {
        // Vrati na staro (iako CSS media print to ionako kontroliše)
        element.style.position = originalPosition;
    });
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* --- MENU --- */}
      <div className="w-full max-w-[210mm] bg-white p-4 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex gap-4 items-center flex-wrap">
          {/* Odabir Vozača */}
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
          {/* Odabir Datuma */}
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

        {/* --- DUGMAD --- */}
        <div className="flex gap-3">
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md transition-all active:scale-95"
            >
                <Download size={18} />
                Download PDF
            </button>
            
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
            >
                <Printer size={18} />
                Print
            </button>
        </div>
      </div>

      {/* --- SECTION ZA PRINT/EXPORT --- */}
      {/* Vidljiv na ekranu ali stiliziran kao A4 list */}
      <div 
        id="print-section" 
        className="bg-white text-black w-full max-w-[210mm] shadow-2xl p-8 mx-auto print:shadow-none print:p-0 print:m-0"
        style={{ minHeight: "297mm" }}
      >
        
        {/* HEADER */}
        <h1 className="text-xl font-bold mb-4 text-center uppercase tracking-wide border-b-0 pt-2" style={{ fontFamily: "Arial, sans-serif" }}>
          Arbeitszeitaufzeichnungen
        </h1>

        <div className="flex justify-between items-end mb-4 px-1 text-base" style={{ fontFamily: "Arial, sans-serif" }}>
            <div>
                <strong>Nachname und Vorname:</strong> <span className="ml-2 text-lg">{currentDriverName}</span>
            </div>
            <div>
                <strong>Monat und Jahr:</strong> <span className="ml-2 text-lg">{String(month).padStart(2, "0")}/{year}</span>
            </div>
        </div>

        {/* TABELA */}
        <table className="w-full border-collapse border border-black text-center table-fixed" style={{ fontSize: "11px", fontFamily: "Arial, sans-serif", tableLayout: "fixed" }}>
            <thead>
                <tr className="bg-gray-200 print:bg-gray-200">
                    <th className="border border-black p-1 w-[6%]">Tag</th>
                    <th className="border border-black p-1 w-[16%]">Arbeitsbeginn</th>
                    <th className="border border-black p-1 w-[16%]">Arbeitsende</th>
                    <th className="border border-black p-1 w-[22%]">Pause (von - bis)</th>
                    <th className="border border-black p-1 w-[14%]">Tagesarbeitszeit</th>
                    <th className="border border-black p-1 w-[26%]">Notizen</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => {
                    const rowColorClass = r.isUrlaub ? 'text-red-600 font-bold print:text-red-600' : 'text-black';
                    
                    return (
                        <tr key={r.day} style={{ height: "24px" }} className={rowColorClass}>
                            <td className="border border-black p-0 text-black">{r.day}</td>
                            <td className="border border-black p-0">{r.start}</td>
                            <td className="border border-black p-0">{r.end}</td>
                            <td className="border border-black p-0">{r.pause}</td>
                            <td className="border border-black p-0 font-medium text-black">{r.hours}</td>
                            <td className="border border-black p-0 text-center">
                                {r.note}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* FOOTER */}
        <div className="mt-4 font-bold text-base px-1" style={{ fontFamily: "Arial, sans-serif" }}>
          Gesamtarbeitszeit: {totalHours} Stunden
        </div>

        <div className="mt-14 flex justify-between text-base pr-10 pl-1" style={{ fontFamily: "Arial, sans-serif" }}>
          <div className="text-center">
            <div className="border-t border-black w-64 pt-2"></div>
            Unterschrift Fahrer
          </div>
          <div className="text-center">
            <div className="border-t border-black w-64 pt-2"></div>
            Unterschrift Firma
          </div>
        </div>
      </div>

      {/* --- CSS --- */}
      <style>{`
        /* CSS ZA PRINT (Kada se klikne Print dugme) */
        @media print {
            body {
                visibility: hidden;
            }
            .no-print {
                display: none !important;
            }
            #print-section {
                visibility: visible;
                position: fixed; 
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background: white; 
                z-index: 9999; 
                box-shadow: none !important;
            }
            #print-section * {
                visibility: visible;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            @page {
                size: A4;
                margin: 10mm;
            }
        }
      `}</style>
    </div>
  );
}
