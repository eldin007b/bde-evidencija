import React, { useState, useEffect, useMemo } from "react";
import {
  supabase,
  getAllDriversCloud
} from "../../db/supabaseClient";

/* VOZAČI */
const PREFERRED_NAMES = {
  8640: "Arnes Hokic",
  8620: "Denis Frelih",
  8610: "Eldin Begić",
  8630: "Katarina Begić"
};

const MONTHS = [
  "Januar","Februar","Mart","April","Maj","Juni",
  "Juli","Avgust","Septembar","Oktobar","Novembar","Decembar"
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30 - 12:00";
const WORK_HOURS = 8;

export default function WorktimeTab() {
  const [drivers, setDrivers] = useState([]);
  const [driver, setDriver] = useState("8640");
  const [month, setMonth] = useState(10); // 0-based UI
  const [year, setYear] = useState(2025);
  const [deliveries, setDeliveries] = useState([]);
  const [urlaub, setUrlaub] = useState([]);
  const [loading, setLoading] = useState(false);

  /* LOAD DRIVERS */
  useEffect(() => {
    getAllDriversCloud().then(setDrivers).catch(() => setDrivers([]));
  }, []);

  /* LOAD DELIVERIES + URLAUB */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const to = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(
          year,
          month + 1,
          0
        ).getDate()}`;

        // DELIVERIES — DATE JE DATE (NE STRING)
        const { data: d } = await supabase
          .from("deliveries")
          .select("date")
          .eq("driver", driver)
          .eq("deleted", 0)
          .gte("date", from)
          .lte("date", to);

        setDeliveries(d || []);

        // URLAUB
        const { data: u } = await supabase
          .from("urlaub_marks")
          .select("date")
          .eq("driver", driver)
          .eq("is_active", true)
          .gte("date", from)
          .lte("date", to);

        setUrlaub(u || []);
      } catch (e) {
        console.error("Load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [driver, month, year]);

  /* PREP MAPS */
  const deliveryDays = useMemo(() => {
    const set = new Set();
    deliveries.forEach(d => set.add(d.date));
    return set;
  }, [deliveries]);

  const urlaubDays = useMemo(() => {
    const set = new Set();
    urlaub.forEach(u => set.add(u.date));
    return set;
  }, [urlaub]);

  /* ROWS */
  const { rows, totalHours } = useMemo(() => {
    let sum = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // URLAUB IMA PRIORITET
      if (urlaubDays.has(date)) {
        return {
          day,
          start: "-",
          end: "-",
          pause: "-",
          hours: "0",
          note: "URLAUB",
          isUrlaub: true
        };
      }

      // AKO POSTOJI DELIVERY RED → RADIO
      if (deliveryDays.has(date)) {
        sum += WORK_HOURS;
        return {
          day,
          start: WORK_START,
          end: WORK_END,
          pause: BREAK_TIME,
          hours: WORK_HOURS,
          note: "Ladezeit 3 Std./Tag",
          isUrlaub: false
        };
      }

      // INAČE PRAZNO
      return {
        day,
        start: "-",
        end: "-",
        pause: "-",
        hours: "-",
        note: "-",
        isUrlaub: false
      };
    });

    return { rows: result, totalHours: sum };
  }, [deliveryDays, urlaubDays, month, year]);

  const currentDriverName = PREFERRED_NAMES[driver] || driver;

  /* UI */
  return (
    <div className="p-6 bg-[#0f172a] min-h-screen text-white">
      <div className="bg-[#111827] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select value={driver} onChange={e => setDriver(e.target.value)} className="p-3 rounded bg-[#1f2937]">
            {Object.entries(PREFERRED_NAMES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <select value={month} onChange={e => setMonth(+e.target.value)} className="p-3 rounded bg-[#1f2937]">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          <select value={year} onChange={e => setYear(+e.target.value)} className="p-3 rounded bg-[#1f2937]">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading && <div>Učitavanje…</div>}

      <div className="bg-white text-black max-w-[800px] mx-auto p-6 rounded-lg shadow">
        <h2 className="text-center font-bold mb-4">Arbeitszeitaufzeichnungen</h2>

        <table className="w-full border-collapse border text-xs">
          <thead>
            <tr>
              {["Tag","Arbeitsbeginn","Arbeitsende","Pause","Std.","Notizen"].map(h => (
                <th key={h} className="border h-6 text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.day}>
                <td className="border px-1">{r.day}</td>
                <td className="border text-center">{r.start}</td>
                <td className="border text-center">{r.end}</td>
                <td className="border text-center">{r.pause}</td>
                <td className="border text-center">{r.hours}</td>
                <td className={`border text-center ${r.isUrlaub ? "text-red-600 font-bold" : ""}`}>
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 font-bold">
          Gesamtarbeitszeit: {totalHours} Stunden
        </div>
      </div>
    </div>
  );
}
