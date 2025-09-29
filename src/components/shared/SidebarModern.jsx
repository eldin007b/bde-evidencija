// SidebarModern.jsx
import React, { useState } from 'react';
import styles from './SidebarModern.module.css';

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

  const getDeliveryClass = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return styles.neutral;
    return n >= 0 ? styles.statGood : styles.statBad;
  };

  const getComplaintClass = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return styles.neutral;
    if (n === 0) return styles.statGood;
    if (n > 0) return `${styles.statBad} ${styles.blink}`;
    return styles.statBad;
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
      icon: '📅'
    },
    { 
      title: 'Ovaj mjesec', 
      period: formattedStats[2]?.label || 'Ovaj mjesec',
      delivery: formattedStats[2],
      complaints: formattedStats[3],
      icon: '📊'
    },
    { 
      title: 'Ova godina', 
      period: formattedStats[4]?.label || 'Ova godina',
      delivery: formattedStats[4],
      complaints: formattedStats[5],
      icon: '🎯'
    }
  ];

  return (
    <aside className={styles.sidebarModern}>
      {/* Driver Info Card - Clickable */}
      <div 
        className={`${styles.driverCardModern} ${isSwitching ? styles.switching : ''}`}
        onClick={handleDriverSwitch}
        role="button"
        tabIndex={0}
        aria-label={`Promijeni vozača. Trenutno: ${user?.ime || 'N/A'}`}
      >
        <div className={styles.driverHeader}>
          <div className={styles.driverAvatar}>
            <span className={styles.avatarIcon}>🚚</span>
            {isSwitching && <div className={styles.loadingSpinner}></div>}
          </div>
          <div className={styles.driverInfo}>
            <h3 className={styles.driverName}>{user?.ime || 'Vozač'}</h3>
            <p className={styles.driverTour}>Tura: {user?.tura || '--'}</p>
          </div>
          <div className={styles.driverTarget}>
            <span className={styles.targetIcon}>🎯</span>
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
                  <span className={styles.statLabel}>Dostava</span>
                  <span className={`${styles.statValue} ${getDeliveryClass(card.delivery?.value)}`}>
                    {card.delivery?.value}
                    {card.delivery?.trend === 'positive' && <span className={styles.trendIcon}>📈</span>}
                    {card.delivery?.trend === 'negative' && <span className={styles.trendIcon}>📉</span>}
                  </span>
                </div>
                
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Reklamacije</span>
                  <span className={`${styles.statValue} ${getComplaintClass(card.complaints?.value)}`}>
                    {card.complaints?.value}
                    {card.complaints?.value === '0' && <span className={styles.successIcon}>✅</span>}
                    {card.complaints?.value !== '0' && card.complaints?.value !== '--' && 
                     <span className={styles.warningIcon}>⚠️</span>}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions removed per request */}
    </aside>
  );
};

export default SidebarModern;