
import React, { useState, useEffect, useRef } from 'react';
import { IconCalendar, IconDriver, IconRest, IconStats } from '../components/common/Icons.jsx';
import './DriversScreen.css';
import useDrivers from '../hooks/useDrivers';
import SkeletonCell from '../components/common/SkeletonCell';
import ModernModal from '../components/common/ModernModal';
import useWorkdays from '../hooks/useWorkdays';
import { supabase } from '../db/supabaseClient';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import CloseButton from '../components/common/CloseButton.jsx';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3];
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August',
  'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function DriversScreen() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDriver, setSelectedDriver] = useState(''); // Prazan na početku
  const [holidays, setHolidays] = useState([]);
  const [driverDeliveries, setDriverDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Vraćamo pravi useDrivers hook
  const { drivers, error, refreshDrivers } = useDrivers();
  
  // Debug log za vozače
  useEffect(() => {
    // Debug kod uklonjen - vozači se automatski dohvaćaju iz hook-a
  }, [drivers, error]);

  // Automatski bira vozača na osnovu tura koda iz localStorage
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriver) {
      const currentTura = localStorage.getItem('DRIVER_TURA');
      
      if (currentTura) {
        // Pronađi vozača sa odgovarajućim tura kodom
        const matchingDriver = drivers.find(driver => driver.tura === currentTura);
        
        if (matchingDriver) {
          setSelectedDriver(matchingDriver.ime);
        }
      }
    }
  }, [drivers, selectedDriver]);

  // Blinkanje animacija za reklamacije
  const [blinkState, setBlinkState] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 400); // Brže blinkanje
    return () => clearInterval(interval);
  }, []);

  // Kreiraj trenutni datum za workdays
  const currentDate = new Date(year, month, 1);
  
  // Generiraj workdays za tabelu
  const workdays = useWorkdays(year, month, holidays.map(h => h.date));

  // Dohvaćamo podatke za vozača iz tabele deliveries
  useEffect(() => {
    loadDriverData();
  }, [year, month, selectedDriver]);

  const loadDriverData = async () => {
    if (!selectedDriver) {
      setDriverDeliveries([]);
      return;
    }
    
    setLoading(true);
    
    // Pronađi vozača u listi ili svi vozači za UKUPNO
    const driverObj = selectedDriver === 'UKUPNO' ? null : drivers.find(d => d.ime === selectedDriver);
    const allDrivers = drivers.filter(d => d.aktivan && d.role !== 'admin');
    
    try {
      const startOfMonthDate = startOfMonth(new Date(year, month, 1));
      const endOfMonthDate = endOfMonth(new Date(year, month, 1));
      
      // Prvo pokušajmo jednostavan query da vidimo da li tabela postoji
      const testResponse = await supabase
        .from('deliveries')
        .select('*')
        .limit(5);
      
      if (testResponse.data && testResponse.data.length > 0) {
        // Tabela postoji i ima podatke
      } else {
        // Nema podataka u deliveries tabeli
      }
      
      // Zatim specifični query za vozača - koristimo tura kod umesto imena
      const driverCode = driverObj?.tura;
      if (!driverCode) {
        setDriverDeliveries([]);
        setLoading(false);
        return;
      }
      
      const response = await supabase
        .from('deliveries')
        .select('*')
        .gte('date', format(startOfMonthDate, 'yyyy-MM-dd'))
        .lte('date', format(endOfMonthDate, 'yyyy-MM-dd'))
        .eq('driver', driverCode)
        .eq('deleted', 0)
        .order('date', { ascending: true });

            // Pokušajmo naći podatke bez filtera za vozača  
      const driverTestResponse = await supabase
        .from('deliveries')
        .select('driver')
        .not('driver', 'is', null)
        .limit(10);
      
      // Provjeri dostupne datume
      const dateTestResponse = await supabase
        .from('deliveries')
        .select('date')
        .not('date', 'is', null)
        .order('date', { ascending: false })
        .limit(10);

      if (response.error) {
        console.error('Supabase query error:', response.error);
        throw response.error;
      }
      
      if (response.data && response.data.length > 0) {
        // Podaci pronađeni
      }
      
      // Mapiramo podatke sa njemačkih naziva kolona na naše nazive
      const mappedData = (response.data || []).map(delivery => {
        // Funkcija za čišćenje procenta (uklanja % i konvertuje u broj)
        const cleanPercentage = (value) => {
          if (!value) return 0;
          const cleaned = value.toString().replace('%', '').replace(',', '.').trim();
          return parseFloat(cleaned) || 0;
        };
        
        return {
          ...delivery,
          packages: delivery.zustellung_paketi || 0,
          percentage: cleanPercentage(delivery.zustellung_proc),
          undelivered: delivery.zustellung_nedostavljeno || 0,
          pickupPackages: parseInt(delivery.pickup_paketi) || 0, // Konvertujemo u broj
          pickupPercentage: cleanPercentage(delivery.pickup_proc),
          pickupUndelivered: parseInt(delivery.pickup_nedostavljeno) || 0,
          firstComplaints: parseInt(delivery.probleme_prva) || 0,
          secondComplaints: parseInt(delivery.probleme_druga) || 0,
          complaints: parseInt(delivery.probleme_druga) || 0, // Ovo koristimo za reklamacije
          stops: delivery.produktivitaet_stops || 0,
          stopsPerHour: delivery.produktivitaet_stops_pro_std || '0',
          duration: delivery.produktivitaet_dauer || '00:00'
        };
      });
      
      setDriverDeliveries(mappedData);
    } catch (error) {
      console.error('Greška kod dohvaćanja podataka vozača:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dohvaćamo praznike
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const response = await supabase
          .from('holidays')
          .select('*')
          .eq('year', year);
        
        if (response.error) throw response.error;
        setHolidays(response.data || []);
      } catch (error) {
        console.error('Greška kod dohvaćanja praznika:', error);
      }
    };
    
    loadHolidays();
  }, [year]);

  // Računaj statistike za selektovanog vozača
  const driverStats = React.useMemo(() => {
    if (!selectedDriver || driverDeliveries.length === 0) {
      return { totalStops: 0, totalPackages: 0, avgEfficiency: 0, totalPickup: 0, totalProblems: 0 };
    }
    
    const totalStops = driverDeliveries.reduce((sum, day) => sum + (day.stops || 0), 0);
    const totalPackages = driverDeliveries.reduce((sum, day) => sum + (day.packages || 0), 0);
    const totalPickup = driverDeliveries.reduce((sum, day) => sum + (day.pickupPackages || 0), 0);
    const totalProblems = driverDeliveries.reduce((sum, day) => sum + (day.complaints || 0), 0);
    
    const efficiencyData = driverDeliveries.filter(day => day.percentage && day.percentage > 0);
    const avgEfficiency = efficiencyData.length > 0 
      ? Math.round(efficiencyData.reduce((sum, day) => sum + day.percentage, 0) / efficiencyData.length)
      : 0;
    
    return { totalStops, totalPackages, avgEfficiency, totalPickup, totalProblems };
  }, [driverDeliveries, selectedDriver]);

  return (
    <div className="drivers-bg-gradient">
      <div className="drivers-main-content">
        <CloseButton />
        <div className="drivers-header">
          <div className="drivers-title-block">
            <IconStats size={32} />
            <div>
              <h1 className="drivers-title">Statistika vozača</h1>
              <div className="drivers-subtitle">Mjesečni pregled</div>
            </div>
          </div>
          <div className="drivers-refresh-button" onClick={loadDriverData}>
            🔄
          </div>
        </div>

        {/* Statistike kartice */}
        <div className="drivers-stats-cards">
          <div className="drivers-stat-card">
            <div className="drivers-stat-icon">📍</div>
            <div className="drivers-stat-value">{driverStats.totalStops}</div>
            <div className="drivers-stat-label">Stopovi</div>
          </div>
          <div className="drivers-stat-card">
            <div className="drivers-stat-icon">📦</div>
            <div className="drivers-stat-value">{driverStats.totalPackages}</div>
            <div className="drivers-stat-label">Paketi</div>
          </div>
          <div className="drivers-stat-card">
            <div className="drivers-stat-icon">📊</div>
            <div className="drivers-stat-value">{driverStats.avgEfficiency}%</div>
            <div className="drivers-stat-label">Efikasnost</div>
          </div>
        </div>
          <div className="drivers-filters">
            <div className="drivers-filter-row">
              <div className="drivers-filter-item">
                <div className="drivers-filter-icon">👨‍✈️</div>
                <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="drivers-driver-select">
                  <option value="">Izaberi vozača</option>
                  <option value="UKUPNO">📊 Ukupno (svi vozači)</option>
                  {drivers.filter(d => d.aktivan && d.role !== 'admin').map(d => {
                    const currentTura = localStorage.getItem('DRIVER_TURA');
                    const isAutoSelected = d.tura === currentTura;
                    return (
                      <option key={d.tura} value={d.ime}>
                        {isAutoSelected ? '🔹 ' : ''}{d.ime} ({d.tura})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="drivers-filter-item">
                <div className="drivers-filter-icon">📅</div>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="drivers-month-select">
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="drivers-filter-item">
                <div className="drivers-filter-icon">🗓️</div>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="drivers-year-select">
                  {YEARS.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        <div className="drivers-table-wrapper">
          {loading ? (
            <div className="drivers-table-loading" data-testid="drivers-loading">
              {[...Array(12)].map((_, i) => <SkeletonCell key={i} width={80} height={32} />)}
            </div>
          ) : !selectedDriver ? (
            <div className="drivers-empty">
              <p>Izaberite vozača da vidite izvještaj</p>
            </div>
          ) : driverDeliveries.length === 0 ? (
            <div className="drivers-empty">
              <p>Nema podataka za izabranog vozača u ovom periodu</p>
            </div>
          ) : (
            <table className="drivers-table">
              <thead>
                <tr className="drivers-table-header-row">
                  <th className="drivers-table-header-cell drivers-table-header-icon">📅</th>
                  <th className="drivers-table-header-cell drivers-table-header-icon">📍</th>
                  <th className="drivers-table-header-cell drivers-table-header-icon">📦</th>
                  <th className="drivers-table-header-cell drivers-table-header-icon">⬇️</th>
                  <th className="drivers-table-header-cell drivers-table-header-icon">⚠️</th>
                  <th className="drivers-table-header-cell drivers-table-header-icon">📊</th>
                  <th className="drivers-table-header-cell drivers-table-header-icon">⏱️</th>
                </tr>
                <tr className="drivers-table-header-labels">
                  <th className="drivers-table-header-cell">Datum</th>
                  <th className="drivers-table-header-cell">Stopovi</th>
                  <th className="drivers-table-header-cell">Paketi</th>
                  <th className="drivers-table-header-cell">Pickup</th>
                  <th className="drivers-table-header-cell">Reklamacije</th>
                  <th className="drivers-table-header-cell">Efikasnost</th>
                  <th className="drivers-table-header-cell">Stop/h</th>
                </tr>
              </thead>
              <tbody>
                {workdays.map(date => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  const dayData = driverDeliveries.find(d => d.date === dateString);
                  const isHoliday = holidays.some(h => h.date === dateString);
                  
                  // Koristi target_per_day iz drivers tabele
                  const getTargetStops = () => {
                    const driver = drivers.find(d => d.ime === selectedDriver);
                    return driver?.target_per_day || 0;
                  };
                  
                  const targetStops = getTargetStops();
                  
                  return (
                    <tr key={dateString} className={isHoliday ? 'holiday-row' : ''}>
                      <td className="drivers-date-cell">
                        {format(date, 'dd.MM.')}
                      </td>
                      <td className={(() => {
                        if (!dayData || !dayData.stops) return 'cell-empty';
                        return dayData.stops >= targetStops ? 'cell-green' : 'cell-red';
                      })()}>
                        {dayData?.stops || '–'}
                      </td>
                      <td className={dayData?.packages > 0 ? 'cell-green' : 'cell-empty'}>
                        {dayData?.packages || '–'}
                      </td>
                      <td className={dayData?.pickupPackages > 0 ? 'cell-green' : 'cell-empty'}>
                        {dayData?.pickupPackages || '–'}
                      </td>
                      <td className={(() => {
                        if (!dayData || dayData.complaints === null || dayData.complaints === undefined) return 'cell-empty';
                        if (dayData.complaints === 0) return 'cell-green';
                        return ''; // Uklanjamo cell-red klasu da ne interferira
                      })()} style={(() => {
                        if (dayData && dayData.complaints > 0) {
                          return { 
                            backgroundColor: blinkState ? '#ffffff' : '#f44336',
                            color: blinkState ? '#f44336' : '#ffffff',
                            fontWeight: '900',
                            fontSize: '1rem',
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            outline: blinkState ? '2px solid #f44336' : 'none',
                            outlineOffset: '-2px'
                          };
                        }
                        return {};
                      })()}>
                        {dayData?.complaints !== null && dayData?.complaints !== undefined ? dayData.complaints : '–'}
                      </td>
                      <td className={(() => {
                        if (!dayData || !dayData.percentage) return 'cell-empty';
                        return dayData.percentage >= 98 ? 'cell-green' : 'cell-red';
                      })()}>
                        {dayData?.percentage ? `${dayData.percentage.toFixed(2)} %` : '–'}
                      </td>
                      <td className={dayData?.stopsPerHour ? 'cell-green' : 'cell-empty'}>
                        {dayData?.stopsPerHour || '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          {/* Footer sa ukupno - samo ako ima podataka */}
          {selectedDriver && driverDeliveries.length > 0 && (
            <div className="drivers-footer">
              <div className="drivers-footer-row">
                <div className="drivers-footer-cell drivers-footer-label">
                  Ukupno
                </div>
                <div className={`drivers-footer-cell ${(() => {
                  const driver = drivers.find(d => d.ime === selectedDriver);
                  const target = driver?.target_per_day || 0;
                  const totalStops = driverDeliveries.reduce((sum, day) => sum + (day.produktivitaet_stops || 0), 0);
                  const workDays = driverDeliveries.length;
                  const bilans = totalStops - (workDays * target);
                  return bilans >= 0 ? 'cell-green' : 'cell-red';
                })()}`}>
                  {(() => {
                    const driver = drivers.find(d => d.ime === selectedDriver);
                    const target = driver?.target_per_day || 0;
                    const totalStops = driverDeliveries.reduce((sum, day) => sum + (day.stops || 0), 0);
                    const workDays = driverDeliveries.length;
                    const bilans = totalStops - (workDays * target);
                    return bilans > 0 ? `+${bilans}` : bilans;
                  })()}
                </div>
                <div className="drivers-footer-cell cell-green">
                  {driverDeliveries.reduce((sum, day) => sum + (day.packages || 0), 0)}
                </div>
                <div className="drivers-footer-cell cell-green">
                  {driverDeliveries.reduce((sum, day) => sum + (day.pickupPackages || 0), 0)}
                </div>
                <div className={`drivers-footer-cell ${(() => {
                  const totalReklamacije = driverDeliveries.reduce((sum, day) => sum + (day.complaints || 0), 0);
                  if (totalReklamacije === 0) return 'cell-green';
                  return ''; // Uklanjamo cell-red klasu
                })()}`} style={(() => {
                  const totalReklamacije = driverDeliveries.reduce((sum, day) => sum + (day.complaints || 0), 0);
                  if (totalReklamacije > 0) {
                    return { 
                      backgroundColor: blinkState ? '#ffffff' : '#f44336',
                      color: blinkState ? '#f44336' : '#ffffff',
                      fontWeight: '900',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      transition: 'all 0.3s',
                      borderRadius: '8px',
                      margin: '0 2px',
                      outline: blinkState ? '2px solid #f44336' : 'none',
                      outlineOffset: '-2px'
                    };
                  }
                  return {};
                })()}>
                  {driverDeliveries.reduce((sum, day) => sum + (day.complaints || 0), 0)}
                </div>
                <div className="drivers-footer-cell cell-green">
                  {(() => {
                    const efficiencyData = driverDeliveries.filter(day => day.percentage && day.percentage > 0);
                    const avgEfficiency = efficiencyData.length > 0 
                      ? Math.round(efficiencyData.reduce((sum, day) => sum + day.percentage, 0) / efficiencyData.length)
                      : 0;
                    return avgEfficiency > 0 ? `${avgEfficiency}%` : '-';
                  })()}
                </div>
                <div className="drivers-footer-cell cell-green">
                  {(() => {
                    // Račun prosjeka Stop/h - uzimamo samo dane sa podacima
                    const validStopH = driverDeliveries.filter(day => day.stopsPerHour && parseFloat(day.stopsPerHour) > 0);
                    const avgStopH = validStopH.length > 0 
                      ? (validStopH.reduce((sum, day) => sum + parseFloat(day.stopsPerHour), 0) / validStopH.length).toFixed(2)
                      : '-';
                    return avgStopH !== 'NaN' ? avgStopH : '-';
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
        {modalVisible && (
          <ModernModal onClose={() => setModalVisible(false)}>
            <div className="drivers-modal-form">
              <h2>Novi vozač</h2>
              {/* Ovdje ide forma za dodavanje vozača */}
              <button onClick={() => setModalVisible(false)}>Zatvori</button>
            </div>
          </ModernModal>
        )}
      </div>
    </div>
  );
}
