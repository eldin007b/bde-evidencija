import React, { useState } from 'react';
import './DriverInitScreen-styles.css';

/**
 * DriverInitScreen - Prvi ekran gdje vozač unosi svoju turu
 */
function DriverInitScreen({ onDriverSelected, loading }) {
  const [tura, setTura] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!tura.trim()) {
      setError('Molimo unesite vašu turu');
      return;
    }

    if (tura.trim().length < 3) {
      setError('Tura mora imati najmanje 3 karaktera');
      return;
    }

    setError(null);
    onDriverSelected(tura.trim().toUpperCase());
  };

  return (
    <div className="driver-init-screen">
      <div className="init-container">
        {/* Modern Header */}
        <div className="init-header">
          <div className="header-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h1>Dobrodošli!</h1>
          <p>Molimo unesite vašu turu za pristup aplikaciji</p>
        </div>

        {/* Modern Form */}
        <form onSubmit={handleSubmit} className="init-form">
          <div className="input-group">
            <label htmlFor="tura">Vaša tura</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="tura"
                value={tura}
                onChange={(e) => setTura(e.target.value)}
                placeholder="npr. 8610"
                maxLength="10"
                disabled={loading}
                autoFocus
              />
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <path d="m20 8 2 2-2 2"></path>
                  <path d="m16 12-2-2 2-2"></path>
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !tura.trim()}
          >
            <span className="btn-content">
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Provjeram...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  Nastavi
                </>
              )}
            </span>
          </button>
        </form>

        {/* Modern Footer */}
        <div className="init-footer">
          <div className="footer-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
            </svg>
          </div>
          <p>B&D Evidencija • Aplikacija za evidenciju vožnji</p>
          <div className="version-badge">v4.0.0</div>
        </div>
      </div>
    </div>
  );
}

export default DriverInitScreen;