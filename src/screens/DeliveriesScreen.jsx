import React, { useState, useEffect } from 'react';
import { IconCalendar, IconDriver, IconRest, IconStats } from '../components/common/Icons.jsx';
import './DeliveriesScreen.css';
import useDrivers from '../hooks/useDrivers';
import useDynamicColumnWidth from '../hooks/useDynamicColumnWidth';
import SkeletonCell from '../components/common/SkeletonCell';
import SyncProgressBar from '../components/common/SyncProgressBar';
import ModernModal from '../components/common/ModernModal';
import useWorkdays from '../hooks/useWorkdays';
import { getAllDeliveriesCloud, getAllHolidaysCloud, getQuickStatsCloud } from '../db/supabaseClient';
import { format } from 'date-fns';
import CloseButton from '../components/common/CloseButton.jsx';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August',
  'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function DeliveriesScreen() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ lastSync: null, unsyncedCount: 0 });
  const { drivers, error, refreshDrivers } = useDrivers();
  
  // Grupiraj dostave po datumu
  const groupedData = React.useMemo(() => {
    const grouped = {};
    data.forEach(delivery => {
      const dateKey = delivery.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      // Prikazuj broj stopova
      grouped[dateKey][delivery.driver] = delivery.produktivitaet_stops || 0;
    });
    return grouped;
  }, [data]);

  // Generiraj workdays za tabelu
  const workdays = useWorkdays(year, month, holidays.map(h => h.date));

  // Računaj balans po vozaču (target_per_day * radni_dani vs. odradio)
  const calculateDriverBalance = React.useMemo(() => {
    return drivers.map(driver => {
      // Koristi target_per_day iz drivers tabele
      const targetPerDay = driver.target_per_day || 0;
      
      // Ukupno trebalo da uradi (target_per_day * radni dani)
      const shouldComplete = targetPerDay * workdays.length;
      
      // Koliko je stvarno odradio
      const actualCompleted = workdays.reduce((acc, date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const dayData = groupedData[dateString] || {};
        return acc + (dayData[driver.tura] || 0);
      }, 0);
      
      // Balans: -shouldComplete + actualCompleted
      const balance = -shouldComplete + actualCompleted;
      
      // Procenat ispunjenja cilja
      const completionPercentage = shouldComplete > 0 ? (actualCompleted / shouldComplete * 100) : 0;
      
      return {
        id: driver.id,
        ime: driver.ime,
        tura: driver.tura,
        targetPerDay,
        shouldComplete,
        actualCompleted,
        balance,
        completionPercentage,
        aktivan: driver.aktivan
      };
    }).filter(driver => driver.aktivan); // Prikazuj samo aktivne vozače
  }, [drivers, workdays, groupedData]);
  
  // Računaj statistike
  const monthStats = React.useMemo(() => {
    const totalWorkdays = workdays.length;
    const daysWithData = new Set();
    
    // Pronađi dane sa podacima
    data.forEach(delivery => {
      if (delivery.produktivitaet_stops > 0) {
        daysWithData.add(delivery.date);
      }
    });
    
    const completedDays = daysWithData.size;
    const remainingDays = Math.max(0, totalWorkdays - completedDays);
    
    return {
      totalWorkdays,
      drivers: drivers.length,
      remainingDays
    };
  }, [workdays, data, drivers]);

  useEffect(() => {
    setLoading(true);
    getAllDeliveriesCloud(year, month).then(res => {
      setData(res || []);
      setLoading(false);
    });
    getAllHolidaysCloud(year).then(setHolidays);
    getQuickStatsCloud().then(setSyncStatus);
  }, [year, month]);

  return (
    <div className="deliveries-bg-gradient">
      <div className="deliveries-main-content">
        <CloseButton />
        <div className="deliveries-header">
          <div className="deliveries-title-block">
            <IconStats size={32} />
            <div>
              <h1 className="deliveries-title">Mjesečni izvještaj</h1>
              <div className="deliveries-subtitle">Pregled rezultata po vozačima</div>
            </div>
            <div className="deliveries-sync-icon">
              {/* Ovdje možeš dodati cloud/sync ikonu */}
            </div>
          </div>
          <div className="deliveries-header-cards">
            <div className="deliveries-header-card">
              <IconCalendar size={24} />
              <div className="deliveries-header-card-value">{monthStats.totalWorkdays}</div>
              <div className="deliveries-header-card-label">Radnih dana</div>
            </div>
            <div className="deliveries-header-card">
              <IconDriver size={24} />
              <div className="deliveries-header-card-value">{monthStats.drivers}</div>
              <div className="deliveries-header-card-label">Vozača</div>
            </div>
            <div className="deliveries-header-card">
              <IconRest size={24} />
              <div className="deliveries-header-card-value">{monthStats.remainingDays}</div>
              <div className="deliveries-header-card-label">Preostalo</div>
            </div>
          </div>
          <div className="deliveries-filters">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="deliveries-month-select">
              {MONTHS.map((m, i) => <option key={m} value={i}>📅 {m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="deliveries-year-select">
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
        <SyncProgressBar syncStatus={syncStatus} />
        <div className="deliveries-table-wrapper">
          {loading ? (
            <div className="deliveries-table-loading" data-testid="deliveries-loading">
              {[...Array(8)].map((_, i) => <SkeletonCell key={i} width={80} height={32} />)}
            </div>
          ) : workdays.length === 0 ? (
            <div className="deliveries-empty">Nema radnih dana</div>
          ) : (
            <table className="deliveries-table">
              <thead>
                <tr className="deliveries-table-header-row">
                  <th className="deliveries-table-header-cell" style={{ minWidth: 90 }}>
                    <IconCalendar size={20} />
                    <div>Datum</div>
                  </th>
                  {drivers.filter(d => d.aktivan).map(driver => (
                    <th key={driver.tura} className="deliveries-table-header-cell" style={{ minWidth: 80 }}>
                      <IconDriver size={20} />
                      <div style={{ fontWeight: 900, fontSize: '1rem' }}>{driver.tura}</div>
                      <small>{driver.ime}</small>
                    </th>
                  ))}
                  <th className="deliveries-table-header-cell" style={{ minWidth: 90 }}>
                    <IconStats size={20} />
                    <div>Ukupno</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {workdays.map(date => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  const dayData = groupedData[dateString] || {};
                  const total = drivers.filter(d => d.aktivan).reduce((sum, driver) => sum + (dayData[driver.tura] || 0), 0);
                  const isHoliday = holidays.some(h => h.date === dateString);
                  return (
                    <tr key={dateString} className={isHoliday ? 'holiday-row' : ''}>
                      <td>{format(date, 'dd.MM.')}</td>
                      {drivers.filter(d => d.aktivan).map(driver => (
                        <td key={driver.tura}
                          className={(() => {
                            const value = dayData[driver.tura];
                            const target = driver.target_per_day || 0;
                            if (value === undefined || value === null) return 'cell-empty';
                            if (target > 0) {
                              return value >= target ? 'cell-green' : value > 0 ? 'cell-red' : 'cell-empty';
                            }
                            return 'cell-empty';
                          })()}>
                          {dayData[driver.tura] !== undefined && dayData[driver.tura] !== null ? dayData[driver.tura] : '–'}
                        </td>
                      ))}
                      <td 
                        style={{ 
                          backgroundColor: total >= 300 ? '#a5d6a7' : total > 0 ? '#ef9a9a' : '#f5f5f5',
                          color: '#000',
                          fontWeight: 900,
                          fontSize: '1rem'
                        }}
                      >
                        {total || '–'}
                      </td>
                    </tr>
                  );
                })}
                {/* Balans red na dnu */}
                <tr className="deliveries-table-footer-row">
                  <td className="deliveries-table-footer-cell">
                    <IconStats size={20} />
                    <div>Balans</div>
                  </td>
                  {calculateDriverBalance.map(driver => {
                    return (
                      <td 
                        key={driver.tura} 
                        style={{ 
                          backgroundColor: driver.balance >= 0 ? '#a5d6a7' : '#ef9a9a',
                          color: '#000',
                          fontWeight: 900, 
                          fontSize: '1rem',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                        }}
                      >
                        {driver.balance > 0 ? `+${driver.balance}` : driver.balance}
                      </td>
                    );
                  })}
                  {/* Ukupno balans svih */}
                  <td style={{ 
                    backgroundColor: (() => {
                      const totalBalance = calculateDriverBalance.reduce((acc, driver) => acc + driver.balance, 0);
                      return totalBalance >= 0 ? '#81c784' : '#e57373';
                    })(),
                    color: '#000',
                    fontWeight: 900, 
                    fontSize: '1.1rem',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {(() => {
                      const totalBalance = calculateDriverBalance.reduce((acc, driver) => acc + driver.balance, 0);
                      return totalBalance > 0 ? `+${totalBalance}` : totalBalance;
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {modalVisible && (
          <ModernModal onClose={() => setModalVisible(false)}>
            <div className="deliveries-modal-form">
              <h2>Nova dostava</h2>
              {/* Ovdje ide kompletna forma kao u APK: polja za datum, vozače, količine, validacija, dugme za spremanje */}
              <button onClick={() => setModalVisible(false)}>Zatvori</button>
            </div>
          </ModernModal>
        )}
      </div>
    </div>
  );
}
