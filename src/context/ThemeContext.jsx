import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme mora biti korišten unutar ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isNightTheme, setIsNightTheme] = useState(false);

  useEffect(() => {
    // Provjeri local storage za spremljenu temu
    const savedTheme = localStorage.getItem('bde-theme');
    if (savedTheme) {
      setIsNightTheme(savedTheme === 'night');
    } else {
      // Defaultno provjeri sistemsku preferencu
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsNightTheme(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsNightTheme(prev => {
      const newTheme = !prev;
      localStorage.setItem('bde-theme', newTheme ? 'night' : 'day');
      return newTheme;
    });
  };

  const setTheme = (theme) => {
    const isNight = theme === 'night';
    setIsNightTheme(isNight);
    localStorage.setItem('bde-theme', theme);
  };

  const value = {
    isNightTheme,
    toggleTheme,
    setTheme,
    theme: isNightTheme ? 'night' : 'day'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
