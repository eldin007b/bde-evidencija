import React from 'react';
import styles from '../../screens/DeliveriesScreen.module.css';
import { format } from 'date-fns';

export default function DeliveriesTable({ groupedData = {}, workdays = [], drivers = [], holidays = [], totalsPerDay = {}, totalsPerDriver = {}, grandTotal = 0, onCellClick }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>Pregled dostava po danima</caption>
        <thead>
          <tr>
            <th scope="col">Datum</th>
            {drivers.map(driver => (
              <th key={driver.tura} scope="col">
                <div className={styles.tableDriverHeader}>
                  <div className={styles.tableDriverName}>{driver.ime}</div>
                  <div className={styles.tableDriverTura}>{driver.tura}</div>
                </div>
              </th>
            ))}
            <th scope="col">Ukupno</th>
          </tr>
        </thead>
        <tbody>
          {workdays.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const dayData = groupedData[dateString] || {};
            const total = totalsPerDay[dateString] || 0;
            const isHoliday = holidays.some(h => h.date === dateString);
            return (
              <tr key={dateString} className={isHoliday ? styles.holidayRow : ''}>
                <td>{format(date, 'dd.MM.')}</td>
                {drivers.map(driver => {
                  const value = dayData[driver.tura] || 0;
                  const cellClass = value >= (driver.target_per_day || 0) ? 'cellSuccess' : value > 0 ? 'cellWarning' : 'cellEmpty';
                  return (
                    <td key={driver.tura} className={styles[cellClass]} onClick={() => onCellClick && onCellClick({ date: dateString, driver })}>
                      {value || '–'}
                    </td>
                  );
                })}
                <td className={styles[total >= 300 ? 'cellSuccess' : total > 0 ? 'cellWarning' : 'cellEmpty']}>{total || '–'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={styles.footerRow}>
            <td className={styles.footerCell}><strong>Ukupno</strong></td>
            {drivers.map(driver => {
              const key = driver.tura;
              const totalForDriver = totalsPerDriver[key] || 0;
              const workDays = workdays.length;
              const target = (driver.target_per_day || 0) * workDays;
              const bilans = totalForDriver - target;
              return (
                <td key={driver.tura} className={`${styles.footerCell} ${bilans >= 0 ? styles.cellSuccess : styles.cellWarning}`}>
                  <div><strong>{totalForDriver}</strong></div>
                  <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>({bilans > 0 ? `+${bilans}` : bilans})</div>
                </td>
              );
            })}
            <td className={`${styles.footerCell} ${grandTotal >= 0 ? styles.cellSuccess : styles.cellWarning}`}>
              <div><strong>{grandTotal}</strong></div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
