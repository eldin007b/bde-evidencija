// src/screens/HomeScreenModern.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeaderModern from '../components/shared/AppHeaderModern';
import SidebarModern from '../components/shared/SidebarModern';
import MapCardModern from '../components/shared/MapCardModern';
import MapView from '../components/shared/MapView';
import PageLayout from '../components/shared/PageLayout';
import useDrivers from '../hooks/useDrivers';
import useAuth from '../hooks/useAuth';
import { supabase } from '../db/supabaseClient';
import { format } from 'date-fns';
import LoginModal from '../components/common/LoginModal';
import AdminLoginModal from '../components/AdminLoginModal';
import Toast from '../components/shared/Toast';
import styles from './HomeScreenModern.module.css';
import './ModernDesignSystem.css';

// Mjeseci na bosanskom/hrvatskom/srpskom
const mjeseci = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];
const currentMonth = mjeseci[new Date().getMonth()];
const currentYear = new Date().getFullYear();

const HomeScreenModern = () => {
  const navigate = useNavigate();
  const mapRef = useRef();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState({ 
    address: '', city: '', lat: null, lon: null 
  });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [currentDriverIndex, setCurrentDriverIndex] = useState(0);
  const [driverStats, setDriverStats] = useState([]);
  const [geolocationError, setGeolocationError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const [mobileSidebarTop, setMobileSidebarTop] = useState(null);
  // small gap to leave between mobile nav icons and the sidebar (px)
  const MOBILE_SIDEBAR_GAP = 20;
  const [statsLoading, setStatsLoading] = useState(false);

  const statsCacheRef = useRef({});
  const { currentUser, isAuthenticated, logout, authenticate } = useAuth();
  const { drivers, loading: driversLoading } = useDrivers();

  // Memoizovane konstante
  const memoizedCurrentMonth = useMemo(() => currentMonth, []);
  const memoizedCurrentYear = useMemo(() => currentYear, []);

  const getTargetStops = useCallback((tura) => {
    if (tura === '8610') return 50;
    if (tura === '8620' || tura === '8630') return 85;
    if (tura === '8640') return 80;
    return 50;
  }, []);

  const loadDriverStats = useCallback(async (driver) => {
    if (!driver || !driver.tura) return;
    const tura = driver.tura;
    const today = format(new Date(), 'yyyy-MM-dd');
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
      const monthStart = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const monthEnd = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      const yearStart = format(new Date(currentDate.getFullYear(), 0, 1), 'yyyy-MM-dd');
      const yearEnd = format(new Date(currentDate.getFullYear(), 11, 31), 'yyyy-MM-dd');

      const { data: lastDayData } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver', driver.tura)
        .eq('deleted', 0)
        .order('date', { ascending: false })
        .limit(1);

      const lastDay = lastDayData?.[0]?.date ? (
        typeof lastDayData[0].date === 'string' ? lastDayData[0].date.slice(0, 10) : format(currentDate, 'yyyy-MM-dd')
      ) : format(currentDate, 'yyyy-MM-dd');

      const [dayResult, monthResult, yearResult] = await Promise.all([
        supabase.from('deliveries').select('*').eq('driver', driver.tura).gte('date', `${lastDay}T00:00:00`).lte('date', `${lastDay}T23:59:59`).eq('deleted', 0),
        supabase.from('deliveries').select('*').eq('driver', driver.tura).gte('date', monthStart).lte('date', monthEnd).eq('deleted', 0),
        supabase.from('deliveries').select('*').eq('driver', driver.tura).gte('date', yearStart).lte('date', yearEnd).eq('deleted', 0)
      ]);

      const targetStops = getTargetStops(driver.tura);
      const calculate = (data, period) => {
        if (!data || data.length === 0) return { packages: 0, diff: period === 'day' ? -targetStops : 0, complaints: 0, date: period === 'day' ? lastDay : null };
        const packages = data.reduce((s, it) => s + (parseInt(it?.produktivitaet_stops || 0, 10) || 0), 0);
        const complaints = data.reduce((s, it) => s + (parseInt(it?.probleme_druga || 0, 10) || 0), 0);
        if (period === 'day') return { packages, diff: packages - targetStops, complaints, date: lastDay };
        const uniqueDays = new Set(data.map(item => {
          if (!item?.date) return null;
          return typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10);
        }).filter(Boolean)).size || 0;
        const target = uniqueDays * targetStops;
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
      console.error('HomeScreenModern: Error loading stats', error);
      setDriverStats([]);
    } finally {
      setStatsLoading(false);
    }
  }, [getTargetStops, memoizedCurrentMonth, memoizedCurrentYear]);

  useEffect(() => {
    if (selectedDriver) loadDriverStats(selectedDriver);
  }, [selectedDriver, loadDriverStats]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Measure header + nav and set top for mobile sidebar when opened
  useEffect(() => {
    // Compute top with retries to allow the mobile nav to expand (CSS transform) before measuring.
    const computeTopWithRetry = () => {
      let attempts = 0;
      const maxAttempts = 8;
      const attemptDelay = 40; // ms

      const attempt = () => {
        attempts += 1;
        try {
          const headerRect = headerRef.current ? headerRef.current.getBoundingClientRect() : null;
          const navRect = navRef.current ? navRef.current.getBoundingClientRect() : null;
          // If nav exists, compute bottom based on its visible child items (buttons) so sidebar starts below icons
          if (navRect) {
            const navButtons = navRef.current.querySelectorAll('button');
            let maxBottom = navRect.bottom;
            navButtons.forEach((btn) => {
              try {
                const r = btn.getBoundingClientRect();
                if (r.bottom > maxBottom) maxBottom = r.bottom;
              } catch (err) {
                /* ignore */
              }
            });

            const computedHeight = Math.max(0, maxBottom - navRect.top);
            // If nav appears collapsed (very small height), retry shortly until transform completes
            if (computedHeight < 12 && attempts < maxAttempts) {
              requestAnimationFrame(() => setTimeout(attempt, attemptDelay));
              return;
            }
            // include nav's computed padding-bottom (if any) so sidebar starts after visual nav area
            let extraPad = 0;
            try {
              const navStyle = window.getComputedStyle(navRef.current);
              extraPad = parseFloat(navStyle.paddingBottom || '0') || 0;
            } catch (err) {
              extraPad = 0;
            }
            const topWithGap = maxBottom + extraPad + MOBILE_SIDEBAR_GAP;
            setMobileSidebarTop(Math.ceil(topWithGap));
          } else {
            const top = headerRect ? headerRect.bottom : 0;
            setMobileSidebarTop(Math.ceil(top + MOBILE_SIDEBAR_GAP));
          }
        } catch (e) {
          setMobileSidebarTop(0);
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
    if (isMobile && sidebarOpen) {
      cleanup = computeTopWithRetry();
    } else {
      // reset so we don't render the mobile sidebar until we computed its top
      setMobileSidebarTop(null);
    }

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [isMobile, sidebarOpen]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setGeolocationError('Lokacija nije dostupna')
      );
    }
  }, []);

  useEffect(() => {
    if (drivers?.length > 0) {
      const driverTura = localStorage.getItem('DRIVER_TURA');
      const driverToSelect = drivers.find(d => d.tura === driverTura) || drivers[0];
      setSelectedDriver(driverToSelect);
      setCurrentDriverIndex(drivers.findIndex(d => d.tura === driverToSelect.tura));
    }
  }, [drivers]);

  const handleDriverSwitch = useCallback(() => {
    if (!drivers || drivers.length <= 1) return;
    const nextIndex = (currentDriverIndex + 1) % drivers.length;
    const nextDriver = drivers[nextIndex];
    setSelectedDriver(nextDriver);
    setCurrentDriverIndex(nextIndex);
    localStorage.setItem('DRIVER_TURA', nextDriver.tura);
    // show a quick toast to indicate the driver was changed
    setToastMessage(`Vozač promijenjen: ${nextDriver?.ime || nextDriver?.tura || '—'}`);
    setToastOpen(true);
    // Do NOT close the mobile sidebar/menu here — keep it open so the user sees updated status
  }, [drivers, currentDriverIndex]);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogout = useCallback(() => {
    logout();
    setSelectedDriver(null);
    localStorage.removeItem('DRIVER_TURA');
    navigate('/');
  }, [logout, navigate]);

  const handleLoginSuccess = (userData) => setShowLoginModal(false);

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
        <AppHeaderModern
          user={{ name: 'N/A', points: 'N/A' }}
          onLogout={handleLogout}
          onAdminAccess={() => setShowAdminLogin(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🚚</div>
          <h3>Nema dostupnih vozača</h3>
          <p>Dodajte vozače u sistem da biste počeli koristiti aplikaciju</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.homeScreenModern} ${sidebarOpen ? styles.homeScreenModernSidebarOpen : ''}`}>
  <AppHeaderModern
        user={{
          name: currentUser?.name || currentUser?.ime || currentUser?.username || 'Vozač',
          points: currentUser?.username || currentUser?.tura || '--'
        }}
        onLogout={handleLogout}
        onAdminAccess={() => setShowAdminLogin(true)}
        onToggleSidebar={(val) => {
          if (typeof val === 'boolean') setSidebarOpen(val);
          else setSidebarOpen(prev => !prev);
        }}
        isSidebarOpen={sidebarOpen}
        headerRef={headerRef}
        navRef={navRef}
      />

      <div className={styles.mainGrid}>
        {!isMobile && (
          <aside className={styles.sidebarColumn}>
            <SidebarModern
              stats={formatStats()}
              user={selectedDriver}
              onSwitchDriver={handleDriverSwitch}
              isLoading={statsLoading}
            />
          </aside>
        )}

        <main className={styles.mapColumn}>
          <div className={styles.mapContainer}>
            <MapCardModern
              title="Mapa dostave - Austrija"
              mapRef={mapRef}
              address={selectedAddress.address}
              city={selectedAddress.city}
              selectedMarker={selectedAddress}
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
      </div>

      {isMobile && sidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile fixed sidebar container: appears below header/nav and fills to bottom */}
      {isMobile && sidebarOpen && mobileSidebarTop != null && (
        <div
          className={styles.mobileSidebarContainer}
          style={{ top: `${mobileSidebarTop}px` }}
          aria-hidden={!sidebarOpen}
        >
          <SidebarModern
            stats={formatStats()}
            user={selectedDriver}
            onSwitchDriver={handleDriverSwitch}
            isLoading={statsLoading}
          />
        </div>
      )}

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
              alert('Uspješno prijavljen, ali nemate administratorski pristup.');
            }
          } catch (err) {
            console.error('Admin login failed', err);
            alert(err?.message || 'Neuspjela prijava. Provjerite korisničko ime i lozinku.');
          }
        }}
      />
      <Toast
        isOpen={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default HomeScreenModern;