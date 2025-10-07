import React, { useState } from 'react';
import './PasswordSetupScreen.css';

/**
 * PasswordSetupScreen - Moderni ekran za postavljanje početne lozinke
 */
function PasswordSetupScreen({ driver, onPasswordSet, onBack, loading }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Molimo unesite lozinku');
      return;
    }

    if (password.length < 4) {
      setError('Lozinka mora imati najmanje 4 karaktera');
      return;
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return;
    }

    setError(null);
    onPasswordSet(password, rememberMe);
  };

  return (
    <div className="password-setup-screen">
      <div className="setup-container">
        {/* Modern Header */}
        <div className="setup-header">
          <div className="header-avatar">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>Postavite lozinku</h1>
          <div className="driver-info-card">
            <div className="driver-detail">
              <span className="detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span><strong>Vozač:</strong> {driver.ime}</span>
            </div>
            <div className="driver-detail">
              <span className="detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6"/>
                </svg>
              </span>
              <span><strong>Tura:</strong> {driver.tura}</span>
            </div>
          </div>
          <p>Ovo je vaš prvi put. Molimo postavite lozinku za budući pristup.</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="input-group">
            <label htmlFor="password">Nova lozinka:</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Unesite lozinku"
                disabled={loading}
                autoFocus
              />
              <div className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <path d="m1 1 22 22"/>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Potvrdite lozinku:</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ponovite lozinku"
                disabled={loading}
              />
              <div className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                </svg>
              </div>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConfirmPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <path d="m1 1 22 22"/>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              {error}
            </div>
          )}

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <div className="checkbox-custom"></div>
              <span className="checkbox-text">Zapamti me</span>
            </label>
          </div>

          <div className="setup-actions">
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
              className="setup-btn"
              disabled={loading || !password.trim() || !confirmPassword.trim()}
            >
              <span className="btn-content">
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Postavljam i ulogujem...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Postavi lozinku i uloguj se
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

        {/* Modern Footer */}
        <div className="setup-footer">
          <p>Lozinka će biti automatski sačuvana i ulogovani ćete se odmah.</p>
        </div>
      </div>
    </div>
  );
}

export default PasswordSetupScreen;