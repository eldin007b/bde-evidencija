import React from 'react';
import styles from './DriverCard.module.css';


const StatRow = ({ icon, label, value, color, sublabel }) => (
  <div className={styles.statRow}>
    <span className={styles.statIcon}>{icon}</span>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue} style={{ color }}>{value}</span>
    <span className={styles.statSublabel}>{sublabel}</span>
  </div>
);

const DriverCard = ({ driver, stats, onClick }) => (
  <div className={styles.card} onClick={onClick}>
    <div className={styles.headerRow}>
      <span className={styles.icon}>🚚</span>
      <span className={styles.name}>{driver?.ime || driver?.name || '---'}</span>
      <span className={styles.tura}>{driver?.tura || driver?.tour || ''}</span>
    </div>
    <div className={styles.statsSectionBoxes}>
      {/* Box 1: Zadnji dan */}
      <div className={styles.statsBox}>
        <div className={styles.statsBoxTitle}><b>Podaci za ({stats.day?.date || '--.--.'})</b></div>
        <StatRow icon="🎯" label="Dostava" value={stats.day?.diff || 0} color={stats.day?.diff < 0 ? '#ef4444' : '#10b981'} sublabel={stats.day?.diff < 0 ? '↓' : '↑'} />
        <StatRow icon={stats.day?.complaints === 0 ? '🟢' : '🛑'} label="Reklamacije" value={stats.day?.complaints || 0} color={stats.day?.complaints === 0 ? '#10b981' : '#ef4444'} sublabel={stats.day?.complaints === 0 ? '' : '!'}/>
      </div>
      {/* Box 2: Mjesec */}
      <div className={styles.statsBox}>
        <div className={styles.statsBoxTitle}><b>Podaci za {stats.month?.label || 'Mjesec'}</b></div>
        <StatRow icon="🚚" label="Dostava" value={stats.month?.diff || 0} color={stats.month?.diff < 0 ? '#ef4444' : '#10b981'} sublabel={stats.month?.diff < 0 ? '↓' : '↑'} />
        <StatRow icon={stats.month?.complaints === 0 ? '🟢' : '🛑'} label="Reklamacije" value={stats.month?.complaints || 0} color={stats.month?.complaints === 0 ? '#10b981' : '#ef4444'} sublabel={stats.month?.complaints === 0 ? '' : '!'}/>
      </div>
      {/* Box 3: Godina */}
      <div className={styles.statsBox}>
        <div className={styles.statsBoxTitle}><b>Podaci za {stats.year?.label || 'Godina'}</b></div>
        <StatRow icon="🚚" label="Dostava" value={stats.year?.diff || 0} color={stats.year?.diff < 0 ? '#ef4444' : '#10b981'} sublabel={stats.year?.diff < 0 ? '↓' : '↑'} />
        <StatRow icon={stats.year?.complaints === 0 ? '🟢' : '🛑'} label="Reklamacije" value={stats.year?.complaints || 0} color={stats.year?.complaints === 0 ? '#10b981' : '#ef4444'} sublabel={stats.year?.complaints === 0 ? '' : '!'}/>
      </div>
    </div>
  </div>
);

export default DriverCard;
