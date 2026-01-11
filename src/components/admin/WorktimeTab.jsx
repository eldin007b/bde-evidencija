import React, { useState, useEffect, useMemo, useRef } from "react";
import { Printer, User, Loader2 } from "lucide-react";

// Import tvojih funkcija (Pazi da je putanja tačna)
import { 
  supabase, 
  getAllDriversCloud, 
  getDeliveriesByDriverCloud 
} from "../../db/supabaseClient"; 

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
  const [selectedDriverTura, setSelectedDriverTura] = useState("8640"); 
  
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);
  
  const [workData, setWorkData] = useState([]);
  const [urlaubData, setUrlaubData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. UČITAJ VOZAČE (da dobijemo ispravna imena iz baze)
  useEffect(() => {
    async function loadDrivers() {
      try {
        const driversList = await getAllDriversCloud();
        setDrivers(driversList);
        // Ako je lista puna, selektuj prvog, ili ostavi 8640 kao fallback
        if (driversList.length > 0) {
           // Ovdje možeš staviti logiku da selektuješ specifičnog ako želiš
           // setSelectedDriverTura(driversList[0].tura);
        }
      } catch (error) {
        console.error("Greška pri učitavanju vozača:", error);
      }
    }
    loadDrivers();
  }, []);

  // 2. UČITAJ PODATKE (Dostave + Urlaub)
  useEffect(() => {
    if (!selectedDriverTura) return;

    async function loadWorkData() {
      setLoading(true);
      try {
        // A) DOSTAVE - preko tvoje funkcije
        const deliveries = await getDeliveriesByDriverCloud(selectedDriverTura, year, month - 1);
        setWorkData(deliveries);

        // B) GODIŠNJI ODMORI - Direktno iz tabele 'urlaub_marks' koju si poslao
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

        const { data: urlaubs, error } = await supabase
          .from('urlaub_marks') // <--- TVOJA NOVA TABELA
          .select('date')
          .eq('driver', selectedDriverTura) // driver kolona je text (tura)
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('is_active', true); // Samo aktivni

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

  // --- LOGIKA SPAJANJA PODATAKA ---
  const { rows, totalHours } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let sumHours = 0;

    const calculatedRows = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // 1. Provjera Urlaub
      const isUrlaub = urlaubData.some(u => u.date === dateStr);

      // 2. Provjera Paketa
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

  // Ime vozača za prikaz
  const currentDriverObj = drivers.find(d => d.tura == selectedDriverTura);
  const currentDriverName = currentDriverObj 
    ? (currentDriverObj.ime || currentDriverObj.name) 
    : selectedDriverTura; // Fallback na turu (npr 8640) ako ime nije učitano

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* --- KONTROLNA PLOČA (Gornji dio sa opcijama) --- */}
      {/* Klasa 'no-print-section' označava da se ovo NEĆE printati */}
      <div className="w-full max-w-[210mm] bg-white p-5 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-6 items-center justify-between no-print-section">
        
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
                {drivers.length === 0 && <option value="8640">Učitavam...</option>}
                {drivers.map((d) => (
                  <option key={d.id} value={d.tura}>
                    {d.ime || d.name} ({d.tura})
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

      {/* --- DIO ZA PRINTANJE (ID: print-section) --- */}
      <div
        id="print-section" 
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

      {/* --- AGRESIVNI CSS ZA PRINTANJE --- */}
      <style>{`
        @media print {
          /* 1. Sakrij SVE u body-ju */
          body * {
            visibility: hidden;
          }
          
          /* 2. Pokaži samo naš print kontejner i njegov sadržaj */
          #print-section, #print-section * {
            visibility: visible;
          }

          /* 3. Pozicioniraj print sekciju na vrh stranice */
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            box-shadow: none !important;
          }
          
          /* 4. Sakrij header/footer od browsera ako je moguće */
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
