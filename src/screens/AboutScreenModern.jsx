// AboutScreenModern.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButtonModern from '../components/common/CloseButtonModern';
import './AboutScreenModern.css';

const CHANGELOG = [
  // ... isti changelog podaci
];

const AboutScreenModern = () => {
  const navigate = useNavigate();
  const [version, setVersion] = useState('3.0.0');
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
        setVersion(data.version || '3.0.0');
      } catch (error) {
        setVersion('3.0.0');
      }
    };

    fetchVersion();

    const animateCounters = () => {
      const targetStats = { users: 4, years: 5, deliveries: 1247 };
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
        <CloseButtonModern onClose={handleClose} />
        
        {/* HEADER */}
        <div className="aboutHeaderModern">
          <div className="aboutLogoModern">
            <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🚚</span>
          </div>
          <h1 className="aboutTitleModern">O Aplikaciji</h1>
          <p className="aboutSubtitleModern">B&D Evidencija - PWA verzija</p>
        </div>

        {/* GRID LAYOUT ZA PUNI EKRAN */}
        <div className="aboutGridModern">
          {/* VERSION CARD - PUNI EKRAN */}
          <div className="glassCardModern fullWidthCard">
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🚀</span>
              <h3 style={{ margin: '10px 0', color: 'var(--text-dark)', fontSize: '1.5rem' }}>
                Verzija {version}
              </h3>
              <p style={{ color: 'var(--text-dark)', margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
                Najnovija PWA implementacija
              </p>
            </div>
          </div>

          {/* COMPANY & CONTACT SIDE BY SIDE */}
          <div className="glassCardModern">
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '15px' }}>🏢</span>
              <h3 style={{ margin: '10px 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>
                B&D Kleintransporte KG
              </h3>
              <p style={{ color: 'var(--text-dark)', margin: 0, opacity: 0.9 }}>
                Profesionalne transportne usluge
              </p>
            </div>
          </div>

          <div className="glassCardModern">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '15px' }}>👨‍💻</span>
              <h3 style={{ margin: '10px 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>
                Eldin Begić
              </h3>
              <p style={{ color: 'var(--text-dark)', margin: 0, opacity: 0.9 }}>
                Developer & Support
              </p>
            </div>
            
            <div className="contactButtonsModern">
              <button className="contactButtonModern" onClick={() => handleContact('email', 'begic.prodaja@gmail.com')}>
                <span style={{ fontSize: '1.3rem' }}>📧</span>
                <span>Email</span>
              </button>
              <button className="contactButtonModern" onClick={() => handleContact('phone', '06645875413')}>
                <span style={{ fontSize: '1.3rem' }}>📞</span>
                <span>Pozovi</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATISTICS - PUNI EKRAN */}
        <div className="glassCardModern fullWidthCard">
          <h3 style={{ textAlign: 'center', marginBottom: '25px', color: 'var(--text-dark)', fontSize: '1.5rem' }}>
            📊 Statistike
          </h3>
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
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-dark)', fontSize: '1.5rem' }}>
            ⚡ Tehnologije
          </h3>
          <div className="techStackModern">
            <span className="techTagModern">⚛️ React</span>
            <span className="techTagModern">☁️ Supabase</span>
            <span className="techTagModern">🌐 PWA</span>
            <span className="techTagModern">📱 Responsive</span>
            <span className="techTagModern">🎨 CSS3</span>
            <span className="techTagModern">⚡ Vite</span>
          </div>
        </div>

        {/* CHANGELOG - PUNI EKRAN */}
        <div className="glassCardModern fullWidthCard">
          <h3 style={{ textAlign: 'center', marginBottom: '25px', color: 'var(--text-dark)', fontSize: '1.5rem' }}>
            📋 Historija Verzija
          </h3>
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