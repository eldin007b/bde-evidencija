import React, { useMemo, useRef } from "react";
import { Printer } from "lucide-react";

/*
  ❗ NEMA html2pdf
  ❗ NEMA tesseract
  ✔ 100% build-safe

  PDF = window.print() → Save as PDF
*/

const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30–12:00";
const WORK_HOURS = 8;
const LADEZEIT = 3;

export default function WorktimeTab({
  driverName = "Arnes",
  month = 12,
  year = 2025,
  deliveries = [] // ISTI PODACI kao Pregled Dostava
}) {
  const printRef = useRef(null);
  const daysInMonth = new Date(year, month, 0).getDate();

  const rows = useMemo(() => {
    const map = {};
    deliveries.forEach(d => {
      const day = Number(d.date.split("-")[2]);
      map[day] = d.value;
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const value = map[day];

      if (value === "Urlaub") {
        return {
          day,
          status: "URLAUB",
          start: "-",
          pause: "-",
          end: "-",
          hours: "-",
          ladezeit: "-"
        };
      }

      if (typeof value === "number" && value > 0) {
        return {
          day,
          status: "RAD",
          start: WORK_START,
          pause: BREAK_TIME,
          end: WORK_END,
          hours: WORK_HOURS,
          ladezeit: LADEZEIT
        };
      }

      return {
        day,
        status: "—",
        start: "-",
        pause: "-",
        end: "-",
        hours: "-",
        ladezeit: "-"
      };
    });
  }, [deliveries, daysInMonth]);

  const totalHours = rows.reduce(
    (sum, r) => (r.hours === 8 ? sum + 8 : sum),
    0
  );

  return (
    <div className="space-y-6">
      {/* ACTION BAR */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          <Printer size={18} />
          Print / Save PDF
        </button>
      </div>

      {/* PRINT AREA */}
      <div
        ref={printRef}
        className="bg-white text-black p-6 rounded-xl shadow print:shadow-none print:p-0"
      >
        <h1 className="text-xl font-bold mb-2">
          Arbeitszeitaufzeichnung
        </h1>

        <p className="mb-4 text-sm">
          <strong>Mitarbeiter:</strong> {driverName}<br />
          <strong>Monat:</strong> {String(month).padStart(2, "0")}/{year}
        </p>

        <table className="w-full border border-black border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Tag</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Beginn</th>
              <th className="border p-2">Pause</th>
              <th className="border p-2">Ende</th>
              <th className="border p-2">Stunden</th>
              <th className="border p-2">Ladezeit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.day}>
                <td className="border p-2 text-center">{r.day}</td>
                <td className="border p-2 text-center">{r.status}</td>
                <td className="border p-2 text-center">{r.start}</td>
                <td className="border p-2 text-center">{r.pause}</td>
                <td className="border p-2 text-center">{r.end}</td>
                <td className="border p-2 text-center">{r.hours}</td>
                <td className="border p-2 text-center">{r.ladezeit}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 font-semibold">
          Gesamtarbeitszeit: {totalHours} Stunden
        </div>

        <div className="mt-10 flex justify-between text-sm">
          <div>
            ___________________________<br />
            Unterschrift Mitarbeiter
          </div>
          <div>
            ___________________________<br />
            Unterschrift Firma
          </div>
        </div>
      </div>
    </div>
  );
}
