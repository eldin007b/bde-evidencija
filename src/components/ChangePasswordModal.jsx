import React, { useState } from 'react';
import './ChangePasswordModal.css';

/**
 * ChangePasswordModal - Modal za promjenu lozinke
 */
function ChangePasswordModal({ isOpen, onClose, onChangePassword, loading }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!oldPassword.trim()) {
      setError('Molimo unesite staru lozinku');
      return;
    }

    if (!newPassword.trim()) {
      setError('Molimo unesite novu lozinku');
      return;
    }

    if (newPassword.length < 4) {
      setError('Nova lozinka mora imati najmanje 4 karaktera');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nove lozinke se ne poklapaju');
      return;
    }

    try {
      setError(null);
      await onChangePassword(oldPassword, newPassword);
      setSuccess(true);
      
      // Resetuj form nakon 2 sekunde i zatvori modal
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Promjena lozinke</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {success ? (
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h3>Lozinka je uspješno promijenjena!</h3>
            <p>Modal će se zatvoriti automatski.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="input-group">
              <label htmlFor="oldPassword">Stara lozinka:</label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Unesite staru lozinku"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="newPassword">Nova lozinka:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Unesite novu lozinku"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Potvrdite novu lozinku:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ponovite novu lozinku"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={handleClose}
                disabled={loading}
              >
                Otkaži
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
              >
                {loading ? 'Mijenjam...' : 'Promijeni lozinku'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordModal;