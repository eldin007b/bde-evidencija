import React from 'react';

export default function DriverHeader({ driver, onLogout, onNameClick }) {
  if (!driver) return null;
  
  const handleNameClick = () => {
    if (driver.tura === '8610' && onNameClick) {
      onNameClick();
    }
  };

  return (
    <header className="driver-header">
      <div className="driver-header-content">
        <span 
          className={`driver-header-name ${driver.tura === '8610' ? 'clickable' : ''}`} 
          data-tooltip={driver.tura === '8610' ? "Kliknite za admin pristup" : "Vaš profil i tura"}
          onClick={handleNameClick}
        >
          {driver.ime || driver.name} <span className="driver-header-tour">({driver.tura || driver.tour})</span>
        </span>
        <button className="driver-header-logout" data-tooltip="Odjava sa naloga" onClick={onLogout}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10H15M15 10L12 7M15 10L12 13" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="3" width="8" height="14" rx="2" stroke="#1E40AF" strokeWidth="2"/>
          </svg>
          Odjava
        </button>
      </div>
    </header>
  );
}
