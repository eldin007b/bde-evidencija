import React from 'react';

export default function MonthFilters({ month, setMonth, year, setYear, months, onExport }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ display: 'none' }} htmlFor="month-select">Mjesec</label>
      <select id="month-select" value={month} onChange={e => setMonth(Number(e.target.value))} aria-label="Odaberi mjesec">
        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
      </select>

      <label style={{ display: 'none' }} htmlFor="year-select">Godina</label>
      <select id="year-select" value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Odaberi godinu">
        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      {onExport && <button onClick={onExport} aria-label="Export CSV">Export</button>}
    </div>
  );
}
