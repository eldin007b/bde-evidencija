import React, { useState, useEffect, useMemo, useRef } from "react";
import { Printer, User, Loader2 } from "lucide-react";

// Import tvojih funkcija
import { 
  supabase, 
  getAllDriversCloud, 
  getDeliveriesByDriverCloud 
} from "../../db/supabaseClient"; 

/* --- 1. TVOJA FIKSNA IMENA --- */
const PREFERRED_NAMES = {
  8640: "Arnes Hokić",
  8620: "Denis Frelih",
  8610: "Eldin Begić",
  8630: "Katarina Begić"
};

/* KONFIGURACIJA PDF-a */
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

  // Učitaj vozače
  useEffect(() => {
    async function loadDrivers() {
      try {
        const driversList = await getAllDriversCloud();
        setDrivers(driversList);
      } catch (error) {
        console.error("Greška pri učitavanju vozača:", error);
      }
    }
    loadDrivers();
  }, []);

  // Učitaj podatke
  useEffect(() => {
    if (!selectedDriverTura) return;

    async function loadWorkData() {
      setLoading(true);
      try {
        // Dostave
        const deliveries = await getDeliveriesByDriverCloud(selectedDriverTura, year, month - 1);
        setWorkData(deliveries);

        // Godišnji
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
        console.error("Greška pri učitavanju podataka:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkData();
  }, [selectedDriverTura, month, year]);

  // Logika tabele
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
        start: "", end: "", pause: "", hours: "", note: "", 
        isWork: false
      };

      if (isUrlaub) {
        row.hours = "0";
        row.note = NOTE_VACATION;
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

  // --- ODREĐIVANJE IMENA ---
  // Prioritet: Tvoja fiksna lista -> Ime iz baze -> Tura
  const dbDriver = drivers.find(d => d.tura == selectedDriverTura);
  const currentDriverName = PREFERRED_NAMES[selectedDriverTura] || (dbDriver ? (dbDriver.ime || dbDriver.name) : selectedDriverTura);

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* --- KONTROLNA PLOČA (Ne printa se) --- */}
      <div className="w-full max-w-[210mm] bg-white p-5 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-6 items-center justify-between no-print-section">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Vozač</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-gray-400" />
              <select 
                value={selectedDriverTura}
                onChange={(e) => setSelectedDriverTura(e.target.value)}
                className="pl-9 pr-8 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium min-w-[200px]"
              >
                {/* Prvo prikaži tvoja preferirana imena */}
                {Object.entries(PREFERRED_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
                {/* Zatim ostale iz baze koji nisu na listi */}
                {drivers.filter(d => !PREFERRED_NAMES[d.tura]).map((d) => (
                  <option key={d.id} value={d.tura}>
                    {d.ime || d.name} ({d.tura})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Period</label>
            <div className="flex gap-2 items-center">
              <input 
                type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="w-16 py-2 border rounded-lg bg-gray-50 text-center font-medium"
                min={1} max={12}
              />
              <span className="text-gray-400">/</span>
              <input 
                type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 py-2 border rounded-lg bg-gray-50 text-center font-medium"
              />
            </div>
          </div>
          {loading && <Loader2 size={18} className="animate-spin text-blue-600 ml-2"/>}
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
        >
          <Printer size={20} />
          Printaj PDF
        </button>
      </div>

      {/* --- DIO ZA PRINTANJE (A4) --- */}
      <div
        id="print-section" 
        className="bg-white text-black p-0 m-0 w-full"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <h1 className="text-lg font-bold mb-4 text-left border-none pt-4 pl-4" style={{ fontSize: "18px" }}>
          Arbeitszeitaufzeichnungen
        </h1>

        <div className="mb-4 text-sm leading-snug pl-4">
          <p className="mb-1">
            <strong>Nachname und Vorname:</strong> {currentDriverName}
          </p>
          <p>
            <strong>Monat und Jahr:</strong> {String(month).padStart(2, "0")}/{year}
          </p>
        </div>

        {/* Tabela sa manjim fontom i manjim paddingom da sve stane */}
        <div className="px-4">
            <table className="w-full border-collapse border border-black" style={{ fontSize: "10px" }}>
            <thead>
                <tr className="bg-gray-100 print:bg-gray-100">
                <th className="border border-black p-1 text-center w-8">Tag</th>
                <th className="border border-black p-1 text-center w-20">Arbeitsbeginn</th>
                <th className="border border-black p-1 text-center w-20">Arbeitsende</th>
                <th className="border border-black p-1 text-center w-24">Pause (von - bis)</th>
                <th className="border border-black p-1 text-center w-24">Tagesarbeitszeit</th>
                <th className="border border-black p-1 text-left px-2">Notizen</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                <tr key={r.day} style={{ height: "20px" }}> 
                    <td className="border border-black text-center" style={{ padding: "1px" }}>{r.day}</td>
                    <td className="border border-black text-center" style={{ padding: "1px" }}>{r.start}</td>
                    <td className="border border-black text-center" style={{ padding: "1px" }}>{r.end}</td>
                    <td className="border border-black text-center" style={{ padding: "1px" }}>{r.pause}</td>
                    <td className="border border-black text-center font-semibold" style={{ padding: "1px" }}>
                    {r.hours}
                    </td>
                    <td className="border border-black text-left px-2 text-gray-800" style={{ padding: "1px" }}>
                    {r.note}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        <div className="mt-4 pl-4 font-bold text-sm">
          Gesamtarbeitszeit: {totalHours} Stunden
        </div>

        <div className="mt-12 flex justify-between text-sm pr-10 pl-4">
          <div className="text-center">
            <div className="border-t border-black w-48 pt-1"></div>
            Unterschrift Fahrer
          </div>
          <div className="text-center">
            <div className="border-t border-black w-48 pt-1"></div>
            Unterschrift Firma
          </div>
        </div>
      </div>

      {/* --- CSS ZA PRINT --- */}
      <style>{`
        @media print {
          /* Sakrij sve nepotrebno */
          body * {
            visibility: hidden;
          }
          /* Pokaži samo print sekciju */
          #print-section, #print-section * {
            visibility: visible;
          }
          /* Pozicioniraj print sekciju na vrh */
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm; /* Malo margine za printer */
          }
          
          /* Osiguraj da stane na jednu stranu */
          @page {
            size: A4;
            margin: 5mm; /* Male margine na papiru */
          }
          
          /* Ukloni sjenke i pozadine */
          .shadow-sm, .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
