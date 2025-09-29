import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use new auth hook
  const { authenticate } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Očisti error kad korisnik tipka
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authenticate(credentials.username, credentials.password);
      
      if (result) {
        setCredentials({ username: '', password: '' });
        onLoginSuccess(result);
        onClose();
      } else {
        setError('Neispravno korisničko ime ili lozinka');
      }
    } catch (error) {
      setError('Greška prilikom prijave: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCredentials({ username: '', password: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={handleClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <div className="login-header">
          <img src="/bde-evidencija/assets/logo.png" alt="B&D Logo" className="login-logo" />
          <h2>Admin Pristup</h2>
          <p>Unesite vaše podatke za pristup admin panelu</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Korisničko ime</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Unesite korisničko ime"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Lozinka</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Unesite lozinku"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8S12.42 0 8 0zm4.95 6L10 8.95 12.95 12 12 12.95 9.05 10 6 12.95 5.05 12 8 9.05 5.05 6 6 5.05 9.05 8 12 5.05 12.95 6z"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-cancel"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading || !credentials.username || !credentials.password}
              className="btn-login"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Prijavljujem...
                </>
              ) : (
                'Prijaviť se'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;