import React, { useMemo, useRef } from "react";
import { Printer } from "lucide-react";

/*
  KONFIGURACIJA VREMENA PREMA PDF-u
*/
const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30-12:00";
const WORK_HOURS = 8; 
const NOTE_WORK = "Ladezeit 3 Std./Tag";
const NOTE_VACATION = "URLAUB";

export default function WorktimeTab({
  driverName = "Arnes Hokić", // Možeš promijeniti u "Denis Frelih"
  month = 12,
  year = 2025,
  deliveries = [] // Ovdje ubacuješ podatke (vidi dno odgovora za JSON)
}) {
  const printRef = useRef(null);
  const daysInMonth = new Date(year, month, 0).getDate(); // 31 za Decembar

  // Obrada podataka (Rows)
  const rows = useMemo(() => {
    // Mapiramo podatke po danu radi lakšeg pristupa
    const map = {};
    deliveries.forEach((d) => {
      // Pretpostavka: d.date je "YYYY-MM-DD" ili samo dan
      // Ako format u JSON-u bude "2025-12-01", splitujemo. 
      // Ako šalješ samo dan (npr 1), onda koristi d.day
      let dayNum;
      if (d.date && d.date.includes("-")) {
        dayNum = Number(d.date.split("-")[2]);
      } else {
        dayNum = d.day;
      }
      map[dayNum] = d.value;
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const value = map[day];

      // LOGIKA:
      // 1. Ako je "Urlaub" -> Prazno vrijeme, 0 sati, Napomena URLAUB
      // 2. Ako je Broj (>0) -> 05:30-14:00, 8 sati, Napomena Ladezeit
      // 3. Ako nema podataka (vikend/prazno) -> Sve prazno

      if (value === "Urlaub" || value === "URLAUB") {
        return {
          day,
          start: "",
          end: "",
          pause: "",
          hours: "0",
          note: NOTE_VACATION,
          isWork: false
        };
      }

      // Provjera da li je broj (radni dan)
      if ((typeof value === "number" && value > 0) || (typeof value === "string" && !isNaN(value) && parseInt(value) > 0)) {
        return {
          day,
          start: WORK_START,
          end: WORK_END,
          pause: BREAK_TIME,
          hours: WORK_HOURS,
          note: NOTE_WORK,
          isWork: true
        };
      }

      // Inače (vikend ili nema unosa)
      return {
        day,
        start: "",
        end: "",
        pause: "",
        hours: "", // Prazno u PDF-u za vikende
        note: "",
        isWork: false
      };
    });
  }, [deliveries, daysInMonth]);

  // Računanje ukupnih sati (samo ako je radni dan tj. hours = 8)
  const totalHours = rows.reduce(
    (sum, r) => (r.isWork ? sum + 8 : sum),
    0
  );

  return (
    <div className="space-y-6 font-sans">
      {/* ACTION BAR (Ne vidi se na printu) */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md transition-all"
        >
          <Printer size={18} />
          Print / Save PDF
        </button>
      </div>

      {/* PRINT AREA - DIZAJN PREMA TVOM PDF-u */}
      <div
        ref={printRef}
        className="bg-white text-black p-8 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0 print:m-0 print:w-full"
        style={{ fontFamily: "Arial, sans-serif" }} 
      >
        {/* HEADER */}
        <h1 className="text-xl font-bold mb-6 text-left border-b-0">
          Arbeitszeitaufzeichnungen
        </h1>

        <div className="mb-6 text-sm leading-relaxed">
          <p>
            <strong>Nachname und Vorname:</strong> {driverName}
          </p>
          <p className="mt-1">
            <strong>Monat und Jahr:</strong> {String(month).padStart(2, "0")}/{year}
          </p>
        </div>

        {/* TABELA */}
        <table className="w-full border-collapse text-xs border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-center w-8">Tag</th>
              <th className="border border-black p-1 text-center">Arbeitsbeginn</th>
              <th className="border border-black p-1 text-center">Arbeitsende</th>
              <th className="border border-black p-1 text-center">Pause (von - bis)</th>
              <th className="border border-black p-1 text-center">Tagesarbeitszeit</th>
              <th className="border border-black p-1 text-left px-2">Notizen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} className="h-6">
                <td className="border border-black p-1 text-center">{r.day}</td>
                <td className="border border-black p-1 text-center">{r.start}</td>
                <td className="border border-black p-1 text-center">{r.end}</td>
                <td className="border border-black p-1 text-center">{r.pause}</td>
                <td className="border border-black p-1 text-center font-medium">
                  {r.hours}
                </td>
                <td className="border border-black p-1 text-left px-2 text-gray-700">
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER - UKUPNO I POTPISI */}
        <div className="mt-4 font-bold text-sm">
          Gesamtarbeitszeit: {totalHours} Stunden
        </div>

        <div className="mt-16 flex justify-between text-sm pr-10">
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
      
      {/* CSS ZA SAKRIVANJE GUMBA PRI PRINTANJU */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
