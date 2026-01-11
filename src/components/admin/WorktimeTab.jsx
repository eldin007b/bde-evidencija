import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Printer, User, RefreshCw, Loader2 } from "lucide-react";

// --- KONFIGURACIJA SUPABASE ---
const SUPABASE_URL = "https://dsltpiupbfopyvuiqffg.supabase.co";
const SUPABASE_ANON_KEY = "OVDJE_ZALIJEPI_TVOJ_ANON_KEY_IZ_SUPABASE_DASHBOARDA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- IMENA VOZAČA ---
const DRIVER_MAPPING = {
  8640: "Arnes Hokić",
  8620: "Denis Frelih",
  8610: "Eldin Begić",
  8630: "Katarina Begić"
};

// --- POSTAVKE PDF-a ---
const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30-12:00";
const WORK_HOURS = 8;
const NOTE_WORK = "Ladezeit 3 Std./Tag";
const NOTE_VACATION = "URLAUB";

export default function WorktimeTab() {
  // State
  const [selectedDriverId, setSelectedDriverId] = useState("8640");
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);
  
  // Podaci iz baze
  const [deliveries, setDeliveries] = useState([]);
  const [urlaubs, setUrlaubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const printRef = useRef(null);

  // --- FETCH DATA (Dohvatanje iz Supabase) ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Kreiramo datumski opseg za filter (od 1. do zadnjeg u mjesecu)
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      try {
        // 1. Dohvati Dostave (Provjeri da li se tabela zove 'deliveries_rows' ili samo 'deliveries')
        const { data: delData, error: delError } = await supabase
          .from('deliveries_rows') 
          .select('date, driver, zustellung_paketi')
          .eq('driver', selectedDriverId)
          .gte('date', startDate)
          .lte('date', endDate);

        if (delError) console.error("Greška deliveries:", delError);

        // 2. Dohvati Godišnje (Provjeri ime tabele 'urlaub_marks_rows')
        const { data: urlData, error: urlError } = await supabase
          .from('urlaub_marks_rows')
          .select('date, driver, is_active')
          .eq('driver', selectedDriverId)
          .gte('date', startDate)
          .lte('date', endDate)
          .is('is_active', true); // Filtriraj samo aktivne

        if (urlError) console.error("Greška urlaub:", urlError);

        setDeliveries(delData || []);
        setUrlaubs(urlData || []);

      } catch (err) {
        console.error("Neočekivana greška:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedDriverId, month, year]); // Ponovi kad se promijeni vozač ili datum

  // --- OBRADA PODATAKA ZA TABELU ---
  const rows = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const targetMonthStr = `${year}-${String(month).padStart(2, "0")}`;

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${targetMonthStr}-${String(day).padStart(2, "0")}`;

      // Provjera podataka iz baze
      const isUrlaub = urlaubs.some(u => u.date === dateStr);
      const delivery = deliveries.find(d => d.date === dateStr);
      const packageCount = delivery ? Number(delivery.zustellung_paketi) : 0;

      let row = {
        day,
        start: "", end: "", pause: "", hours: "", note: "", 
        isWork: false
      };

      if (isUrlaub) {
        row.hours = "0";
        row.note = NOTE_VACATION;
      } 
      else if (packageCount > 0) {
        row.start = WORK_START;
        row.end = WORK_END;
        row.pause = BREAK_TIME;
        row.hours = WORK_HOURS;
        row.note = NOTE_WORK;
        row.isWork = true;
      }

      return row;
    });
  }, [deliveries, urlaubs, month, year]);

  const totalHours = rows.reduce((sum, r) => (r.isWork ? sum + 8 : sum), 0);
  const driverName = DRIVER_MAPPING[selectedDriverId] || selectedDriverId;

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* --- MENU BAR --- */}
      <div className="w-full max-w-[210mm] bg-white p-4 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-4 items-center justify-between no-print">
        
        <div className="flex gap-4 items-center flex-wrap">
          {/* Odabir Vozača */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Vozač</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-gray-400" />
              <select 
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="pl-9 pr-8 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium min-w-[180px]"
              >
                {Object.entries(DRIVER_MAPPING).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
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
          
          {/* Status Loading */}
          {loading && (
            <div className="flex items-center text-blue-600 text-sm font-semibold animate-pulse">
                <Loader2 size={18} className="animate-spin mr-2"/> Učitavam...
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer size={20} />
          Printaj PDF
        </button>
      </div>

      {/* --- PDF PREVIEW --- */}
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
            <strong>Nachname und Vorname:</strong> {driverName}
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
