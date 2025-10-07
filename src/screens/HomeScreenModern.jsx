// src/screens/HomeScreenModern.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import SidebarModern from '../components/shared/SidebarModern';
import MapCardModern from '../components/shared/MapCardModern';
import MapView from '../components/shared/MapView';
import useDrivers from '../hooks/useDrivers';
import useAuth from '../hooks/useAuth';
import { supabase } from '../db/supabaseClient';
import Toast from '../components/shared/Toast';
import LoginModal from '../components/common/LoginModal';
import AdminLoginModal from '../components/AdminLoginModal';
import styles from './HomeScreenModern.module.css';
import './ModernDesignSystem.css';

const mjeseci = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];
const currentMonth = mjeseci[new Date().getMonth()];
const currentYear = new Date().getFullYear();

const HomeScreenModern = () => {
  const navigate = useNavigate();
  const mapRef = useRef();

  // State
  const [showSidebar, setShowSidebar] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState({ address: '', city: '', lat: null, lon: null });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [currentDriverIndex, setCurrentDriverIndex] = useState(0);
  const [driverStats, setDriverStats] = useState([]);
  const [geolocationError, setGeolocationError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarTop, setMobileSidebarTop] = useState(null);
  const MOBILE_SIDEBAR_GAP = 20;
  const [statsLoading, setStatsLoading] = useState(false);
  const [headerHeightPx, setHeaderHeightPx] = useState(60);
  const statsCacheRef = useRef({});
  const { currentUser, isAuthenticated, logout, authenticate } = useAuth();
  const { drivers, loading: driversLoading } = useDrivers();

  // Toast
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  // Memo
  const memoizedCurrentMonth = useMemo(() => currentMonth, []);
  const memoizedCurrentYear = useMemo(() => currentYear, []);

  // Geolokacija
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setGeolocationError('Lokacija nije dostupna')
      );
    }
  }, []);

  // Responsive
  useEffect(() => {
    const handleResize = () => {
  const mobile = window.innerWidth < 768;
  setIsMobile(mobile);
  if (!mobile && showSidebar) setShowSidebar(false);
      try {
        const h = document.querySelector('.app-header');
        const hh = h ? Math.ceil(h.getBoundingClientRect().height) : (window.innerWidth < 640 ? 54 : 56);
        setHeaderHeightPx(hh);
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar]);

  // Sidebar events
  useEffect(() => {
    const openHandler = () => { if (window.innerWidth < 768) setShowSidebar(true); };
    const toggleHandler = () => { if (window.innerWidth < 768) setShowSidebar(prev => !prev); };
    const closeHandler = () => { if (window.innerWidth < 768) setShowSidebar(false); };
    window.addEventListener('homeSidebarOpen', openHandler);
    window.addEventListener('homeSidebarToggle', toggleHandler);
    window.addEventListener('homeSidebarClose', closeHandler);
    return () => {
      window.removeEventListener('homeSidebarOpen', openHandler);
      window.removeEventListener('homeSidebarToggle', toggleHandler);
      window.removeEventListener('homeSidebarClose', closeHandler);
    };
  }, []);

  // Mobile sidebar top
  useEffect(() => {
    const computeTopWithRetry = () => {
      let attempts = 0;
      const maxAttempts = 8;
      const attemptDelay = 40;
      const attempt = () => {
        attempts += 1;
        try {
          const appHeader = document.querySelector('.app-header');
          const headerRect = appHeader ? appHeader.getBoundingClientRect() : null;
          if (headerRect) {
            const topWithGap = headerRect.bottom + MOBILE_SIDEBAR_GAP;
            setMobileSidebarTop(Math.ceil(topWithGap));
          } else {
            setMobileSidebarTop(headerHeightPx + MOBILE_SIDEBAR_GAP);
          }
        } catch (e) {
          setMobileSidebarTop(headerHeightPx + MOBILE_SIDEBAR_GAP);
        }
      };
      attempt();
      const onResize = () => attempt();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
      };
    };
    let cleanup = null;
    if (isMobile && showSidebar) {
      cleanup = computeTopWithRetry();
    } else {
      setMobileSidebarTop(null);
    }
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [isMobile, showSidebar, headerHeightPx]);

  // Lock body scroll for mobile sidebar
  useEffect(() => {
    const cls = 'no-scroll-overlay';
    if (isMobile && showSidebar) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [isMobile, showSidebar]);

  // Drivers & localStorage
  useEffect(() => {
    if (drivers?.length > 0) {
      const driverTura = localStorage.getItem('DRIVER_TURA');
      const driverToSelect = drivers.find(d => d.tura === driverTura) || drivers[0];
      setSelectedDriver(driverToSelect);
      setCurrentDriverIndex(drivers.findIndex(d => d.tura === driverToSelect.tura));
    }
  }, [drivers]);

  // Driver switch
  const handleDriverSwitch = useCallback(() => {
  if (!drivers || drivers.length <= 1) return;
  const nextIndex = (currentDriverIndex + 1) % drivers.length;
  const nextDriver = drivers[nextIndex];
  localStorage.setItem('DRIVER_TURA', nextDriver.tura);
  setSelectedDriver(nextDriver);
  setCurrentDriverIndex(nextIndex);
  }, [drivers, currentDriverIndex]);

  // Sidebar toggle handler (move to top level)
  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  // Logout
  const handleLogout = useCallback(() => {
    logout();
    setSelectedDriver(null);
    localStorage.removeItem('DRIVER_TURA');
    navigate('/');
  }, [logout, navigate]);

  // Login modal
  const handleLoginSuccess = () => setShowLoginModal(false);

  // Stats
  const getTargetStops = useCallback((tura) => {
    if (tura === '8610') return 50;
    if (tura === '8620' || tura === '8630') return 85;
    if (tura === '8640') return 80;
    return 50;
  }, []);

  const loadDriverStats = useCallback(async (driver) => {
  if (!driver || !driver.tura) return;
  const tura = driver.tura;
  const currentDate = new Date();
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const currentMonthKey = today.slice(0, 7);
  const currentYearKey = today.slice(0, 4);
    const cached = statsCacheRef.current[tura];
    if (cached && cached.dayDate === today && cached.monthKey === currentMonthKey && cached.year === currentYearKey) {
      setDriverStats(cached.stats);
      return;
    }
    setStatsLoading(true);
    try {
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10);
      const yearStart = new Date(currentDate.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const yearEnd = new Date(currentDate.getFullYear(), 11, 31).toISOString().slice(0, 10);
      const { data: lastDayData } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver', driver.tura)
        .eq('deleted', 0)
        .order('date', { ascending: false })
        .limit(1);
      const lastDay = lastDayData?.[0]?.date ? (
        typeof lastDayData[0].date === 'string' ? lastDayData[0].date.slice(0, 10) : today
      ) : today;
      const [dayResult, monthResult, yearResult] = await Promise.all([
        supabase.from('deliveries').select('*').eq('driver', driver.tura).gte('date', `${lastDay}T00:00:00`).lte('date', `${lastDay}T23:59:59`).eq('deleted', 0),
        supabase.from('deliveries').select('*').eq('driver', driver.tura).gte('date', monthStart).lte('date', monthEnd).eq('deleted', 0),
        supabase.from('deliveries').select('*').eq('driver', driver.tura).gte('date', yearStart).lte('date', yearEnd).eq('deleted', 0)
      ]);
      const targetStops = getTargetStops(driver.tura);
      const calculate = (data, period) => {
      if (period === 'month') {
        console.log('RAW monthResult.data', data);
      }
      if (!data || data.length === 0) return { packages: 0, diff: period === 'day' ? -targetStops : 0, complaints: 0, date: period === 'day' ? lastDay : null };
      let filteredData = data;
      if (period === 'month') {
        // Filter: samo tekući mjesec, vozač, deleted=0, broj paketa > 0, validan datum
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        filteredData = data.filter(item => {
          // validacija datuma
          if (!item?.date) return false;
          const dateStr = typeof item.date === 'string' ? item.date.slice(0, 10) : item.date;
          const d = new Date(dateStr);
          // validacija paketa
          const paketi = item.zustellung_paketi;
          const validPaketi = paketi !== undefined && paketi !== null && paketi !== '' && !isNaN(Number(paketi)) && Number(paketi) > 0;
          // validacija vozača i deleted
          const pass = d.getFullYear() === year && d.getMonth() === month && item.driver == driver.tura && item.deleted == 0 && validPaketi;
          console.log('FILTER month', {date: item.date, dateStr, year: d.getFullYear(), month: d.getMonth(), paketi, validPaketi, pass});
          return pass;
        });
      } else if (period === 'year') {
        filteredData = data.filter(item => parseInt(item?.produktivitaet_stops || 0, 10) > 0);
      } else if (period === 'day') {
        filteredData = data.filter(item => parseInt(item?.produktivitaet_stops || 0, 10) > 0);
      }
      const packages = filteredData.reduce((s, it) => s + (parseInt(it?.produktivitaet_stops || 0, 10) || 0), 0);
      const complaints = filteredData.reduce((s, it) => s + (parseInt(it?.probleme_druga || 0, 10) || 0), 0);
      const uniqueDays = new Set(filteredData.map(item => {
        if (!item?.date) return null;
        return typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10);
      }).filter(Boolean)).size || 0;
      const target = uniqueDays * targetStops;
      
      if (period === 'day') return { packages, diff: packages - targetStops, complaints, date: lastDay };
      return { packages, diff: packages - target, complaints, date: null };
    };
      const day = calculate(dayResult.data, 'day');
      const month = calculate(monthResult.data, 'month');
      const year = calculate(yearResult.data, 'year');
      const newStats = [
        { label: `Dostava (${day.date || ''})`, value: day.diff, complaints: day.complaints },
        { label: `Reklamacije (${day.date || ''})`, value: day.complaints },
        { label: `Dostava za ${memoizedCurrentMonth}`, value: month.diff, complaints: month.complaints },
        { label: `Reklamacije za ${memoizedCurrentMonth}`, value: month.complaints },
        { label: `Dostava za ${memoizedCurrentYear}`, value: year.diff, complaints: year.complaints },
        { label: `Reklamacije za ${memoizedCurrentYear}`, value: year.complaints }
      ];
      statsCacheRef.current[tura] = {
        dayDate: today,
        monthKey: currentMonthKey,
        year: currentYearKey,
        stats: newStats
      };
      setDriverStats(newStats);
    } catch (error) {
      setDriverStats([]);
    } finally {
      setStatsLoading(false);
    }
  }, [getTargetStops, memoizedCurrentMonth, memoizedCurrentYear]);

  useEffect(() => {
    if (selectedDriver) loadDriverStats(selectedDriver);
  }, [selectedDriver, loadDriverStats]);

  // Format stats for SidebarModern
  const formatStats = useCallback(() => {
    if (statsLoading) return Array(6).fill({ label: 'Učitavanje...', value: '--', trend: 'neutral' });
    if (!driverStats?.length) return Array(6).fill({ label: '--', value: '--', trend: 'neutral' });
    return driverStats.slice(0, 6).map(s => ({
      label: s.label || '--',
      value: s.value !== undefined ? s.value : '--',
      trend: typeof s.value === 'number' ? (s.value > 0 ? 'positive' : s.value < 0 ? 'negative' : 'neutral') : 'neutral'
    }));
  }, [driverStats, statsLoading]);

  // Loading state
  if (driversLoading) {
    return (
      <div className={styles.homeScreenModern}>
        <div className={styles.loading}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}></div>
            <p>Učitavam podatke...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!driversLoading && (!drivers || drivers.length === 0)) {
    return (
      <div className={styles.homeScreenModern}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🚚</div>
          <h3>Nema dostupnih vozača</h3>
          <p>Dodajte vozače u sistem da biste počeli koristiti aplikaciju</p>
        </div>
      </div>
    );
  }

  const isMobileScreen = isMobile;

  return (
  <div className={`${styles.homeScreenModern} ${isMobileScreen ? styles.mobileClean : ''} ${showSidebar ? styles.homeScreenModernSidebarOpen : ''}`}>
    <div className={styles.mainGrid}>
      {/* Prikaz sidebar-a ili mape ovisno o switchu */}
      {isMobile ? (
        showSidebar ? (
          <aside className={styles.sidebarColumn}>
            <SidebarModern
              stats={formatStats()}
              user={selectedDriver}
              onSwitchDriver={handleDriverSwitch}
              isLoading={statsLoading}
              onLogout={handleLogout}
            />
          </aside>
        ) : (
          <main className={styles.mapColumn}>
            <div className={styles.mapContainer}>
              <MapCardModern
                title="Mapa dostave - Austrija"
                mapRef={mapRef}
                address={selectedAddress.address}
                city={selectedAddress.city}
                selectedMarker={selectedAddress}
                headerHeight={headerHeightPx}
                onNavigate={(addressOrObj) => {
                  if (addressOrObj && typeof addressOrObj === 'object' && typeof addressOrObj.lat === 'number' && typeof addressOrObj.lon === 'number') {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${addressOrObj.lat},${addressOrObj.lon}`)}&travelmode=driving`, '_blank');
                    return;
                  }
                  if (addressOrObj) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrObj)}`, '_blank');
                  }
                }}
                onSearchSelect={setSelectedAddress}
                onLocateMe={setUserLocation}
              >
                <MapView
                  onAddressSelect={setSelectedAddress}
                  mapRef={mapRef}
                  selectedMarker={selectedAddress}
                  userLocation={userLocation}
                />
              </MapCardModern>
            </div>
          </main>
        )
      ) : (
        <React.Fragment>
          <aside className={styles.sidebarColumn}>
            <SidebarModern
              stats={formatStats()}
              user={selectedDriver}
              onSwitchDriver={handleDriverSwitch}
              isLoading={statsLoading}
              onLogout={handleLogout}
            />
          </aside>
          <main className={styles.mapColumn}>
            <div className={styles.mapContainer}>
              <MapCardModern
                title="Mapa dostave - Austrija"
                mapRef={mapRef}
                address={selectedAddress.address}
                city={selectedAddress.city}
                selectedMarker={selectedAddress}
                headerHeight={headerHeightPx}
                onNavigate={(addressOrObj) => {
                  if (addressOrObj && typeof addressOrObj === 'object' && typeof addressOrObj.lat === 'number' && typeof addressOrObj.lon === 'number') {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${addressOrObj.lat},${addressOrObj.lon}`)}&travelmode=driving`, '_blank');
                    return;
                  }
                  if (addressOrObj) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrObj)}`, '_blank');
                  }
                }}
                onSearchSelect={setSelectedAddress}
                onLocateMe={setUserLocation}
              >
                <MapView
                  onAddressSelect={setSelectedAddress}
                  mapRef={mapRef}
                  selectedMarker={selectedAddress}
                  userLocation={userLocation}
                />
              </MapCardModern>
            </div>
          </main>
        </React.Fragment>
      )}
    </div>
      {/* Mobilni overlay i sidebar su sada kontrolisani preko showSidebar switcha */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={async (username, password) => {
          try {
            const user = await authenticate(username, password);
            setShowAdminLogin(false);
            if (user && (user.role === 'admin' || user.isAdminLogin)) {
              navigate('/admin');
            } else {
              setToast({ open: true, message: 'Uspješno prijavljen, ali nemate administratorski pristup.', type: 'warning' });
            }
          } catch (err) {
            setToast({ open: true, message: err?.message || 'Neuspjela prijava. Provjerite korisničko ime i lozinku.', type: 'error' });
          }
        }}
      />
      <Toast
        isOpen={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

export default HomeScreenModern;