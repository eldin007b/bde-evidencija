import React, { useState, useEffect, useMemo } from "react";
import { Printer, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  supabase,
  getAllDriversCloud,
  getDeliveriesByDriverCloud
} from "../../db/supabaseClient";

/* IMENA VOZAČA – ORIGINAL */
const PREFERRED_NAMES = {
  8640: "Arnes Hokic",
  8620: "Denis Frelih",
  8610: "Eldin Begić",
  8630: "Katarina Begić"
};

/* KONFIG */
const WORK_START = "05:30";
const WORK_END = "14:00";
const BREAK_TIME = "11:30 - 12:00";
const WORK_HOURS = 8;

export default function WorktimeTab() {
  const [drivers, setDrivers] = useState([]);
  const [driver, setDriver] = useState("8640");
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);
  const [workData, setWorkData] = useState([]);
  const [urlaubData, setUrlaubData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* LOAD DRIVERS */
  useEffect(() => {
    getAllDriversCloud().then(setDrivers);
  }, []);

  /* LOAD DATA */
  useEffect(() => {
    async function load() {
      setLoading(true);

      const deliveries = await getDeliveriesByDriverCloud(driver, year, month - 1);
      setWorkData(deliveries || []);

      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

      const { data: urlaub } = await supabase
        .from("urlaub_marks")
        .select("date")
        .eq("driver", driver)
        .gte("date", start)
        .lte("date", end)
        .eq("is_active", true);

      setUrlaubData(urlaub || []);
      setLoading(false);
    }
    load();
  }, [driver, month, year]);

  const currentDriverName =
    PREFERRED_NAMES[driver] ||
    drivers.find(d => d.tura == driver)?.ime ||
    drivers.find(d => d.tura == driver)?.name ||
    driver;

  /* ROWS */
  const { rows, totalHours } = useMemo(() => {
    let sum = 0;
    const days = new Date(year, month, 0).getDate();

    const result = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const isUrlaub = urlaubData.some(u => u.date === dateStr);
      const delivery = workData.find(d => d.date === dateStr);

      if (isUrlaub) {
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

      if (delivery && Number(delivery.paketi) > 0) {
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
  }, [workData, urlaubData, month, year]);

  /* PDF */
  const generatePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFont("helvetica");

    doc.setFontSize(14).setFont("helvetica", "bold");
    doc.text("Arbeitszeitaufzeichnungen", 105, 20, { align: "center" });

    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text("Nachname und Vorname:", 14, 30);
    doc.setFont("helvetica", "bold");
    doc.text(currentDriverName, 60, 30);

    doc.setFont("helvetica", "normal");
    doc.text("Monat und Jahr:", 135, 30);
    doc.setFont("helvetica", "bold");
    doc.text(`${String(month).padStart(2, "0")}/${year}`, 170, 30);

    const headers = [
      "Tag",
      "Arbeitsbeginn",
      "Arbeitsende",
      "Pause (von - bis)",
      "Tagesarbeitszeit",
      "Notizen"
    ];
    const widths = [10, 28, 28, 38, 26, 52];
    const startY = 36;
    const rowH = 6.8;

    let x = 14;
    headers.forEach((h, i) => {
      doc.rect(x, startY, widths[i], rowH);
      doc.text(h, x + widths[i] / 2, startY + 4.5, { align: "center" });
      x += widths[i];
    });

    let y = startY + rowH;

    rows.forEach(r => {
      let cx = 14;
      const values = [r.day, r.start, r.end, r.pause, r.hours, r.note];

      values.forEach((val, i) => {
        doc.rect(cx, y, widths[i], rowH);

        if (r.isUrlaub && i === 5) {
          doc.setTextColor(200, 0, 0); // crveno samo URLAUB
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.text(
          String(val),
          i === 0 ? cx + 2 : cx + widths[i] / 2,
          y + 4.5,
          { align: i === 0 ? "left" : "center" }
        );
        cx += widths[i];
      });

      y += rowH;
    });

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Gesamtarbeitszeit: ${totalHours} Stunden`, 14, y + 8);

    const signY = y + 30;
    doc.line(20, signY, 85, signY);
    doc.text("Unterschrift Fahrer", 52, signY + 6, { align: "center" });
    doc.line(120, signY, 185, signY);
    doc.text("Unterschrift Firma", 152, signY + 6, { align: "center" });

    doc.save(`Arbeitszeit_${currentDriverName.replace(/ /g, "_")}_${month}_${year}.pdf`);
  };

  /* UI */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex gap-4 mb-4 items-end">
        <select value={driver} onChange={e => setDriver(e.target.value)} className="border p-2 rounded">
          {Object.entries(PREFERRED_NAMES).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <input type="number" value={month} onChange={e => setMonth(+e.target.value)} className="border p-2 w-20 rounded" />
        <input type="number" value={year} onChange={e => setYear(+e.target.value)} className="border p-2 w-24 rounded" />

        {loading && <Loader2 className="animate-spin" />}
        <button onClick={generatePDF} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded flex gap-2">
          <Printer /> Download PDF
        </button>
      </div>

      {/* PREVIEW */}
      <div
        className="bg-white max-w-[210mm] mx-auto p-[14mm] shadow"
        style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "9px" }}
      >
        <table className="w-full border-collapse border text-xs">
          <thead>
            <tr>
              {["Tag","Arbeitsbeginn","Arbeitsende","Pause","Std.","Notizen"].map(h=>(
                <th key={h} className="border h-6 text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.day}>
                <td className="border px-1 text-left">{r.day}</td>
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
      </div>
    </div>
  );
}w
