import React, { useState, useEffect, useMemo, useRef } from "react";
import { Printer, User, Loader2, Calendar } from "lucide-react";

// UVOZIMO TVOJ POSTOJEĆI SERVIS
// (Ovo automatski koristi tvoj API Key iz .env fajla, ne moraš ga ovdje kucati)
import { 
  supabase, 
  getAllDriversCloud, 
  getDeliveriesByDriverCloud 
} from "./supabaseService"; 

/* TVOJA SPECIFIČNA IMENA (Mapiranje ID -> Ime koje želiš na PDF-u) */
const PREFERRED_NAMES = {
  8640: "Arnes Hokic",
  8620: "Denis Frelih",
  8610: "Eldin Begić",
  8630: "Nina Begić"
};

/* KONFIGURACIJA PDF-a */
const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30-12:00";
const WORK_HOURS = 8;
const NOTE_WORK = "Ladezeit 3 Std./Tag";
const NOTE_VACATION = "URLAUB";

export default function WorktimeTab() {
  // --- STATE ---
  const [drivers, setDrivers] = useState([]); 
  const [selectedDriverTura, setSelectedDriverTura] = useState("8640"); // Default Arnes
  
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);
  
  const [workData, setWorkData] = useState([]);
  const [urlaubData, setUrlaubData] = useState([]);
  const [loading, setLoading] = useState(false);

  const printRef = useRef(null);

  // 1. UČITAJ VOZAČE
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

  // 2. UČITAJ PODATKE KAD SE PROMIJENI ODABIR
  useEffect(() => {
    if (!selectedDriverTura) return;

    async function loadWorkData() {
      setLoading(true);
      try {
        // A) Dostave (koristi tvoju postojeću funkciju)
        // Pazi: getDeliveriesByDriverCloud očekuje mjesec 0-11, a state je 1-12
        const deliveries = await getDeliveriesByDriverCloud(selectedDriverTura, year, month - 1);
        setWorkData(deliveries);

        // B) Godišnji odmori (direktan upit jer nemaš funkciju za ovo)
        // Računamo prvi i zadnji dan mjeseca za filter
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

        const { data: urlaubs, error } = await supabase
          .from('urlaub_marks_rows')
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

  // --- LOGIKA TABELE ---
  const { rows, totalHours } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let sumHours = 0;

    const calculatedRows = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Provjeri da li je godišnji
      const isUrlaub = urlaubData.some(u => u.date === dateStr);

      // Provjeri da li ima paketa (radni dan)
      const delivery = workData.find(d => d.date === dateStr);
      // Gledamo da li je broj paketa veći od 0
      const hasPackages = delivery && delivery.paketi > 0;

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

  // Dobijanje imena za prikaz (koristimo tvoja prilagođena imena)
  const currentDriverName = PREFERRED_NAMES[selectedDriverTura] || "Nepoznat Vozač";

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* --- KONTROLNA PLOČA (NE PRINTA SE) --- */}
      <div className="w-full max-w-[210mm] bg-white p-5 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-6 items-center justify-between no-print">
        
        <div className="flex gap-4 items-center flex-wrap">
          {/* Odabir Vozača */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Vozač</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-gray-400" />
              <select 
                value={selectedDriverTura}
                onChange={(e) => setSelectedDriverTura(e.target.value)}
                className="pl-9 pr-8 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium min-w-[200px]"
              >
                {/* Prikazujemo samo ova 4 vozača jer si tako tražio, ili listu iz baze */}
                {Object.entries(PREFERRED_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Odabir Datuma */}
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

          {/* Loading indikator */}
          {loading && (
            <div className="flex items-center text-blue-600 text-sm font-semibold animate-pulse ml-2">
                <Loader2 size={18} className="animate-spin mr-2"/>
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
        >
          <Printer size={20} />
          Printaj PDF
        </button>
      </div>

      {/* --- DIO KOJI SE PRINTA (A4 FORMAT) --- */}
      <div
        ref={printRef}
        className="bg-white text-black p-10 w-full max-w-[210mm] shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full"
        style={{ minHeight: "297mm", fontFamily: "Arial, sans-serif" }}
      >
        <h1 className="text-xl font-bold mb-6 text-left" style={{ fontSize: "22px" }}>
          Arbeitszeitaufzeichnungen
        </h1>

        <div className="mb-8 text-sm leading-relaxed">
          <p className="mb-1">
            <strong>Nachname und Vorname:</strong> {currentDriverName}
          </p>
          <p>
            <strong>Monat und Jahr:</strong> {String(month).padStart(2, "0")}/{year}
          </p>
        </div>

        <table className="w-full border-collapse text-xs border border-black" style={{ fontSize: "11px" }}>
          <thead>
            <tr className="bg-gray-100 print:bg-gray-100">
              <th className="border border-black p-1 text-center w-8">Tag</th>
              <th className="border border-black p-1 text-center w-24">Arbeitsbeginn</th>
              <th className="border border-black p-1 text-center w-24">Arbeitsende</th>
              <th className="border border-black p-1 text-center w-28">Pause (von - bis)</th>
              <th className="border border-black p-1 text-center w-24">Tagesarbeitszeit</th>
              <th className="border border-black p-1 text-left px-2">Notizen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} style={{ height: "24px" }}>
                <td className="border border-black p-1 text-center">{r.day}</td>
                <td className="border border-black p-1 text-center">{r.start}</td>
                <td className="border border-black p-1 text-center">{r.end}</td>
                <td className="border border-black p-1 text-center">{r.pause}</td>
                <td className="border border-black p-1 text-center font-semibold">
                  {r.hours}
                </td>
                <td className="border border-black p-1 text-left px-2 text-gray-800">
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 font-bold text-sm">
          Gesamtarbeitszeit: {totalHours} Stunden
        </div>

        <div className="mt-20 flex justify-between text-sm pr-10">
          <div className="text-center">
            <div className="border-t border-black w-56 pt-2"></div>
            Unterschrift Fahrer
          </div>
          <div className="text-center">
            <div className="border-t border-black w-56 pt-2"></div>
            Unterschrift Firma
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
