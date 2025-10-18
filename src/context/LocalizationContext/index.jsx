import React, { createContext, useState, useEffect, useContext } from 'react';
import translations from '../../translations';

const LocalizationContext = createContext();
const DEFAULT_LANGUAGE = 'ba';

// Helperi za web storage
const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

export const LocalizationProvider = ({ children }) => {
  // Učitaj jezik odmah iz localStorage
  const initialLanguage = storage.getItem('APP_LANG') || DEFAULT_LANGUAGE;
  const [language, setLanguage] = useState(initialLanguage);
  const [translations_, setTranslations] = useState(translations[initialLanguage]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadLanguage = () => {
      const storedLanguage = storage.getItem('APP_LANG');
      if (storedLanguage && translations[storedLanguage] && storedLanguage !== language) {
        setLanguage(storedLanguage);
        setTranslations(translations[storedLanguage]);
      }
    };
    loadLanguage();
  }, [language]);

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      setTranslations(translations[newLanguage]);
      storage.setItem('APP_LANG', newLanguage);
    }
  };

  const t = (key, fallback) => {
    const keyParts = key.split('.');
    let translation = translations_;
    for (const part of keyParts) {
      if (translation && translation[part] !== undefined) {
        translation = translation[part];
      } else {
        return fallback || key;
      }
    }
    return translation;
  };

  const value = {
    language,
    translations: translations_,
    isLoading,
    changeLanguage,
    t,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export function useLocalizationContext() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalizationContext mora biti korišten unutar <LocalizationProvider>');
  }
  return context;
}
