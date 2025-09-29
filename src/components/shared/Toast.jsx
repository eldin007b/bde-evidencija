import React, { useEffect } from 'react';
import styles from './Toast.module.css';

const Toast = ({ message, isOpen, duration = 2500, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [isOpen, duration, onClose]);

  return (
    <div className={styles.toastContainer} aria-live="polite" aria-atomic="true">
      <div className={`${styles.toast} ${isOpen ? styles.visible : ''}`} role="status">
        {message}
      </div>
    </div>
  );
};

export default Toast;
