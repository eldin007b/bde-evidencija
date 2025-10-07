// SidebarModern.jsx
import React, { useState } from 'react';
import styles from './SidebarModern-fixed.module.css';
import { IconToday, IconMonth, IconYear, IconTruck, IconTarget } from '../common/Icons';
import { IconCheckModern, IconXModern, IconArrowUpModern, IconArrowDownModern } from '../common/IconCheckModern';

const SidebarModern = ({ stats, user, onSwitchDriver, isLoading = false }) => {
  const [isSwitching, setIsSwitching] = useState(false);

  // Helpers to determine styling based on numeric values
  const toNumber = (val) => {
    if (val === null || val === undefined) return NaN;
    if (typeof val === 'number') return val;
    // remove any non-digit, non-dot, non-minus characters (commas are replaced with dot)
    const cleaned = String(val).replace(/,/g, '.').replace(/[^0-9.\-]/g, '').trim();
    if (cleaned === '') return NaN;
    const n = Number(cleaned);
    return isNaN(n) ? NaN : n;
  };

  // Odredi klasu boje za broj stopova
  const getStopClass = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return styles.neutral;
    if (n > 0) return styles.statGood;
    if (n < 0) return styles.statBad;
    return styles.neutral;
  };

  // Odredi klasu boje za broj reklamacija
  const getComplaintClass = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return styles.neutral;
    if (n === 0) return styles.statGood;
    if (n > 0) return styles.statBad;
    return styles.neutral;
  };

  // Modern ikone za stopove i reklamacije
  const getStopIcon = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return null;
    if (n > 0) return <IconArrowUpModern size={18} />;
    if (n < 0) return <IconArrowDownModern size={18} />;
    return null;
  };

  const getComplaintIcon = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return null;
    if (n === 0) return <IconCheckModern size={18} />;
    if (n > 0) return <IconXModern size={18} />;
    return null;
  };

  const handleDriverSwitch = () => {
    if (isSwitching || !onSwitchDriver) return;
    
    setIsSwitching(true);
    onSwitchDriver();
    
    setTimeout(() => setIsSwitching(false), 500);
  };

  // Formatiraj statistike za prikaz
  const formattedStats = Array.isArray(stats) && stats.length === 6 ? stats : [
    { label: 'Danas', value: '--', trend: 'neutral' },
    { label: 'Reklamacije', value: '--', trend: 'neutral' },
    { label: 'Ovaj mjesec', value: '--', trend: 'neutral' },
    { label: 'Reklamacije', value: '--', trend: 'neutral' },
    { label: 'Ova godina', value: '--', trend: 'neutral' },
    { label: 'Reklamacije', value: '--', trend: 'neutral' }
  ];

  const statCards = [
    { 
      title: 'Danas', 
      period: formattedStats[0]?.label || 'Danas',
      delivery: formattedStats[0],
      complaints: formattedStats[1],
      icon: <IconToday size={20} />
    },
    { 
      title: 'Ovaj mjesec', 
      period: formattedStats[2]?.label || 'Ovaj mjesec',
      delivery: formattedStats[2],
      complaints: formattedStats[3],
      icon: <IconMonth size={20} />
    },
    { 
      title: 'Ova godina', 
      period: formattedStats[4]?.label || 'Ova godina',
      delivery: formattedStats[4],
      complaints: formattedStats[5],
      icon: <IconYear size={20} />
    }
  ];

  return (
    <aside className={styles.sidebarModern}>
      {/* Driver Info Card - Clickable */}
      <div 
        className={`${styles.driverCardModern} ${isSwitching ? styles.switching + ' ' + styles.driverCardFade : ''}`}
        onClick={handleDriverSwitch}
        role="button"
        tabIndex={0}
        aria-label={`Promijeni vozača. Trenutno: ${user?.ime || 'N/A'}`}
      >
        <div className={styles.driverHeader}>
          <div className={styles.driverAvatar}>
            <IconTruck size={32} />
            {isSwitching && <div className={styles.loadingSpinner}></div>}
          </div>
          <div className={styles.driverInfo}>
            <h3 className={styles.driverName}>{user?.ime || 'Vozač'}</h3>
            <p className={styles.driverTour}>Tura: {user?.tura || '--'}</p>
          </div>
          <div className={styles.driverTarget}>
            <IconTarget size={18} />
            <span className={styles.targetValue}>{user?.target_per_day || '--'}</span>
            <span className={styles.targetLabel}>/dan</span>
          </div>
        </div>
        
        {/* driver hint removed per request */}
      </div>

      {/* Statistics Section */}
      <div className={styles.statsSectionModern}>
  {/* stats title removed per request */}
        
        <div className={styles.statsGridModern}>
          {statCards.map((card, index) => (
            <div key={index} className={styles.statCardModern}>
              <div className={styles.statHeader}>
                <span className={styles.statIcon}>{card.icon}</span>
                <span className={styles.statPeriod}>{card.period}</span>
              </div>
              
              <div className={styles.statContent}>
                <div className={styles.statRow}>
                  <div className={styles.statLabelContainer}>
                    <span className={styles.statLabel}>Stopova</span>
                  </div>
                  <span className={`${styles.statValue} ${getStopClass(card.delivery?.value)}`}>
                    {card.delivery?.value} {getStopIcon(card.delivery?.value)}
                  </span>
                </div>
                
                <div className={styles.statRow}>
                  <div className={styles.statLabelContainer}>
                    <span className={styles.statLabel}>Reklamacije</span>
                  </div>
                  <span className={`${styles.statValue} ${getComplaintClass(card.complaints?.value)} ${toNumber(card.complaints?.value) > 0 ? styles.warningPulse : ''}`}>
                    {card.complaints?.value} {getComplaintIcon(card.complaints?.value)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};

export default SidebarModern;