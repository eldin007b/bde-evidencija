import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CloseButtonModern.css';

const CloseButtonModern = ({ onClose, className = '', style = {} }) => {
  const navigate = useNavigate();

  const handleClose = (e) => {
    if (onClose) return onClose(e);
    try {
      navigate('/');
    } catch (err) {
      // fall back: do nothing
      console.warn('CloseButtonModern: navigate failed', err);
    }
  };

  return (
    <button
      className={`closeButtonModern ${className}`}
      style={style}
      onClick={handleClose}
      aria-label="Zatvori"
      title="Zatvori"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default CloseButtonModern;
