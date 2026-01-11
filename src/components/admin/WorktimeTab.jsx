import React, { useState } from 'react';
import styles from '../../screens/AdminPanelScreen.module.css';
import { supabase } from '../../db/supabaseClient';
import useDrivers from '../../hooks/useDrivers';

export default function WorktimeTab() {
  const { drivers } = useDrivers();

  const [driverId, setDriverId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const generateWorktime = async () => {
    if (!driverId) return alert('Izaberi vozača');

    setLoading(true);

    // OVDJE kasnije vežemo dostave / Urlaub logiku
    // Za sada demo-logika (RAD / URLAUB)
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;

      data.push({
        day,
        status: isWeekend ? '—' : 'RAD',
        start: isWeekend ? '-' : '05:30',
        pause: isWeekend ? '-' : '11:30–12:00',
        end: isWeekend ? '-' : '14:00',
        hours: isWeekend ? '-' : '8',
        ladezeit: isWeekend ? '-' : '3'
      });
    }

    setRows(data);
    setLoading(false);
  };

  return (
    <div className={styles.card}>
      <h2>🕒 Evidencija rada vozača</h2>

      {/* FILTERI */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={driverId} onChange={e => setDriverId(e.target.value)}>
          <option value="">— Vozač —</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>
              {d.ime}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={month}
          min="1"
          max="12"
          onChange={e => setMonth(Number(e.target.value))}
          placeholder="Mjesec"
        />

        <input
          type="number"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          placeholder="Godina"
        />

        <button onClick={generateWorktime}>
          ⚙️ Generiši evidenciju
        </button>
      </div>

      {/* TABELA */}
      {loading && <div>⏳ Generišem...</div>}

      {!loading && rows.length > 0 && (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Dan</th>
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
              <tr key={r.day}>
                <td>{r.day}</td>
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
      )}
    </div>
  );
}
