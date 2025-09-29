import React, { useState, useEffect } from 'react';
import { useLocalizationContext } from '../context/LocalizationContext';
import authService from '../utils/authService';
import './InitSetupScreen.css';

const LANGUAGES = [
  { code: 'ba', name: 'Bosanski', flag: '🇧🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'si', name: 'Slovenski', flag: '🇸🇮' },
];

const InitSetupScreen = ({ onSetupComplete }) => {
  const { changeLanguage, t, language } = useLocalizationContext();
  
  const [tourNumber, setTourNumber] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'ba');
  const [driverInfo, setDriverInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Učitaj dostupne vozače prilikom mount-a
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const drivers = await authService.getActiveDrivers();
        setAvailableDrivers(drivers);
      } catch (error) {
        console.error('Error loading drivers:', error);
        setError('Greška pri učitavanju vozača iz baze');
      }
    };

    loadDrivers();
  }, []);

  const handleTourChange = async (e) => {
    const tour = e.target.value;
    setTourNumber(tour);
    setError('');
    setDriverInfo(null);

    if (tour.length >= 4) { // Provjeri kad je uneseno dovoljno cifara
      setLoading(true);
      try {
        const driver = await authService.getUserByTura(tour);
        if (driver) {
          setDriverInfo(driver);
        } else {
          setDriverInfo(null);
        }
      } catch (error) {
        console.error('Error finding driver:', error);
        setError('Greška pri pretraživanju vozača');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tourNumber) {
      setError(t('enterTuraOrPin', 'Molimo unesite broj ture'));
      return;
    }

    if (!driverInfo) {
      setError(t('unknownTour', 'Nepoznat broj ture. Molimo kontaktirajte administratora.'));
      return;
    }

    // Promijeni jezik u aplikaciji
    changeLanguage(selectedLanguage);

    // Sačuvaj podatke u localStorage
    const setupData = {
      driver: {
        id: driverInfo.id,
        name: driverInfo.ime,
        tour: driverInfo.tura,
        role: driverInfo.role
      },
      language: selectedLanguage,
      setupCompleted: true,
      setupDate: new Date().toISOString()
    };

    localStorage.setItem('bde_app_setup', JSON.stringify(setupData));

    // Ako je admin, automatski ga logujem i vodim u admin panel
    if (driverInfo.role === 'admin') {
      try {
        // Automatski login sa admin podacima
        const user = await authService.authenticate(driverInfo.tura, driverInfo.tura);
        
        // Redirect direktno u admin panel
        window.location.href = '/bde-evidencija/admin-panel';
        return;
      } catch (error) {
        console.error('Auto-login failed:', error);
        setError('Greška pri automatskom logovanju. Pokušajte ponovo.');
        return;
      }
    }
    
    // Za obične vozače, idi na HomePage
    onSetupComplete(setupData);
  };

  return (
    <div className="init-setup-screen">
      <div className="setup-container">
        <div className="setup-header">
          <img src="/bde-evidencija/assets/logo.png" alt="B&D Logo" className="setup-logo" />
          <h1>BDEVidencija</h1>
          <p>{t('welcome', 'Dobrodošli!')} {t('setupMessage', 'Molimo podesite aplikaciju prije korišćenja.')}</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          {/* Unos broja ture */}
          <div className="form-group">
            <label htmlFor="tour">{t('tourNumber', 'Broj ture')}</label>
            <input
              type="text"
              id="tour"
              value={tourNumber}
              onChange={handleTourChange}
              placeholder={t('tourPlaceholder', 'Unesite vaš broj ture (npr. 8610)')}
              className="tour-input"
              maxLength="10"
              disabled={loading}
            />
            
            {loading && (
              <div className="loading-indicator">
                <span>🔍 Pretraživanje...</span>
              </div>
            )}
            
            {driverInfo && !loading && (
              <div className={`driver-preview ${driverInfo.role === 'admin' ? 'admin-preview' : ''}`}>
                <span className="preview-icon">{driverInfo.role === 'admin' ? '�' : '�👤'}</span>
                <span className="preview-text">
                  {driverInfo.ime} - Tura {driverInfo.tura}
                </span>
                <span className={`role-badge ${driverInfo.role}`}>
                  {driverInfo.role === 'admin' ? 'Administrator' : 'Vozač'}
                </span>
                {driverInfo.role === 'admin' && (
                  <div className="admin-notice">
                    🚀 Automatski pristup Admin Panelu
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Izbor jezika */}
          <div className="form-group">
            <label>{t('appLanguage', 'Jezik aplikacije')}</label>
            <div className="language-options">
              {LANGUAGES.map((lang) => (
                <label key={lang.code} className="language-option">
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={selectedLanguage === lang.code}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  />
                  <span className="language-label">
                    <span className="language-flag">{lang.flag}</span>
                    <span className="language-name">{lang.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="setup-button"
            disabled={!tourNumber || !driverInfo || loading}
          >
            {loading ? 'Učitavanje...' : 
             driverInfo?.role === 'admin' ? 'Idi u Admin Panel' : 
             t('finishSetup', 'Završi podešavanje')}
          </button>
        </form>

        <div className="setup-info">
          <p><small>{t('setupInfoMessage', 'Ove podatke možete promijeniti kasnije u podešavanjima aplikacije.')}</small></p>
          
          {availableDrivers.length > 0 && (
            <details className="available-drivers">
              <summary>Dostupni vozači ({availableDrivers.length})</summary>
              <div className="drivers-list">
                {availableDrivers.map(driver => (
                  <div key={driver.tura} className="driver-item">
                    <span>{driver.tura} - {driver.ime}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitSetupScreen;