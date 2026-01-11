import React, { useState, useEffect, useMemo } from "react";
import { Printer, User, Loader2, Download } from "lucide-react";
// Import biblioteka za generisanje PDF-a (Ista tehnologija kao InvoicesTab)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  // 3. Priprema podataka (Rows)
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
      }
      return row;
    });

    return { rows: calculatedRows, totalHours: sumHours };
  }, [workData, urlaubData, month, year]);

  const dbDriver = drivers.find(d => d.tura == selectedDriverTura);
  const currentDriverName = PREFERRED_NAMES[selectedDriverTura] || (dbDriver ? (dbDriver.ime || dbDriver.name) : selectedDriverTura);

  // --- GLAVNA FUNKCIJA: GENERISANJE PDF-a (jsPDF) ---
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Zaglavlje
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Arbeitszeitaufzeichnungen", 105, 15, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    // Lijevo: Ime
    doc.text(`Nachname und Vorname: ${currentDriverName}`, 14, 30);
    // Desno: Datum
    doc.text(`Monat und Jahr: ${String(month).padStart(2, "0")}/${year}`, 196, 30, { align: "right" });

    // 2. Tabela (koristeći autoTable)
    const tableBody = rows.map(r => [
      r.day,
      r.start,
      r.end,
      r.pause,
      r.hours,
      r.note
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Tag', 'Arbeitsbeginn', 'Arbeitsende', 'Pause (von - bis)', 'Tagesarb.', 'Notizen']],
      body: tableBody,
      theme: 'grid', // Izgled mreže
      styles: {
        fontSize: 10,
        cellPadding: 1, // Usko da stane
        halign: 'center', // Centriran tekst svuda
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [0, 0, 0] // Crne linije
      },
      headStyles: {
        fillColor: [240, 240, 240], // Svijetlo sivo zaglavlje
        textColor: [0, 0, 0], // Crni tekst
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 10 }, // Tag
        1: { cellWidth: 30 }, // Start
        2: { cellWidth: 30 }, // End
        3: { cellWidth: 35 }, // Pause
        4: { cellWidth: 25 }, // Sati
        5: { cellWidth: 'auto' } // Notizen (ostatak)
      },
      // Kuka za bojenje teksta u crveno ako je URLAUB
      didParseCell: function (data) {
        if (data.section === 'body') {
           // Ako red ima notu "URLAUB", oboji tekst u crveno
           const currentRow = rows[data.row.index];
           if (currentRow && currentRow.isUrlaub) {
             data.cell.styles.textColor = [220, 0, 0]; // Crvena boja
             data.cell.styles.fontStyle = 'bold';
           }
        }
      }
    });

    // 3. Footer (Ukupno sati i Potpisi)
    const finalY = doc.lastAutoTable.finalY + 10; // Pozicija ispod tabele
    
    doc.setFont("helvetica", "bold");
    doc.text(`Gesamtarbeitszeit: ${totalHours} Stunden`, 14, finalY);

    // Linije za potpis
    const signY = finalY + 25;
    doc.setLineWidth(0.5);
    
    // Lijeva linija
    doc.line(14, signY, 80, signY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Unterschrift Fahrer", 47, signY + 5, { align: "center" });

    // Desna linija
    doc.line(130, signY, 196, signY);
    doc.text("Unterschrift Firma", 163, signY + 5, { align: "center" });

    // 4. Otvori PDF (Save ili Open u novom tabu)
    // Ovo otvara PDF direktno korisniku, identično kao Print preview
    doc.save(`Arbeitszeit_${currentDriverName}_${month}_${year}.pdf`);
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 font-sans">
      
      {/* --- MENU --- */}
      <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-sm mb-6 border border-blue-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-wrap">
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

        {/* --- DUGME ZA GENERISANJE PDF-a --- */}
        <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
        >
            <Printer size={20} />
            Print / Download PDF
        </button>
      </div>

      {/* --- PREVIEW NA EKRANU (Samo za gledanje, nije za printanje) --- */}
      <div className="bg-white text-black w-full max-w-[210mm] shadow-2xl p-8 mx-auto hidden md:block">
        <div className="opacity-50 text-center mb-4 text-xs uppercase tracking-widest text-gray-400">Preview (Klikni dugme iznad za PDF)</div>
        
        <h1 className="text-xl font-bold mb-4 text-center uppercase border-b-0 pt-2">
          Arbeitszeitaufzeichnungen
        </h1>

        <div className="flex justify-between items-end mb-4 px-1 text-sm">
            <div><strong>Nachname und Vorname:</strong> {currentDriverName}</div>
            <div><strong>Monat und Jahr:</strong> {String(month).padStart(2, "0")}/{year}</div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-center text-xs">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border p-1">Tag</th>
                    <th className="border p-1">Arbeitsbeginn</th>
                    <th className="border p-1">Arbeitsende</th>
                    <th className="border p-1">Pause</th>
                    <th className="border p-1">Tagesarb.</th>
                    <th className="border p-1">Notizen</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr key={r.day} className={r.isUrlaub ? 'text-red-600 font-bold' : ''}>
                        <td className="border p-1 text-black">{r.day}</td>
                        <td className="border p-1">{r.start}</td>
                        <td className="border p-1">{r.end}</td>
                        <td className="border p-1">{r.pause}</td>
                        <td className="border p-1 text-black">{r.hours}</td>
                        <td className="border p-1">{r.note}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
