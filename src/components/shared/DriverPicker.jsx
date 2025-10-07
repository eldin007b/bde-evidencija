import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './DriverPicker.module.css';

const DriverPicker = ({ 
  selectedDriver,
  onDriverChange,
  drivers = [],
  onClose,
  className = ""
}) => {
  const pickerRef = useRef(null);

  const handleDriverSelect = (driverName) => {
    onDriverChange(driverName);
    // Dodaj mali delay da se state ažurira prije zatvaranja
    setTimeout(() => {
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }, 10);
  };

  const activeDrivers = drivers.filter(d => d.aktivan || d.tura === 'ALL');

  const modal = (
    <div className={styles.modalOverlay} onClick={(e) => {
      // Zatvoři samo ako je kliknuto na overlay, ne na modal sadržaj
      if (e.target === e.currentTarget) {
        e.stopPropagation();
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
      }
    }}>
      <div className={styles.modalContent} ref={pickerRef}>
        <div className={styles.header}>
          <h3 className={styles.title}>Izaberite vozača</h3>
          <button 
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation(); // Zaustavi event bubbling
              if (onClose && typeof onClose === 'function') {
                onClose();
              }
            }}
          >
            ×
          </button>
        </div>
        
        <div className={styles.driversGrid}>
          {activeDrivers.map((driver) => (
            <button
              key={driver.tura}
              className={`${styles.driverButton} ${
                driver.ime === selectedDriver ? styles.selected : ''
              }`}
              onClick={() => handleDriverSelect(driver.ime)}
              type="button"
            >
              <div className={styles.driverInfo}>
                <div className={styles.driverName}>
                  {driver.tura === 'ALL' ? 'Svi vozači' : driver.ime}
                </div>
                <div className={styles.driverTura}>
                  {driver.tura === 'ALL' ? 'Prikaži sve' : `Tura ${driver.tura}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default DriverPicker;