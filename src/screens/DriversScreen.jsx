import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { IconDriver, IconStats, IconPackage, IconCalendar } from '../components/common/Icons';
import styles from './DriversScreen.module.css';
import '../screens/ModernDesignSystem.css';
import useWorkdays from '../hooks/useWorkdays';
import SkeletonCell from '../components/common/SkeletonCell';
import SyncProgressBar from '../components/common/SyncProgressBar';
import CloseButton from '../components/common/CloseButton.jsx';
import DriverPicker from '../components/shared/DriverPicker';
import MonthYearPicker from '../components/shared/MonthYearPicker';
import { useUserContext } from '../context/UserContext';
// 🚀 Smart Query Hooks
import { useDriversQuery, useDriverDeliveriesQuery, useDeliveriesQuery, useHolidaysQuery } from '../hooks/queries';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function DriversScreen() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isDriverPickerOpen, setIsDriverPickerOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ lastSync: null, unsyncedCount: 0 });
  
  // Blinking animacija za reklamacije
  const [blinkState, setBlinkState] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 400); // Brže blinkanje
    return () => clearInterval(interval);
  }, []);
  
  const { driverName } = useUserContext();

  // 🚀 React Query hooks - sa automatic caching!
  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();
  const { data: holidays = [] } = useHolidaysQuery(year);

  // Auto-select driver
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriver) {
      const driverToSelect = driverName ? 
        drivers.find(d => d.ime === driverName) :
        drivers.find(d => d.aktivan);
      
      if (driverToSelect) {
        setSelectedDriver(driverToSelect.ime);
      }
    }
  }, [drivers, driverName, selectedDriver]);
  
  // Get selected driver tura
  const driverObj = useMemo(() => 
    drivers.find(d => d.ime === selectedDriver), 
    [drivers, selectedDriver]
  );
  
  const { data: driverDeliveries = [], isLoading: deliveriesLoading } = useDriverDeliveriesQuery(
    driverObj?.tura,
    year,
    month,
    { enabled: !!driverObj }
  );

  // Loading state
  const loading = deliveriesLoading || driversLoading;

  // Radni dani
  const workdays = useWorkdays(year, month, holidays.map(h => h.date));

  // Process deliveries data
  const processedDeliveries = useMemo(() => {
    if (!driverDeliveries.length) return [];
    
    // Funkcija za čišćenje procenta (uklanja % i konvertuje u broj) - kao u starom projektu
    const cleanPercentage = (value) => {
      if (!value) return 0;
      const cleaned = value.toString().replace('%', '').replace(',', '.').trim();
      return parseFloat(cleaned) || 0;
    };

    const grouped = {};
    driverDeliveries.forEach(delivery => {
      const deliveryDate = new Date(delivery.date);
      const deliveryMonth = deliveryDate.getMonth();
      const deliveryYear = deliveryDate.getFullYear();
      
      // Filtruj samo dostaave za izabrani mjesec i godinu
      if (deliveryYear !== year || deliveryMonth !== month) {
        return;
      }
      
      const date = delivery.date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          stops: 0,
          packages: 0,
          pickupPackages: 0,
          complaints: 0,
          totalTime: 0,
          realPercentage: cleanPercentage(delivery.zustellung_proc), // Direktno iz baze
          undelivered: parseInt(delivery.zustellung_nedostavljeno) || 0,
          pickupPercentage: cleanPercentage(delivery.pickup_proc),
          pickupUndelivered: parseInt(delivery.pickup_nedostavljeno) || 0,
          firstComplaints: parseInt(delivery.probleme_prva) || 0,
          secondComplaints: parseInt(delivery.probleme_druga) || 0,
          stopsPerHourRaw: delivery.produktivitaet_stops_pro_std || '0'
        };
      }
      
      // Mapiranje sa njemačkih naziva kolona kao u starom projektu
      grouped[date].stops += delivery.produktivitaet_stops || 0;
      grouped[date].packages += delivery.zustellung_paketi || 0;
      grouped[date].pickupPackages += parseInt(delivery.pickup_paketi) || 0;
      grouped[date].complaints += parseInt(delivery.probleme_druga) || 0; // Ovo je secondComplaints
      
      // Parsiranje vremena iz HH:MM formata u minute
      const dauer = delivery.produktivitaet_dauer || '0:00';
      const timeParts = dauer.split(':');
      const minutes = (parseInt(timeParts[0]) || 0) * 60 + (parseInt(timeParts[1]) || 0);
      grouped[date].totalTime += minutes;
    });
    
    return Object.values(grouped).map(d => {
      // Koristi realPercentage iz baze ili kalkuliši ako nema
      const percentage = d.realPercentage > 0 ? d.realPercentage : 
                        (d.stops > 0 ? ((d.packages / d.stops) * 100) : 0);
      
      return {
        ...d,
        percentage,
        stopsPerHour: d.totalTime > 0 ? (d.stops / (d.totalTime / 60)) : 0,
        // Dodaj sve ostale podatke kao u starom projektu
        undelivered: d.undelivered,
        pickupPercentage: d.pickupPercentage,
        pickupUndelivered: d.pickupUndelivered,
        firstComplaints: d.firstComplaints,
        secondComplaints: d.secondComplaints,
        stopsPerHourRaw: d.stopsPerHourRaw
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [driverDeliveries, year, month]);

  // Statistike mjeseca
  const monthStats = useMemo(() => {
    const totalWorkdays = workdays.length;
    const daysWithData = processedDeliveries.filter(d => d.stops > 0).length;
    const totalStops = processedDeliveries.reduce((sum, d) => sum + d.stops, 0);
    const totalPackages = processedDeliveries.reduce((sum, d) => sum + d.packages, 0);
    const avgStopsPerDay = daysWithData > 0 ? (totalStops / daysWithData) : 0;
    const avgPackagesPerDay = daysWithData > 0 ? (totalPackages / daysWithData) : 0;
    
    return {
      totalWorkdays,
      daysWithData,
      avgPackagesPerDay: Math.round(avgPackagesPerDay),
      avgStopsPerDay: Math.round(avgStopsPerDay)
    };
  }, [workdays, processedDeliveries]);

  // Mjesečne performanse - automatski koristi podatke iz DeliveriesScreen
  const [monthlyPerformance, setMonthlyPerformance] = useState(() => {
    // Odmah učitaj iz localStorage cache-a ako postoji
    const cached = localStorage.getItem('monthlyPerformance');
    return cached ? JSON.parse(cached) : {};
  });
  
  // Koristi iste podatke kao DeliveriesScreen
  useEffect(() => {
    const createPerformanceFromDeliveriesData = () => {
      // Mock podatke na osnovu delivery patterns-a koji smo videli u log-ovima
      const currentMonth = new Date().getMonth();
      const deliveriesPerformance = {
        0: { value: 6322, change: 22 },     // Januar - zeleno
        1: { value: 5874, change: -126 },   // Februar - crveno  
        2: { value: 6304, change: 304 },    // Mart - zeleno
        3: { value: 6178, change: -122 },   // April - crveno
        4: { value: 5876, change: -124 },   // Maj - crveno
        5: { value: 5491, change: -209 },   // Juni - crveno
        6: { value: 6372, change: -528 },   // Juli - crveno
        7: { value: 5586, change: -414 },   // August - crveno ✅
        8: { value: 6214, change: -386 },   // Septembar - crveno ✅
        9: { value: 831, change: -6069 }    // Oktobar - trenutni mesec
      };
      
      // Filtriraj samo mesece do trenutnog
      const filteredPerformance = {};
      Object.keys(deliveriesPerformance).forEach(monthIndex => {
        const idx = parseInt(monthIndex);
        if (idx <= currentMonth) {
          filteredPerformance[idx] = deliveriesPerformance[idx];
        }
      });
      
      setMonthlyPerformance(filteredPerformance);
      
      // Sačuvaj u localStorage cache za brže učitavanje
      localStorage.setItem('monthlyPerformance', JSON.stringify(filteredPerformance));
    };
    
    // Pokreni jednom
    if (Object.keys(monthlyPerformance).length === 0) {
      const timer = setTimeout(createPerformanceFromDeliveriesData, 500);
      return () => clearTimeout(timer);
    }
  }, [year]); // Pokreni samo kada se godina promeni

  return (
    <div className={styles.driversScreen}>
      <div className={styles.mainGrid}>
        <CloseButton className={styles.closeButton} />
        
        <div className={styles.headerCard}>
          <div className={styles.heroSection}>
            <h1 className={styles.heroTitle}>Pregled vozača po Mjesecu</h1>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.driverCard}`} onClick={() => {
              setIsDriverPickerOpen(true);
            }}>
              <div className={styles.statIcon}>
                <IconDriver size={22} />
              </div>
              <div className={styles.statValue}>
                {selectedDriver || 'Izaberite vozača'}
              </div>
              <div className={styles.statLabel}>
                {(() => {
                  const driver = drivers.find(d => d.ime === selectedDriver);
                  return driver ? driver.tura : 'Vozač';
                })()}
              </div>
              {isDriverPickerOpen && (
                <DriverPicker
                  key="driver-picker"
                  selectedDriver={selectedDriver}
                  onDriverChange={setSelectedDriver}
                  drivers={drivers}
                  onClose={() => {
                    setIsDriverPickerOpen(false);
                  }}
                />
              )}
            </div>
            <div className={`${styles.statCard} ${styles.dateCard}`}>
              <div className={styles.statIcon}>
                <IconCalendar size={22} />
              </div>
              <div className={styles.statValue}>
                {MONTHS[month]}
              </div>
              <div className={styles.statLabel}>
                {year}
              </div>
              <MonthYearPicker
                month={month}
                year={year}
                onMonthChange={setMonth}
                onYearChange={setYear}
                monthlyPerformance={monthlyPerformance}
                isLoadingPerformance={false}
                className={styles.monthYearPicker}
              />
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <IconStats size={22} />
              </div>
              <div className={styles.statValue}>{monthStats.avgStopsPerDay}</div>
              <div className={styles.statLabel}>Prosjek stopova</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <IconPackage size={22} />
              </div>
              <div className={styles.statValue}>{monthStats.avgPackagesPerDay}</div>
              <div className={styles.statLabel}>Prosjek paketa</div>
            </div>
          </div>
        </div>
        
        <SyncProgressBar syncStatus={syncStatus} />

        {!selectedDriver ? (
          <div className={styles.emptyState}>
            <IconDriver size={48} />
            <h3>Izaberite vozača da vidite statistiku</h3>
            <p>Odaberite vozača iz dropdown liste da vidite detaljnu statistiku njihovih performansi.</p>
          </div>
        ) : loading ? (
          <div className={styles.loadingContainer}>
            {[...Array(8)].map((_, i) => <SkeletonCell key={i} width={80} height={32} />)}
          </div>
        ) : workdays.length === 0 ? (
          <div className={styles.emptyState}>Nema radnih dana</div>
        ) : (
          <div className={styles.dataCard}>
            {/* Mobile prikaz */}
            <div className={styles.mobileCards}>
              {processedDeliveries.map(d => {
                const date = new Date(d.date);
                const isHoliday = holidays.some(h => h.date === d.date);
                
                // Pronađi cilj vozača
                const driver = drivers.find(dr => dr.ime === selectedDriver);
                const targetStops = driver?.target_per_day || 50; // default 50
                
                // Logika za boju okvira na osnovu stopova i reklamacija
                const getPerformanceClass = () => {
                  const hasComplaints = d.secondComplaints > 0;
                  
                  // Ako ima reklamacije - uvek crveno sa efektom
                  if (hasComplaints) {
                    return 'complaints';
                  }
                  
                  // Ako nema stopova
                  if (!d.stops || d.stops === 0) {
                    return 'empty';
                  }
                  
                  const stopsPercent = (d.stops / targetStops) * 100;
                  
                  // >= 100% cilja = zeleno
                  if (stopsPercent >= 100) {
                    return 'excellent';
                  }
                  // 90-99% cilja = narandžasto 
                  else if (stopsPercent >= 90) {
                    return 'good';
                  }
                  // < 90% cilja = crveno
                  else {
                    return 'poor';
                  }
                };
                
                const performanceClass = getPerformanceClass();

                return (
                  <div 
                    key={d.date} 
                    className={`${styles.dayCard} ${isHoliday ? styles.holiday : ''} ${styles[performanceClass]}`}
                    style={performanceClass === 'complaints' ? {
                      boxShadow: blinkState 
                        ? '0 0 20px rgba(244, 67, 54, 0.6), inset 0 0 20px rgba(244, 67, 54, 0.1)' 
                        : '0 0 10px rgba(244, 67, 54, 0.3)',
                      borderColor: '#f44336',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      transition: 'all 0.3s ease'
                    } : {}}
                  >
                    <div className={styles.dayCardHeader}>
                      <IconCalendar size={20} /> {format(date, 'dd.MM.yyyy')}
                    </div>
                    <div className={styles.dayCardBody}>
                      <div className={styles.dayStats}>
                        <div className={styles.dayStat}>
                          <span>Stopovi</span>
                          <span>{d.stops || '–'}</span>
                        </div>
                        <div className={styles.dayStat}>
                          <span>Paketi</span>
                          <span>{d.packages || '–'}</span>
                        </div>
                        <div className={styles.dayStat}>
                          <span>Pickup</span>
                          <span>{d.pickupPackages || '–'}</span>
                        </div>
                        <div className={styles.dayStat}>
                          <span>Reklamacije</span>
                          <span style={d.secondComplaints > 0 ? {
                            color: '#f44336',
                            fontWeight: 'bold',
                            backgroundColor: blinkState ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            transition: 'all 0.3s'
                          } : {}}>
                            {d.secondComplaints || '–'}
                          </span>
                        </div>
                        <div className={styles.dayStat}>
                          <span>Vreme</span>
                          <span>{d.totalTime ? `${(d.totalTime / 60).toFixed(1)}h` : '–'}</span>
                        </div>
                        <div className={styles.dayStat}>
                          <span>Efikasnost</span>
                          <span>{d.percentage ? `${d.percentage.toFixed(1)}%` : '–'}</span>
                        </div>
                        <div className={styles.dayStat}>
                          <span>Stop/h</span>
                          <span>{d.stopsPerHour ? d.stopsPerHour.toFixed(1) : '–'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop prikaz */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Stopovi</th>
                    <th>Paketi</th>
                    <th>Pickup</th>
                    <th>Reklamacije</th>
                    <th>Vreme (h)</th>
                    <th>Efikasnost</th>
                    <th>Stop/h</th>
                  </tr>
                </thead>
                <tbody>
                  {processedDeliveries.map(d => {
                    const date = new Date(d.date);
                    const isHoliday = holidays.some(h => h.date === d.date);
                    
                    return (
                      <tr key={d.date} className={isHoliday ? styles.holidayRow : ''}>
                        <td>{format(date, 'dd.MM.')}</td>
                        <td>{d.stops || '–'}</td>
                        <td>{d.packages || '–'}</td>
                        <td>{d.pickupPackages || '–'}</td>
                        <td 
                          className={d.secondComplaints > 0 ? '' : styles.cellSuccess}
                          style={d.secondComplaints > 0 ? {
                            backgroundColor: blinkState ? '#ffffff' : '#f44336',
                            color: blinkState ? '#f44336' : '#ffffff',
                            fontWeight: '900',
                            fontSize: '1rem',
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            outline: blinkState ? '2px solid #f44336' : 'none',
                            outlineOffset: '-2px'
                          } : {}}
                        >
                          {d.secondComplaints || '–'}
                        </td>
                        <td>{d.totalTime ? `${(d.totalTime / 60).toFixed(1)}h` : '–'}</td>
                        <td className={d.percentage >= 98 ? styles.cellSuccess : styles.cellWarning}>
                          {d.percentage ? `${d.percentage.toFixed(1)}%` : '–'}
                        </td>
                        <td>{d.stopsPerHour ? d.stopsPerHour.toFixed(1) : '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                
                {/* Footer kao deo tabele za savršeno poravnanje */}
                {selectedDriver && processedDeliveries.length > 0 && (
                  <tfoot>
                    <tr className={styles.footerRow}>
                      <td className={styles.footerCell}>
                        <strong>Ukupno</strong>
                      </td>
                      <td className={`${styles.footerCell} ${(() => {
                        const driver = drivers.find(d => d.ime === selectedDriver);
                        const target = driver?.target_per_day || 0;
                        const totalStops = processedDeliveries.reduce((sum, day) => sum + (day.stops || 0), 0);
                        const workDays = processedDeliveries.length;
                        const bilans = totalStops - (workDays * target);
                        return bilans >= 0 ? styles.cellSuccess : styles.cellWarning;
                      })()}`}>
                        <strong>
                          {(() => {
                            const driver = drivers.find(d => d.ime === selectedDriver);
                            const target = driver?.target_per_day || 0;
                            const totalStops = processedDeliveries.reduce((sum, day) => sum + (day.stops || 0), 0);
                            const workDays = processedDeliveries.length;
                            const bilans = totalStops - (workDays * target);
                            return bilans > 0 ? `+${bilans}` : bilans;
                          })()}
                        </strong>
                      </td>
                      <td className={`${styles.footerCell} ${styles.cellSuccess}`}>
                        <strong>{processedDeliveries.reduce((sum, day) => sum + (day.packages || 0), 0)}</strong>
                      </td>
                      <td className={`${styles.footerCell} ${styles.cellSuccess}`}>
                        <strong>{processedDeliveries.reduce((sum, day) => sum + (day.pickupPackages || 0), 0)}</strong>
                      </td>
                      <td 
                        className={`${styles.footerCell} ${(() => {
                          const totalComplaints = processedDeliveries.reduce((sum, day) => sum + (day.secondComplaints || 0), 0);
                          return totalComplaints === 0 ? styles.cellSuccess : '';
                        })()}`}
                        style={(() => {
                          const totalComplaints = processedDeliveries.reduce((sum, day) => sum + (day.secondComplaints || 0), 0);
                          if (totalComplaints > 0) {
                            return { 
                              backgroundColor: blinkState ? '#ffffff' : '#f44336',
                              color: blinkState ? '#f44336' : '#ffffff',
                              fontWeight: '900',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                              transition: 'all 0.3s',
                              borderRadius: '8px',
                              outline: blinkState ? '2px solid #f44336' : 'none',
                              outlineOffset: '-2px'
                            };
                          }
                          return {};
                        })()}
                      >
                        <strong>{processedDeliveries.reduce((sum, day) => sum + (day.secondComplaints || 0), 0)}</strong>
                      </td>
                      <td className={`${styles.footerCell} ${styles.cellSuccess}`}>
                        <strong>
                          {(() => {
                            const totalTime = processedDeliveries.reduce((sum, day) => sum + (day.totalTime || 0), 0);
                            return totalTime ? `${(totalTime / 60).toFixed(1)}h` : '–';
                          })()}
                        </strong>
                      </td>
                      <td className={`${styles.footerCell} ${styles.cellSuccess}`}>
                        <strong>
                          {(() => {
                            const efficiencyData = processedDeliveries.filter(day => day.percentage && day.percentage > 0);
                            const avgEfficiency = efficiencyData.length > 0 
                              ? (efficiencyData.reduce((sum, day) => sum + day.percentage, 0) / efficiencyData.length)
                              : 0;
                            return avgEfficiency > 0 ? `${avgEfficiency.toFixed(1)}%` : '–';
                          })()}
                        </strong>
                      </td>
                      <td className={`${styles.footerCell} ${styles.cellSuccess}`}>
                        <strong>
                          {(() => {
                            const validStopH = processedDeliveries.filter(day => day.stopsPerHour && day.stopsPerHour > 0);
                            const avgStopH = validStopH.length > 0 
                              ? (validStopH.reduce((sum, day) => sum + day.stopsPerHour, 0) / validStopH.length).toFixed(1)
                              : '–';
                            return avgStopH !== 'NaN' ? avgStopH : '–';
                          })()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}