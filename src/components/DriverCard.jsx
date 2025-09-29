import React, { useEffect, useState } from 'react';
import './DriverCard.css';
import { supabase } from '../db/supabaseClient';
import { format } from 'date-fns';

const DriverCard = ({ driver = {}, allDrivers = [], stats = null, onClick = null }) => {
  const [monthlyComplaints, setMonthlyComplaints] = useState(null);
  const [blinkState, setBlinkState] = useState(true);

  // Blinkanje animacija za reklamacije
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Dohvaćaj mjesečne reklamacije iz baze
  useEffect(() => {
    const fetchMonthlyComplaints = async () => {
      if (!driver.tura) return;
      
      try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        const { data, error } = await supabase
          .from('deliveries')
          .select('probleme_druga')
          .eq('driver', driver.tura)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .eq('deleted', 0);
          
        if (error) throw error;
        
        const total = data.reduce((sum, record) => sum + (parseInt(record.probleme_druga) || 0), 0);
        setMonthlyComplaints(total);
      } catch (error) {
        console.error('Error fetching monthly complaints:', error);
        setMonthlyComplaints(null);
      }
    };
    
    fetchMonthlyComplaints();
  }, [driver.tura]);

  // Izračunaj godišnji score za sve vozače
  const getScore = (drv) => {
    const stops = Number(drv.stopsGodina ?? 0);
    const rekl = Number(drv.reklamacijeGodina ?? 0);
    return stops - rekl * 30;
  };

  // Pripremi listu score-va i sortiraj silazno
  const scores = allDrivers
    .map(d => ({ id: d.id || d.tura || d.ime || d.driver, score: getScore(d) }))
    .sort((a, b) => b.score - a.score);

  // Pronađi svoj id i rang
  const myId = driver.id || driver.tura || driver.ime || driver.driver;
  const myRank = scores.findIndex(d => d.id === myId);
  const myScore = getScore(driver);

  // Dodijeli status na osnovu ranga
  let status = null;
  let badgeClass = '';
  if (myRank === 0) {
    status = 'ZLATO';
    badgeClass = 'badge-gold';
  } else if (myRank === 1) {
    status = 'SREBRO';
    badgeClass = 'badge-silver';
  } else if (myRank === 2) {
    status = 'BRONZA';
    badgeClass = 'badge-bronze';
  }

  const name = driver.ime || driver.driver || 'Nepoznato';
  const tura = driver.tura || 'N/A';
  // Helper za prikaz reklamacija sa animacijom
  const ComplaintText = ({ value, shouldBlink }) => {
    const count = Number(value) || 0;
    if (count > 0) {
      return (
        <span 
          className={`complaint-text ${shouldBlink ? 'blink' : ''}`}
          style={{ 
            color: shouldBlink && blinkState ? '#ffffff' : '#F44336',
            backgroundColor: shouldBlink && blinkState ? '#F44336' : 'transparent',
            fontWeight: 'bold'
          }}
        >
          {count}
        </span>
      );
    }
    return <span className="complaint-text-good">0</span>;
  };

  // Prikaz reklamacija za mjesec (prioritet: baza > driver podaci)
  let prikazMjesec = 0;
  if (monthlyComplaints !== null && !isNaN(Number(monthlyComplaints))) {
    prikazMjesec = Number(monthlyComplaints);
  } else if (!isNaN(Number(driver.reklamacijeMjesec)) && Number(driver.reklamacijeMjesec) > 0) {
    prikazMjesec = Number(driver.reklamacijeMjesec);
  }

  // Funkcija za računanje razlike i strelice
  const getDifference = (stops, target) => {
    const diff = stops - target;
    let arrowClass = 'arrow-neutral';
    let diffColor = '#333';
    if (target > 0) {
      if (diff > 0) {
        arrowClass = 'arrow-up';
        diffColor = '#4CAF50';
      } else if (diff < 0) {
        arrowClass = 'arrow-down';
        diffColor = '#F44336';
      }
    }
    return { diff, arrowClass, diffColor };
  };

  // Mjeseci
  const mjeseci = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
  const currentMonth = mjeseci[new Date().getMonth()];

  // Prikaz samo detaljnih sekcija (dan, mjesec, godina) -- bez sažetih redova
  return (
    <div 
      className={`driver-card premium-driver-card ${badgeClass}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Premium Header sa elegantnim dizajnom */}
      <div className="premium-header">
        <div className="premium-background">
          <div className="driver-name-premium">{name}</div>
          <div className="driver-tura-premium">({tura})</div>
          {onClick && (
            <div className="click-indicator-premium">
              <span className="click-text-premium">Klik za promjenu</span>
            </div>
          )}
        </div>
        {status && (
          <div className={`premium-badge ${badgeClass}`}>
            <span className="badge-icon">★</span>
            <span className="badge-text">{status}</span>
          </div>
        )}
      </div>
      <div className="premium-stats-container">
        {/* DAN - Zadnja Vožnja */}
        <div className="premium-stat-card">
          <div className="stat-card-header">
            <span className="period-icon-premium">📅</span>
            <span className="period-date">
              Zadnja Vožnja {stats?.day?.date ? format(new Date(stats.day.date), 'dd.MM.') : '16.09.'}
            </span>
          </div>
          <div className="stat-card-content">
            <div className="stat-item-premium">
              <span className="stat-label-premium">PAKETI</span>
              <span className={`stat-value-premium ${stats?.day?.diff >= 0 ? 'positive' : 'negative'}`}>
                {stats?.day?.diff > 0 ? '+' : ''}{stats?.day?.diff || 0}
                <span className="stat-arrow-premium">{stats?.day?.diff >= 0 ? ' ↗️' : ' ↘️'}</span>
              </span>
            </div>
            <div className="stat-item-premium">
              <span className="stat-label-premium">REKLAM.</span>
              <span className={`stat-value-premium ${stats?.day?.complaints === 0 ? 'good' : 'bad'}`}>
                {stats?.day?.complaints === 0 ? '✅' : '⚠️'} {stats?.day?.complaints || 0}
              </span>
            </div>
          </div>
        </div>
        
        {/* MJESEC - Vožnja za trenutni mjesec */}
        <div className="premium-stat-card">
          <div className="stat-card-header">
            <span className="period-icon-premium">📅</span>
            <span className="period-date">Vožnja za {currentMonth}</span>
          </div>
          <div className="stat-card-content">
            <div className="stat-item-premium">
              <span className="stat-label-premium">PAKETI</span>
              <span className={`stat-value-premium ${stats?.month?.diff >= 0 ? 'positive' : 'negative'}`}>
                {stats?.month?.diff > 0 ? '+' : ''}{stats?.month?.diff || 0}
                <span className="stat-arrow-premium">{stats?.month?.diff >= 0 ? ' ↗️' : ' ↘️'}</span>
              </span>
            </div>
            <div className="stat-item-premium">
              <span className="stat-label-premium">REKLAM.</span>
              <span className={`stat-value-premium ${stats?.month?.complaints === 0 ? 'good' : 'bad'}`}>
                {stats?.month?.complaints === 0 ? '✅' : '⚠️'} {stats?.month?.complaints || 0}
              </span>
            </div>
          </div>
        </div>
        
        {/* GODINA - Vožnje za trenutnu godinu */}
        <div className="premium-stat-card">
          <div className="stat-card-header">
            <span className="period-icon-premium">📅</span>
            <span className="period-date">Vožnje za {new Date().getFullYear()}</span>
          </div>
          <div className="stat-card-content">
            <div className="stat-item-premium">
              <span className="stat-label-premium">PAKETI</span>
              <span className={`stat-value-premium ${stats?.year?.diff >= 0 ? 'positive' : 'negative'}`}>
                {stats?.year?.diff > 0 ? '+' : ''}{stats?.year?.diff || 0}
                <span className="stat-arrow-premium">{stats?.year?.diff >= 0 ? ' ↗️' : ' ↘️'}</span>
              </span>
            </div>
            <div className="stat-item-premium">
              <span className="stat-label-premium">REKLAM.</span>
              <span className={`stat-value-premium ${stats?.year?.complaints === 0 ? 'good' : 'bad'}`}>
                {stats?.year?.complaints === 0 ? '✅' : '⚠️'} {stats?.year?.complaints || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverCard;
