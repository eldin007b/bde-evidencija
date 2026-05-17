import { useState, useEffect } from 'react';

export default function useSettings() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    // Učitaj iz localStorage
    const stored = window.localStorage.getItem('APP_SETTINGS');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    window.localStorage.setItem('APP_SETTINGS', JSON.stringify(newSettings));
  };

  return {
    settings,
    saveSettings,
  };
}
