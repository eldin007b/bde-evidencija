import React, { useState } from 'react';
import './LoginScreen.css';

/**
 * LoginScreen - Normalan login sa turom i lozinkom
 */
function LoginScreen({ onLogin, loading, onBack }) {
  const [tura, setTura] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!tura.trim()) {
      setError('Molimo unesite vašu turu');
      return;
    }

    if (!password.trim()) {
      setError('Molimo unesite lozinku');
      return;
    }

    setError(null);
    onLogin(tura.trim().toUpperCase(), password);
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>Prijava</h1>
          <p>Unesite vašu turu i lozinku za pristup aplikaciji.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="tura">Tura:</label>
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
          </div>

          <div className="input-group">
            <label htmlFor="password">Lozinka:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vaša lozinka"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading || !tura.trim() || !password.trim()}
          >
            {loading ? 'Prijavljivam...' : 'Prijavite se'}
          </button>
        </form>

        <div className="login-footer">
          <button 
            type="button" 
            className="back-btn"
            onClick={onBack}
            disabled={loading}
          >
            ← Nazad
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;