import React, { useState, useEffect } from 'react';
import { IconStats, IconDriver, IconSettings, IconTruck } from '../components/common/Icons.jsx';
import styles from './AdminPanelScreen.module.css';
import '../screens/ModernDesignSystem.css';
import CloseButton from '../components/common/CloseButton.jsx';

import RidesTab from '../components/admin/RidesTab.jsx';
import DriversTab from '../components/admin/DriversTab.jsx';
import GitHubTab from '../components/admin/GitHubTab.jsx';
import SystemTab from '../components/admin/SystemTab.jsx';
import WorktimeTab from '../components/admin/WorktimeTab.jsx';

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
        const monthlyPerformanceData = localStorage.getItem('monthlyPerformance');
        const performanceData = monthlyPerformanceData ? JSON.parse(monthlyPerformanceData) : {};
        const currentMonth = new Date().getMonth();
        const currentMonthData = performanceData[currentMonth] || { value: 0 };

        const statsCache = JSON.parse(localStorage.getItem('driverStatsCache') || '{}');
        const todayStats = Object.values(statsCache).find(c => c.stats?.[0]?.label?.includes('Danas'));
        const completedToday = todayStats?.stats?.[0]?.value || 0;

        const [extraRidesResult, pendingRidesResult] = await Promise.all([
          supabase.from('extra_rides').select('id', { count: 'exact' }),
          supabase.from('extra_rides_pending').select('id', { count: 'exact' })
        ]);

        const activeDriversCount = drivers.filter(d => d.aktivan).length;

        setDashboardStats({
          totalDeliveries: currentMonthData.value || 0,
          totalExtraRides: extraRidesResult.count || 0,
          activeDrivers: activeDriversCount,
          totalDrivers: drivers.length,
          pendingRides: pendingRidesResult.count || 0,
          completedToday,
          lastWeekComparison: 0
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (drivers.length) fetchDashboardData();
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
          <button className={`${styles.tab} ${activeTab === 'dashboard' ? styles.activeTab : ''}`} onClick={() => setActiveTab('dashboard')}>
            <IconStats className={styles.tabIcon} /> Dashboard
          </button>

          <button className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`} onClick={() => setActiveTab('users')}>
            <IconDriver className={styles.tabIcon} /> Korisnici
          </button>

          <button className={`${styles.tab} ${activeTab === 'rides' ? styles.activeTab : ''}`} onClick={() => setActiveTab('rides')}>
            <IconTruck className={styles.tabIcon} /> Vožnje
          </button>

          {/* NOVI TAB */}
          <button className={`${styles.tab} ${activeTab === 'worktime' ? styles.activeTab : ''}`} onClick={() => setActiveTab('worktime')}>
            🕒 Evidencija rada
          </button>

          <button className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`} onClick={() => setActiveTab('settings')}>
            <IconSettings className={styles.tabIcon} /> Sistem
          </button>

          <button className={`${styles.tab} ${activeTab === 'github' ? styles.activeTab : ''}`} onClick={() => setActiveTab('github')}>
            <IconSettings className={styles.tabIcon} /> GitHub
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'dashboard' && <div className={styles.dashboardContent}>/* OSTATAK DASHBOARDA OSTAO ISTI */</div>}
          {activeTab === 'users' && <DriversTab />}
          {activeTab === 'rides' && <RidesTab />}
          {activeTab === 'worktime' && <WorktimeTab />}
          {activeTab === 'github' && <GitHubTab />}
          {activeTab === 'settings' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}
