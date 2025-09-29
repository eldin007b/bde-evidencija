import React from 'react';
import './AdminPanel.css';

export default function AdminPanel({ isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel-container">
        <div className="admin-panel-header">
          <h2>Admin Panel</h2>
          <button className="admin-panel-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-panel-content">
          <div className="admin-panel-section">
            <h3>Upravljanje korisnicima</h3>
            <button className="admin-btn">Pregled korisnika</button>
            <button className="admin-btn">Dodaj korisnika</button>
          </div>
          <div className="admin-panel-section">
            <h3>Izvještaji</h3>
            <button className="admin-btn">Detaljni izvještaji</button>
            <button className="admin-btn">Export podataka</button>
          </div>
          <div className="admin-panel-section">
            <h3>Sistemske postavke</h3>
            <button className="admin-btn">Backup baze</button>
            <button className="admin-btn">Čišćenje cache-a</button>
          </div>
        </div>
      </div>
    </div>
  );
}