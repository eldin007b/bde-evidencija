import React, { createContext, useContext } from 'react';
import useDrivers from '../hooks/useDrivers.js';

const DriversContext = createContext();

export function DriversProvider({ children }) {
  const driversState = useDrivers();
  return (
    <DriversContext.Provider value={driversState}>
      {children}
    </DriversContext.Provider>
  );
}

export function useDriversContext() {
  const context = useContext(DriversContext);
  if (!context) {
    throw new Error('useDriversContext mora biti korišten unutar <DriversProvider>');
  }
  return context;
}
