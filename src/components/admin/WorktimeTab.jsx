import React, { useState } from 'react';
import styles from '../../screens/AdminPanelScreen.module.css';
import useDrivers from '../../hooks/useDrivers';

export default function WorktimeTab() {
  const { drivers } = useDrivers();

  const [driverId, setDriverId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateWorktime = () => {
    if (!driverId) {
      alert('Izaberi vozača');
      return;
    }

    setLoading(true);

    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

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

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select value={driverId} onChange={e => setDriverId(e.target.value)}>
          <option value="">— Vozač —</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>
              {d.ime}
            </option>
          ))}
        </select>

        <input type="number" min="1" max="12" value={month} onChange={e => setMonth(Number(e.target.value))} />
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />

        <button onClick={generateWorktime}>
          ⚙️ Generiši evidenciju
        </button>
      </div>

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
