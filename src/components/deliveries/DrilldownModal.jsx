import React from 'react';
import ModernModal from '../../components/common/ModernModal';

export default function DrilldownModal({ open, onClose, date, driverName, records = [] }) {
  if (!open) return null;
  return (
    <ModernModal onClose={onClose}>
      <div style={{ padding: 16 }}>
        <h3>Detalji za {driverName} - {date}</h3>
        {records.length === 0 ? (
          <div>Nema podataka</div>
        ) : (
          <ul>
            {records.map((r, i) => <li key={i}>{r.desc || JSON.stringify(r)}</li>)}
          </ul>
        )}
        <div style={{ marginTop: 12 }}>
          <button onClick={onClose}>Zatvori</button>
        </div>
      </div>
    </ModernModal>
  );
}
