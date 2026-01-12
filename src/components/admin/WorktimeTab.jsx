import React, { useState, useEffect, useMemo } from "react";
import {
  supabase,
  getAllDriversCloud,
  getDeliveriesByDriverCloud
} from "../../db/supabaseClient";

/* VOZAČI – ORIGINAL */
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
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(2026);
  const [workData, setWorkData] = useState([]);
  const [urlaubData, setUrlaubData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* LOAD DRIVERS */
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllDriversCloud();
        setDrivers(data || []);
      } catch {
        setDrivers([]);
      }
    })();
  }, []);

  /* LOAD DATA */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const deliveries = await getDeliveriesByDriverCloud(driver, year, month);
        setWorkData(deliveries || []);

        const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const end = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(
          year,
          month + 1,
          0
        ).getDate()}`;

        const { data: urlaub } = await supabase
          .from("urlaub_marks")
          .select("date")
          .eq("driver", driver)
          .gte("date", start)
          .lte("date", end)
          .eq("is_active", true);

        setUrlaubData(urlaub || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [driver, month, year]);

  const currentDriverName = PREFERRED_NAMES[driver] || driver;

  /* ROWS */
  const { rows, totalHours } = useMemo(() => {
    let sum = 0;
    const days = new Date(year, month + 1, 0).getDate();

    const result = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const isUrlaub = urlaubData.some(u => u.date === dateStr);
      const delivery = workData.find(d => d.date === dateStr);

      if (isUrlaub) {
        return { day, start:"-", end:"-", pause:"-", hours:"0", note:"URLAUB", isUrlaub:true };
      }

      if (delivery && Number(delivery.paketi) > 0) {
        sum += WORK_HOURS;
        return { day, start:WORK_START, end:WORK_END, pause:BREAK_TIME, hours:WORK_HOURS, note:"Ladezeit 3 Std./Tag", isUrlaub:false };
      }

      return { day, start:"-", end:"-", pause:"-", hours:"-", note:"-", isUrlaub:false };
    });

    return { rows: result, totalHours: sum };
  }, [workData, urlaubData, month, year]);

  /* PDF */
  const generatePDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      doc.setFont("helvetica");
      doc.setFontSize(14).setFont("helvetica","bold");
      doc.text("Arbeitszeitaufzeichnungen",105,20,{align:"center"});

      doc.setFontSize(10).setFont("helvetica","normal");
      doc.text("Nachname und Vorname:",14,30);
      doc.setFont("helvetica","bold");
      doc.text(currentDriverName,60,30);

      doc.setFont("helvetica","normal");
      doc.text("Monat und Jahr:",135,30);
      doc.setFont("helvetica","bold");
      doc.text(`${String(month+1).padStart(2,"0")}/${year}`,170,30);

      const headers=["Tag","Arbeitsbeginn","Arbeitsende","Pause","Std.","Notizen"];
      const widths=[10,28,28,38,26,52];
      let x=14, y=36, h=6.8;

      headers.forEach((t,i)=>{
        doc.rect(x,y,widths[i],h);
        doc.text(t,x+widths[i]/2,y+4.5,{align:"center"});
        x+=widths[i];
      });

      y+=h;

      rows.forEach(r=>{
        let cx=14;
        const vals=[r.day,r.start,r.end,r.pause,r.hours,r.note];
        vals.forEach((v,i)=>{
          doc.rect(cx,y,widths[i],h);
          if(r.isUrlaub && i===5) doc.setTextColor(200,0,0);
          else doc.setTextColor(0,0,0);
          doc.text(String(v), i===0?cx+2:cx+widths[i]/2, y+4.5, {align:i===0?"left":"center"});
          cx+=widths[i];
        });
        y+=h;
      });

      doc.setTextColor(0);
      doc.setFont("helvetica","bold");
      doc.text(`Gesamtarbeitszeit: ${totalHours} Stunden`,14,y+8);

      const signY=y+30;
      doc.line(20,signY,85,signY);
      doc.text("Unterschrift Fahrer",52,signY+6,{align:"center"});
      doc.line(120,signY,185,signY);
      doc.text("Unterschrift Firma",152,signY+6,{align:"center"});

      doc.save(`Arbeitszeit_${currentDriverName}_${month+1}_${year}.pdf`);
    } catch (e) {
      alert("PDF nije moguće generisati u ovom režimu");
      console.error(e);
    }
  };

  return (
    <div className="p-6 bg-[#0f172a] min-h-screen text-white">
      {/* CONTROL PANEL */}
      <div className="bg-[#111827] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select value={driver} onChange={e=>setDriver(e.target.value)} className="p-3 rounded bg-[#1f2937]">
            {Object.entries(PREFERRED_NAMES).map(([id,name])=>(
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <select value={month} onChange={e=>setMonth(+e.target.value)} className="p-3 rounded bg-[#1f2937]">
            {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>

          <select value={year} onChange={e=>setYear(+e.target.value)} className="p-3 rounded bg-[#1f2937]">
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex gap-4">
          <button onClick={generatePDF} className="flex-1 bg-blue-600 rounded-lg py-3 font-bold">
            Download PDF
          </button>
          <button
            onClick={()=>{
              try { window.print(); }
              catch { alert("Print nije podržan u PWA režimu"); }
            }}
            className="flex-1 bg-gray-600 rounded-lg py-3 font-bold"
          >
            Print
          </button>
        </div>
      </div>

      {loading && <div>Učitavanje…</div>}

      {/* PREVIEW */}
      <div className="bg-white text-black max-w-[800px] mx-auto p-6 rounded-lg shadow">
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
                <td className="border px-1">{r.day}</td>
                <td className="border text-center">{r.start}</td>
                <td className="border text-center">{r.end}</td>
                <td className="border text-center">{r.pause}</td>
                <td className="border text-center">{r.hours}</td>
                <td className={`border text-center ${r.isUrlaub?"text-red-600 font-bold":""}`}>
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-10 flex justify-between text-sm">
          <div className="w-1/3 text-center border-t pt-2">Unterschrift Fahrer</div>
          <div className="w-1/3 text-center border-t pt-2">Unterschrift Firma</div>
        </div>
      </div>
    </div>
  );
}
