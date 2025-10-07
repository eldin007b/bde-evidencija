import React, { useState, useEffect } from 'react';
import { IconStats, IconDriver, IconSettings, IconTruck } from '../components/common/Icons.jsx';
import styles from './AdminPanelScreen.module.css';
import '../screens/ModernDesignSystem.css';
import CloseButton from '../components/common/CloseButton.jsx';
import RidesTab from '../components/admin/RidesTab.jsx';
import DriversTab from '../components/admin/DriversTab.jsx';
import GitHubTab from '../components/admin/GitHubTab.jsx';
import SystemTab from '../components/admin/SystemTab.jsx';
import useDrivers from '../hooks/useDrivers.js';
import { supabase } from '../db/supabaseClient';

export default function AdminPanelScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalDeliveries: 0,
    totalExtraRides: 0,
    activeDrivers: 0,
    totalDrivers: 0,
    pendingRides: 0,
    completedToday: 0,
    lastWeekComparison: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { drivers } = useDrivers();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Učitaj podatke iz localStorage cache-a koji se koriste u sidebar-u (Cell 5)
        const monthlyPerformanceData = localStorage.getItem('monthlyPerformance');
        const performanceData = monthlyPerformanceData ? JSON.parse(monthlyPerformanceData) : {};
        const currentMonth = new Date().getMonth();
        const currentMonthData = performanceData[currentMonth] || { value: 0, change: 0 };
        
        // Učitaj statistics cache koji se koristi u HomeScreen/SidebarModern
        const statsCache = JSON.parse(localStorage.getItem('driverStatsCache') || '{}');
        const todayStats = Object.values(statsCache).find(cache => 
          cache.stats && cache.stats[0] && cache.stats[0].label?.includes('Danas')
        );
        const completedToday = todayStats?.stats[0]?.value || 0;
        
        // Paralelno dohvaćanje ostalih podataka
        const [
          extraRidesResult,
          pendingRidesResult
        ] = await Promise.all([
          // Ukupno extra vožnji (odobrene)
          supabase.from('extra_rides').select('id', { count: 'exact' }),
          
          // Pending extra vožnje
          supabase.from('extra_rides_pending').select('id', { count: 'exact' })
        ]);

        // Kalkulacija aktivnih vozača
        const activeDriversCount = drivers.filter(driver => driver.aktivan).length;
        const totalDriversCount = drivers.length;

        setDashboardStats({
          totalDeliveries: currentMonthData.value || 0, // Iz Cell 5 cache-a (monthlyPerformance)
          totalExtraRides: extraRidesResult.count || 0,
          activeDrivers: activeDriversCount,
          totalDrivers: totalDriversCount,
          pendingRides: pendingRidesResult.count || 0,
          completedToday: completedToday, // Iz sidebar cache-a (driverStatsCache)
          lastWeekComparison: 0 // Uklonili prethodne upite koji nisu potrebni
        });

      } catch (error) {
        console.error('Greška pri dohvaćanju dashboard podataka:', error);
      } finally {
        setLoading(false);
      }
    };

    if (drivers.length > 0) {
      fetchDashboardData();
    }
  }, [drivers]);

  return (
    <div className={styles.screenContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <IconSettings className={styles.titleIcon} />
            <h1 className={styles.title}>Admin Panel</h1>
          </div>
          <CloseButton />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tab} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <IconStats className={styles.tabIcon} />
            Dashboard
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <IconDriver className={styles.tabIcon} />
            Korisnici
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'rides' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('rides')}
          >
            <IconTruck className={styles.tabIcon} />
            Vožnje
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <IconSettings className={styles.tabIcon} />
            Sistem
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'github' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <IconSettings className={styles.tabIcon} />
            GitHub
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'dashboard' && (
            <div className={styles.dashboardContent}>
              <div className={styles.card}>
                <h2>📊 Pregled sistema u realnom vremenu</h2>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-on-dark)' }}>
                    🔄 Učitavanje podataka...
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {/* Dostave trenutnog mjeseca (iz Cell 5) */}
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(68, 202, 223, 0.1)', borderRadius: '12px', border: '1px solid rgba(68, 202, 223, 0.2)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#44cadf' }}>{dashboardStats.totalDeliveries}</div>
                      <div style={{ color: 'var(--text-on-dark)', opacity: 0.9 }}>Dostave (ovaj mjesec)</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                        📅 Danas: {dashboardStats.completedToday}
                      </div>
                    </div>
                    
                    {/* Aktivni vozači */}
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{dashboardStats.activeDrivers}</div>
                      <div style={{ color: 'var(--text-on-dark)', opacity: 0.9 }}>Aktivni vozači</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                        👥 Od ukupno {dashboardStats.totalDrivers}
                      </div>
                    </div>
                    
                    {/* Extra vožnje */}
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7' }}>{dashboardStats.totalExtraRides}</div>
                      <div style={{ color: 'var(--text-on-dark)', opacity: 0.9 }}>Extra vožnje</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                        ⏳ Pending: {dashboardStats.pendingRides}
                      </div>
                    </div>
                    
                    {/* Uspešnost (kalkulisana) */}
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                        {dashboardStats.totalDeliveries > 0 ? 
                          ((dashboardStats.totalDeliveries / (dashboardStats.totalDeliveries + dashboardStats.pendingRides)) * 100).toFixed(1) 
                          : '0'}%
                      </div>
                      <div style={{ color: 'var(--text-on-dark)', opacity: 0.9 }}>Uspešnost</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                        📈 Trend pozitivan
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dodatni insightful podaci */}
              <div className={styles.card}>
                <h2>📈 Analitika performansi</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {/* Prosjek po vozaču za trenutni mjesec (iz Cell 5 podataka) */}
                  <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 style={{ color: '#44cadf', marginBottom: '0.5rem', fontSize: '1rem' }}>🎯 Prosjek po vozaču (mjesec)</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-on-dark)' }}>
                      {dashboardStats.activeDrivers > 0 ? 
                        Math.round(dashboardStats.totalDeliveries / dashboardStats.activeDrivers) 
                        : 0} dostava
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                      baziran na Cell 5 podacima
                    </div>
                  </div>
                  
                  {/* Današnja aktivnost (iz sidebar cache-a) */}
                  <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 style={{ color: '#22c55e', marginBottom: '0.5rem', fontSize: '1rem' }}>📅 Današnja aktivnost</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-on-dark)' }}>
                      {dashboardStats.completedToday} dostava
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                      📈 Podaci iz sidebar cache-a
                    </div>
                  </div>
                  
                  {/* Pending status */}
                  <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 style={{ color: '#ffc107', marginBottom: '0.5rem', fontSize: '1rem' }}>⏳ Čeka odobrenje</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-on-dark)' }}>
                      {dashboardStats.pendingRides} vožnji
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-on-dark)', opacity: 0.7, marginTop: '4px' }}>
                      {dashboardStats.pendingRides > 5 ? '🚨 Potrebna pažnja' : '✅ Pod kontrolom'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className={styles.card}>
                <h2>⚡ Brze akcije</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <button 
                    onClick={() => setActiveTab('rides')} 
                    style={{ 
                      padding: '1rem 1.5rem', 
                      background: 'linear-gradient(145deg, #44cadf, #22d3ee)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    🚛 Upravljaj vožnjama
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')} 
                    style={{ 
                      padding: '1rem 1.5rem', 
                      background: 'linear-gradient(145deg, #22c55e, #16a34a)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    👤 Upravljaj korisnicima
                  </button>
                  <button 
                    onClick={() => setActiveTab('github')} 
                    style={{ 
                      padding: '1rem 1.5rem', 
                      background: 'linear-gradient(145deg, #a855f7, #9333ea)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    🚀 GitHub Actions
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && <DriversTab />}

          {activeTab === 'rides' && <RidesTab />}

          {activeTab === 'github' && <GitHubTab />}

          {activeTab === 'settings' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}