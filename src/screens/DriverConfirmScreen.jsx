import React, { useState } from 'react';
import './DriverConfirmScreen-styles.css';

/**
 * DriverConfirmScreen - Moderni ekran za potvrdu vozača prije login-a
 */
function DriverConfirmScreen({ driver, onContinue, onLogin, onBack, loading }) {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Molimo unesite lozinku');
      return;
    }

    setError(null);
    onLogin(driver.tura, password, rememberMe);
  };
  
  return (
    <div className="driver-confirm-screen">
      <div className="confirm-container">
        {/* Modern Header */}
        <div className="confirm-header">
          <div className="header-avatar">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h1>Vozač pronađen</h1>
          <p>Uspješno smo identificirali vaš profil</p>
        </div>

        {/* Modern Driver Card */}
        <div className="driver-card">
          <div className="driver-info">
            <h2>{driver.ime}</h2>
            <div className="driver-details">
              <div className="detail-item">
                <span className="detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="m20 8 2 2-2 2"></path>
                    <path d="m16 12-2-2 2-2"></path>
                  </svg>
                </span>
                <span>Tura: {driver.tura}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    <path d="m19.4 15-1.1-2.3c-.4-.8-1.2-1.3-2.1-1.3H7.8c-.9 0-1.7.5-2.1 1.3L4.6 15"/>
                    <path d="M12 8v7"/>
                  </svg>
                </span>
                <span>{driver.role === 'admin' ? 'Administrator' : 'Vozač'}</span>
              </div>
            </div>
          </div>

          <div className="status-indicator">
            {driver.hasPassword ? (
              <div className="status has-password">
                <span className="status-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <span>Već imate lozinku</span>
              </div>
            ) : (
              <div className="status no-password">
                <span className="status-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </svg>
                </span>
                <span>Potrebno je postaviti lozinku</span>
              </div>
            )}
          </div>
        </div>

        {driver.hasPassword ? (
          // Modern Login Form
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="password">Lozinka</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Unesite vašu lozinku"
                  disabled={loading}
                  autoFocus
                />
                <div className={`input-icon ${showPassword ? 'icon-text' : 'icon-password'}`}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      // Eye slash (hide password)
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <path d="m1 1 22 22"/>
                      </>
                    ) : (
                      // Eye (show password)
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Zapamti me</span>
              </label>
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

            <div className="confirm-actions">
              <button 
                type="button" 
                className="back-btn"
                onClick={onBack}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Nazad
              </button>
              
              <button 
                type="submit" 
                className="login-btn"
                disabled={loading || !password.trim()}
              >
                <span className="btn-content">
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Prijavljivam...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                      Prijavite se
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        ) : (
          // Modern Continue Actions  
          <div className="confirm-actions">
            <button 
              type="button" 
              className="back-btn"
              onClick={onBack}
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Nazad
            </button>
            
            <button 
              type="button" 
              className="continue-btn"
              onClick={onContinue}
              disabled={loading}
            >
              <span className="btn-content">
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Molim sačekajte...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    </svg>
                    Postavite lozinku
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        {/* Modern Footer */}
        <div className="confirm-footer">
          <p>Provjerite da li su podaci ispravni prije nastavka</p>
        </div>
      </div>
    </div>
  );
}

export default DriverConfirmScreen;