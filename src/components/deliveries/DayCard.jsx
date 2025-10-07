import React from 'react';
import styles from '../../screens/DeliveriesScreen.module.css';
import { IconCalendar } from '../../components/common/Icons.jsx';
import { format } from 'date-fns';

export default function DayCard({ date, dayData = {}, drivers = [], totalsPerDay = {}, holidays = [], onCellClick }) {
  const dateString = format(date, 'yyyy-MM-dd');
  const total = totalsPerDay[dateString] || 0;
  const isHoliday = holidays.some(h => h.date === dateString);
  const totalClass = total >= 300 ? 'totalHigh' : total > 0 ? 'totalLow' : '';

  return (
    <div className={`${styles.dayCard} ${isHoliday ? styles.holiday : ''} ${totalClass ? styles[totalClass] : ''}`}>
      <div className={styles.dayCardHeader}>
        <IconCalendar size={20} /> {format(date, 'dd.MM.yyyy')}
      </div>
      <div className={styles.dayCardBody}>
        {drivers.map(driver => {
          const value = dayData[driver.tura] || 0;
          const rowClass = value >= (driver.target_per_day || 0) ? 'success' : value > 0 ? 'warning' : 'empty';
          return (
            <div key={driver.tura} className={`${styles.driverRow} ${styles[rowClass]}`} onClick={() => onCellClick && onCellClick({ date: dateString, driver })} role="button" tabIndex={0} onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCellClick && onCellClick({ date: dateString, driver });
              }
            }}>
              <div className={styles.driverInfo}>
                <div className={styles.driverName}>🚚 {driver.ime}</div>
                <div className={styles.driverTura}>{driver.tura}</div>
              </div>
              <span className={styles.driverValue}>{value || '–'}</span>
            </div>
          );
        })}
        <div className={`${styles.dayTotal} ${totalClass ? styles[`dayTotal${totalClass.charAt(0).toUpperCase()}${totalClass.slice(1)}`] : ''}`}>Ukupno: {total || '–'}</div>
      </div>
    </div>
  );
}
