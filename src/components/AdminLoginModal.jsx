import React, { useState } from 'react';
import './AdminLoginModal.css';

export default function AdminLoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
    setUsername('');
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h3>Admin Pristup</h3>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="admin-input-group">
            <label htmlFor="username">Korisničko ime:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="admin-input-group">
            <label htmlFor="password">Lozinka:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="admin-modal-buttons">
            <button type="button" onClick={onClose} className="admin-btn-cancel">
              Otkaži
            </button>
            <button type="submit" className="admin-btn-login">
              Prijavi se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}