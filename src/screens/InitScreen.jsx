import React, { useState, useEffect, useRef } from 'react';
import './InitScreen.css';
import useDrivers from '../hooks/useDrivers';
import useAuth from '../hooks/useAuth';
import { supabase } from '../db/supabaseClient';
import { useLocalizationContext } from '../context/LocalizationContext';
// Zamjena za SecureStore/Device: localStorage i browser info

const LANGS = [
  { code: 'ba', label: 'Bosanski', flag: '🇧🇦' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'si', label: 'Slovenščina', flag: '🇸🇮' }
];

const ADMIN_TURA = '8610';
const MULTI_DEVICE_TURE = ['8610'];
const PIN_TO_TURA = { '19102420': '8610' };
const TURA_DISPLAY_MAP = { '19102420': '8610' };

export function getDisplayTura(tura) {
  if (TURA_DISPLAY_MAP[tura]) return TURA_DISPLAY_MAP[tura];
  return tura;
}

export default function InitScreen({ onFinish }) {
  const [tura, setTura] = useState('');
  const [lang, setLang] = useState('ba');
  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollingMsg, setPollingMsg] = useState('');
    const { changeLanguage, t } = useLocalizationContext();
    const { loginDriver } = useAuth();
  const { drivers, loading: driversLoading, error: driversError, refreshDrivers } = useDrivers();

  // Promijeni jezik čim korisnik odabere drugačiji jezik
  useEffect(() => {
    changeLanguage(lang);
  }, [lang, changeLanguage]);

  // Zamjena za SecureStore/Device
  const getOrCreateDeviceId = () => {
    let stored = localStorage.getItem('DEVICE_ID');
    if (stored) return stored;
    let baseId = `${navigator.userAgent}_${Date.now()}`;
    // ... ostatak koda ...
  };

  // Provjera da li tura postoji u Supabase
  const checkTuraExists = async (turaValue) => {
    setLoading(true);
    try {
      const displayTura = getDisplayTura(turaValue);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('tura', displayTura)
        .eq('aktivan', true)
        .single();
      if (error) throw error;
      return data || null;
    } catch (error) {
      window.alert('Greška prilikom provjere ture: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handler za login
  const handleConfirm = async () => {
    const actualTura = PIN_TO_TURA[tura] || tura;
    if (!actualTura || actualTura.length < 4) {
      window.alert('Unesi validnu turu.');
      return;
    }
    if (!lang) {
      window.alert('Odaberi jezik.');
      return;
    }
    // changeLanguage se poziva u useEffect kada se lang mijenja
    setLoading(true);
    try {
      const foundDriver = await checkTuraExists(actualTura);
      if (!foundDriver) { setLoading(false); return; }
      setDriverInfo(foundDriver);
      const deviceId = getOrCreateDeviceId();

      // Save basic driver info for legacy parts of the app
      localStorage.setItem('DRIVER_TURA', getDisplayTura(actualTura));
      localStorage.setItem('DRIVER_NAME', foundDriver.ime);
      localStorage.setItem('DRIVER_ROLE', foundDriver.role || 'user');
      localStorage.setItem('APP_LANG', lang);
      localStorage.setItem('DEVICE_ID', deviceId);
      localStorage.setItem('IS_ADMIN', actualTura === ADMIN_TURA ? 'true' : 'false');

      // ALSO log the user into the modern auth layer so header shows the authenticated user
      // useAuth.loginDriver will persist bde_current_user and set currentUser state
      try {
        if (loginDriver) {
          await loginDriver(getDisplayTura(actualTura));
        }
      } catch (loginErr) {
        // Don't block init on login failure, but report
        console.warn('InitScreen: loginDriver failed', loginErr);
      }

      setModalVisible(false);
      if (onFinish) onFinish();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (!modalVisible) return null;

  return (
    <div className="init-backdrop">
      <div className="init-popup">
        <div className="init-title">{t('enterTuraAndSelectLanguage')}</div>
        <input
          className="init-input"
          placeholder={t('enterTuraOrPin')}
          value={tura}
          onChange={e => setTura(e.target.value)}
          disabled={loading}
          type="number"
          maxLength={8}
        />
  <div className="init-select-language">{t('selectLanguage')}</div>
        <div className="init-lang-row">
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`init-lang-btn${lang === l.code ? ' active' : ''}`}
              onClick={() => setLang(l.code)}
              disabled={loading}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="init-loading">Učitavanje...</div>
        ) : (
          <button className="init-confirm-btn" onClick={handleConfirm} disabled={loading}>
            {t('confirm')}
          </button>
        )}
      </div>
    </div>
  );
}
