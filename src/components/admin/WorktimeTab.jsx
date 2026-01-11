import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';

/**
 * OČEKIVANI FORMAT deliveries:
 * [
 *   { date: '2025-12-01', arnes: 94, denis: 93, ... },
 *   { date: '2025-12-24', arnes: 'Urlaub', ... },
 *   { date: '2025-12-19', arnes: '-', ... }
 * ]
 */

function mapDeliveryToWorkday(value) {
  if (value === 'Urlaub') {
    return {
      status: 'URLAUB',
      start: '—',
      pause: '—',
      end: '—',
      hours: '—',
      ladezeit: '—'
    };
  }

  if (typeof value === 'number') {
    return {
      status: 'RAD',
      start: '05:30',
      pause: '11:30–12:00',
      end: '14:00',
      hours: 8,
      ladezeit: 3
    };
  }

  return {
    status: '—',
    start: '—',
    pause: '—',
    end: '—',
    hours: '—',
    ladezeit: '—'
  };
}

export default function WorktimeTab({ deliveries }) {
  const [driver, setDriver] = useState('arnes');
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);

  const filteredDays = useMemo(() => {
    return deliveries
      .filter(row => {
        const d = new Date(row.date);
        return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
      })
      .map(row => {
        const day = new Date(row.date).getDate();
        const value = row[driver];
        return {
          day,
          ...mapDeliveryToWorkday(value)
        };
      });
  }, [deliveries, driver, month, year]);

  const totalHours = filteredDays.reduce(
    (sum, d) => sum + (typeof d.hours === 'number' ? d.hours : 0),
    0
  );

  const printPdf = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl p-6 print:p-0 print:rounded-none">
      <style>{`
        @media print {
          body {
            background: white;
          }
          button, select {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Arbeitszeitaufzeichnungen</h2>
        <button
          onClick={printPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          <Printer size={18} />
          Print / PDF
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={driver} onChange={e => setDriver(e.target.value)} className="border rounded px-3 py-2">
          <option value="arnes">Arnes</option>
          <option value="denis">Denis</option>
        </select>

        <select value={month} onChange={e => setMonth(e.target.value)} className="border rounded px-3 py-2">
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
          ))}
        </select>

        <select value={year} onChange={e => setYear(e.target.value)} className="border rounded px-3 py-2">
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <table className="w-full border border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Tag</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Arbeitsbeginn</th>
            <th className="border p-2">Pause</th>
            <th className="border p-2">Arbeitsende</th>
            <th className="border p-2">Stunden</th>
            <th className="border p-2">Ladezeit</th>
          </tr>
        </thead>
        <tbody>
          {filteredDays.map(d => (
            <tr key={d.day}>
              <td className="border p-2 text-center">{d.day}</td>
              <td className="border p-2">{d.status}</td>
              <td className="border p-2">{d.start}</td>
              <td className="border p-2">{d.pause}</td>
              <td className="border p-2">{d.end}</td>
              <td className="border p-2 text-center">{d.hours}</td>
              <td className="border p-2 text-center">{d.ladezeit}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td colSpan={5} className="border p-2 text-right">Gesamtstunden</td>
            <td className="border p-2 text-center">{totalHours}</td>
            <td className="border p-2"></td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-10 flex justify-between text-sm">
        <div>
          <div>__________________________</div>
          <div>Unterschrift Fahrer</div>
        </div>
        <div>
          <div>__________________________</div>
          <div>Unterschrift Firma</div>
        </div>
      </div>
    </div>
  );
}
