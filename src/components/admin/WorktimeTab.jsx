import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import useDrivers from '../../hooks/useDrivers';

export default function WorktimeTab() {
  const { drivers } = useDrivers();

  const [driverId, setDriverId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);

  const generate = () => {
    if (!driverId) return alert('Izaberi vozača');

    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      data.push({
        day: d,
        status: isWeekend ? '—' : 'RAD',
        start: isWeekend ? '-' : '05:30',
        pause: isWeekend ? '-' : '11:30–12:00',
        end: isWeekend ? '-' : '14:00',
        hours: isWeekend ? '-' : '8',
        ladezeit: isWeekend ? '-' : '3'
      });
    }

    setRows(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Evidencija rada</h2>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select className="px-3 py-2 rounded-lg bg-gray-800 text-white" value={driverId} onChange={e => setDriverId(e.target.value)}>
          <option value="">— Vozač —</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.ime}</option>
          ))}
        </select>

        <input type="number" className="px-3 py-2 rounded-lg bg-gray-800 text-white w-24" value={month} min="1" max="12" onChange={e => setMonth(+e.target.value)} />
        <input type="number" className="px-3 py-2 rounded-lg bg-gray-800 text-white w-28" value={year} onChange={e => setYear(+e.target.value)} />

        <button onClick={generate} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          Generiši
        </button>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-white">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-3 py-2">Dan</th>
                <th>Status</th>
                <th>Početak</th>
                <th>Pauza</th>
                <th>Kraj</th>
                <th>Sati</th>
                <th>Ladezeit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.day} className="border-b border-gray-700">
                  <td className="px-3 py-2">{r.day}</td>
                  <td>{r.status}</td>
                  <td>{r.start}</td>
                  <td>{r.pause}</td>
                  <td>{r.end}</td>
                  <td>{r.hours}</td>
                  <td>{r.ladezeit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
