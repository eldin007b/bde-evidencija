// SidebarModern.jsx
import React, { useState } from 'react';
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
    if (isNaN(n)) return 'text-gray-500';
    if (n > 0) return 'text-green-600';
    if (n < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Odredi klasu boje za broj reklamacija
  const getComplaintClass = (val) => {
    const n = toNumber(val);
    if (isNaN(n)) return 'text-gray-500';
    if (n === 0) return 'text-green-600';
    if (n > 0) return 'text-red-600';
    return 'text-gray-500';
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
    <aside className="bg-card p-4 rounded-xl shadow-xl w-full h-full flex flex-col gap-4">
      {/* Driver Info Card - Clickable */}
      <div 
        className={`bg-background rounded-lg shadow-md p-4 flex flex-col gap-2 cursor-pointer transition-all duration-300 ${isSwitching ? 'opacity-60 animate-pulse' : ''}`}
        onClick={handleDriverSwitch}
        role="button"
        tabIndex={0}
        aria-label={`Promijeni vozača. Trenutno: ${user?.ime || 'N/A'}`}
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-primary/10 rounded-full p-2 flex items-center justify-center relative">
            <IconTruck size={32} />
            {isSwitching && <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>}
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">{user?.ime || 'Vozač'}</h3>
            <p className="text-sm text-muted-foreground">Tura: {user?.tura || '--'}</p>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <IconTarget size={18} />
            <span className="font-bold">{user?.target_per_day || '--'}</span>
            <span className="text-xs text-muted-foreground">/dan</span>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="flex flex-col gap-2 mt-2">
        
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statCards.map((card, index) => (
            <div key={index} className="bg-background rounded-lg shadow p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary">{card.icon}</span>
                <span className="text-sm font-medium text-muted-foreground">{card.period}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stopova</span>
                  <span className={`font-bold text-lg flex items-center gap-1 ${getStopClass(card.delivery?.value)}`}>{card.delivery?.value} {getStopIcon(card.delivery?.value)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Reklamacije</span>
                  <span className={`font-bold text-lg flex items-center gap-1 ${getComplaintClass(card.complaints?.value)} ${toNumber(card.complaints?.value) > 0 ? 'animate-pulse text-warning' : ''}`}>{card.complaints?.value} {getComplaintIcon(card.complaints?.value)}</span>
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