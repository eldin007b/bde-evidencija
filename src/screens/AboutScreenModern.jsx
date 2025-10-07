// AboutScreenModern.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDriversCloud, getTotalDeliveryCountCloud } from '../db/supabaseClient';
import './AboutScreenModern.css';

const CHANGELOG = [
  {
    version: '4.0.0',
    date: '06.10.2025',
    details: 'Kompletna modernizacija UI dizajna sa glassmorphism efektima, optimizacija performansi, dinamičke statistike iz baze podataka'
  },
  {
    version: '3.5.0',
    date: '05.10.2025',
    details: 'Dodana MapCard moderna sa poboljšanim blur efektima, novi Sidebar dizajn, optimizacija mobile responsivnosti'
  },
  {
    version: '3.4.0',
    date: '04.10.2025',
    details: 'Poboljšanja u DeliveryScreen - centriran naslov, validacija input polja, ograničavanje numeričkih vrednosti'
  },
  {
    version: '3.3.0',
    date: '03.10.2025',
    details: 'ExtraRidesScreen refaktorisanje - optimizovane boje za bolju preglednost, uklanjanje emoji ikona iz input polja'
  },
  {
    version: '3.2.0',
    date: '02.10.2025',
    details: 'Dodana validacija za PLZ i broj adresa, poboljšana UX sa placeholder tekstovima umesto alert poruka'
  },
  {
    version: '3.1.0',
    date: '01.10.2025',
    details: 'Pojačano upozorenje za reklamacije, poboljšanja u input validaciji, optimizacija korisničkog interfejsa'
  },
  {
    version: '3.0.0',
    date: '30.09.2025',
    details: 'Nova arhitektura aplikacije, PWA optimizacije, poboljšana sinhronizacija sa cloud bazom podataka'
  }
];

const AboutScreenModern = () => {
  const navigate = useNavigate();
  const [version, setVersion] = useState('4.0.0');
  const [stats, setStats] = useState({
    users: 0,
    years: 0,
    deliveries: 0
  });

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/latest.json');
        const data = await response.json();
        setVersion(data.version || '4.0.0');
      } catch (error) {
        setVersion('4.0.0');
      }
    };

    fetchVersion();

    // Dohvati stvaran broj korisnika i dostava iz baze
    const fetchRealStats = async () => {
      try {
        // Dohvati aktivne vozače
        const drivers = await getAllDriversCloud();
        const realUserCount = drivers.length;
        
        // Dohvati ukupan broj dostava (suma iz sve kolone dostava)
        const realDeliveryCount = await getTotalDeliveryCountCloud();
        
        const animateCounters = () => {
          const targetStats = { 
            users: realUserCount, 
            years: 7, 
            deliveries: realDeliveryCount 
          };
          const duration = 2500;
          const steps = 120;

          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            setStats({
              users: Math.min(targetStats.users, Math.round(targetStats.users * progress)),
              years: Math.min(targetStats.years, Math.round(targetStats.years * progress)),
              deliveries: Math.min(targetStats.deliveries, Math.round(targetStats.deliveries * progress))
            });

            if (currentStep >= steps) clearInterval(timer);
          }, duration / steps);
        };

        animateCounters();
      } catch (error) {
        console.error('Greška pri dohvatanju statistika:', error);
        // Fallback na hardkodirane podatke ako ne može da dohvati
        const animateCounters = () => {
          const targetStats = { users: 4, years: 7, deliveries: 1247 };
          const duration = 2500;
          const steps = 120;

          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            setStats({
              users: Math.min(targetStats.users, Math.round(targetStats.users * progress)),
              years: Math.min(targetStats.years, Math.round(targetStats.years * progress)),
              deliveries: Math.min(targetStats.deliveries, Math.round(targetStats.deliveries * progress))
            });

            if (currentStep >= steps) clearInterval(timer);
          }, duration / steps);
        };

        animateCounters();
      }
    };

    fetchRealStats();
  }, []);

  const handleContact = (type, value) => {
    if (type === 'email') {
      window.location.href = `mailto:${value}`;
    } else if (type === 'phone') {
      window.location.href = `tel:${value}`;
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="aboutScreenModern">
      <div className="aboutContainerModern">
        
        {/* HEADER */}
        <div className="aboutHeaderModern">
          <div className="aboutLogoModern">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf' }}>
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
          <h1 className="aboutTitleModern">O Aplikaciji</h1>
          <p className="aboutSubtitleModern">B&D Evidencija - PWA verzija</p>
        </div>

        {/* GRID LAYOUT ZA PUNI EKRAN */}
        <div className="aboutGridModern">
          {/* VERSION CARD - PUNI EKRAN */}
          <div className="glassCardModern fullWidthCard">
            <div style={{ textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf', marginBottom: '15px' }}>
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
              <h3 style={{ margin: '10px 0', color: 'var(--text-on-dark, #f1f5f9)', fontSize: '1.5rem' }}>
                Verzija {version}
              </h3>
              <p style={{ color: 'var(--text-on-dark, #f1f5f9)', margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
                Moderna glassmorphism PWA
              </p>
            </div>
          </div>

          {/* COMPANY & CONTACT SIDE BY SIDE */}
          <div className="glassCardModern">
            <div style={{ textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf', marginBottom: '15px' }}>
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
                <path d="M9 9v.01"/>
                <path d="M9 12v.01"/>
                <path d="M9 15v.01"/>
                <path d="M9 18v.01"/>
              </svg>
              <h3 style={{ margin: '10px 0', color: 'var(--text-on-dark, #f1f5f9)', fontSize: '1.3rem' }}>
                B&D Kleintransporte KG
              </h3>
              <p style={{ color: 'var(--text-on-dark, #f1f5f9)', margin: 0, opacity: 0.9 }}>
                Profesionalne transportne usluge
              </p>
            </div>
          </div>

          <div className="glassCardModern">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf', marginBottom: '15px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <h3 style={{ margin: '10px 0', color: 'var(--text-on-dark, #f1f5f9)', fontSize: '1.3rem' }}>
                Eldin Begić
              </h3>
              <p style={{ color: 'var(--text-on-dark, #f1f5f9)', margin: 0, opacity: 0.9 }}>
                Developer & Support
              </p>
            </div>
            
            <div className="contactButtonsModern">
              <button className="contactButtonModern" onClick={() => handleContact('email', 'begic.prodaja@gmail.com')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Email</span>
              </button>
              <button className="contactButtonModern" onClick={() => handleContact('phone', '06645875413')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Pozovi</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATISTICS - PUNI EKRAN */}
        <div className="glassCardModern fullWidthCard">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf' }}>
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
            <h3 style={{ textAlign: 'center', margin: 0, color: 'var(--text-on-dark, #f1f5f9)', fontSize: '1.5rem' }}>
              Statistike
            </h3>
          </div>
          <div className="statsGridModern">
            <div className="statItemModern">
              <span className="statNumberModern">{stats.users}</span>
              <span className="statLabelModern">Korisnika</span>
            </div>
            <div className="statItemModern">
              <span className="statNumberModern">{stats.years}</span>
              <span className="statLabelModern">Godina rada</span>
            </div>
            <div className="statItemModern">
              <span className="statNumberModern">{stats.deliveries}+</span>
              <span className="statLabelModern">Dostava</span>
            </div>
          </div>
        </div>

        {/* TECH STACK - PUNI EKRAN */}
        <div className="glassCardModern fullWidthCard">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf' }}>
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
            </svg>
            <h3 style={{ textAlign: 'center', margin: 0, color: 'var(--text-on-dark, #f1f5f9)', fontSize: '1.5rem' }}>
              Tehnologije
            </h3>
          </div>
          <div className="techStackModern">
            <span className="techTagModern">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <path d="M2 12h20"/>
              </svg>
              React
            </span>
            <span className="techTagModern">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
              Supabase
            </span>
            <span className="techTagModern">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <path d="M2 12h20"/>
              </svg>
              PWA
            </span>
            <span className="techTagModern">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Responsive
            </span>
            <span className="techTagModern">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
                <line x1="12" y1="22" x2="12" y2="15.5"/>
                <polyline points="22,8.5 12,15.5 2,8.5"/>
              </svg>
              CSS3
            </span>
            <span className="techTagModern">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
              Vite
            </span>
          </div>
        </div>

        {/* CHANGELOG - PUNI EKRAN */}
        <div className="glassCardModern fullWidthCard">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#44cadf' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            <h3 style={{ textAlign: 'center', margin: 0, color: 'var(--text-on-dark, #f1f5f9)', fontSize: '1.5rem' }}>
              Historija Verzija
            </h3>
          </div>
          <div className="changelogListModern">
            {CHANGELOG.map((item) => (
              <div key={item.version} className="changelogItemModern">
                <div className="changelogHeaderModern">
                  <span className="changelogVersionModern">
                    {item.highlight ? '🎯 ' : '📌 '}{item.version}
                  </span>
                  <span className="changelogDateModern">{item.date}</span>
                </div>
                <div className="changelogDetailsModern">{item.details}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="aboutFooterModern">
          <div className="footerTextModern">© 2025 B&D Kleintransporte KG</div>
          <div className="footerSubtextModern">Sva prava zadržana</div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreenModern;