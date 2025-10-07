import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import styles from './MonthYearPicker.module.css';

const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

const MonthYearPicker = ({ 
  month,
  year,
  onMonthChange,
  onYearChange,
  monthlyPerformance = {}, // New prop: { 0: { value: 6322, change: 22 }, 1: { value: 5874, change: -126 } }
  isLoadingPerformance = false, // New prop: loading indicator
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePicker = () => {
    setIsOpen(!isOpen);
  };

  const selectMonth = (selectedMonth) => {
    onMonthChange(selectedMonth);
    setIsOpen(false);
  };

  const selectYear = (selectedYear) => {
    onYearChange(selectedYear);
    setIsOpen(false);
  };

  const displayValue = `${MONTHS[month]} ${year}`;

  // Helper function to get performance class for a month
  const getMonthPerformanceClass = (monthIndex) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Ako je trenutni mesec i trenutna godina, vrati 'current' class
    if (monthIndex === currentMonth && year === currentYear) {
      return styles.current;
    }
    
    const performance = monthlyPerformance[monthIndex];
    if (!performance || performance.change === undefined) return '';
    
    if (performance.change > 0) return styles.positive;
    if (performance.change < 0) return styles.negative;
    return styles.neutral;
  };

  return (
    <div className={`${styles.monthYearPicker} ${className}`} ref={inputRef}>
      <div 
        className={styles.inputWrapper}
        onClick={togglePicker}
      >
        {/* Invisible overlay for clicking */}
      </div>

      {isOpen && createPortal(
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div 
            className={styles.pickerDropdown} 
            ref={pickerRef}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Izaberi mesec i godinu</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.monthsSection}>
            <div className={styles.monthsGrid}>
              {MONTHS.map((monthName, idx) => {
                const performanceClass = getMonthPerformanceClass(idx);
                
                return (
                  <button
                    key={idx}
                    className={`${styles.monthButton} ${idx === month ? styles.selected : ''} ${performanceClass}`}
                    onClick={() => selectMonth(idx)}
                    type="button"
                    disabled={isLoadingPerformance}
                  >
                    {monthName}
                    {isLoadingPerformance && <span className={styles.loadingDot}>●</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.yearsSection}>
            <div className={styles.yearsGrid}>
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <button
                  key={y}
                  className={`${styles.yearButton} ${y === year ? styles.selected : ''}`}
                  onClick={() => selectYear(y)}
                  type="button"
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>, document.body
      )}
    </div>
  );
};

export default MonthYearPicker;
