import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Helperi za web storage
const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  deleteItem: (key) => window.localStorage.removeItem(key)
};

const UserContext = createContext();

export function UserProvider({ children, forceShowInit }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [driverTura, setDriverTura] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverRole, setDriverRole] = useState('user');
  const [deviceId, setDeviceId] = useState('');
  const [userColor, setUserColor] = useState('#1769aa');

  // Dohvati status iz localStorage
  const refreshStatus = useCallback(() => {
    const storedTura = storage.getItem('DRIVER_TURA');
    const storedName = storage.getItem('DRIVER_NAME');
    const storedRole = storage.getItem('DRIVER_ROLE');
    const storedDeviceId = storage.getItem('DEVICE_ID');
    const storedIsAdmin = storage.getItem('IS_ADMIN');


    setDriverTura(storedTura || '');
    setDriverName(storedName || '');
    setDriverRole(storedRole || 'user');
    setDeviceId(storedDeviceId || '');
    setIsAdmin(storedIsAdmin === 'true');

    if (storedIsAdmin === 'true') {
      setUserColor('#cc0000');
    } else if (storedName && storedTura) {
      setUserColor('#1769aa');
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    if (typeof window !== 'undefined') {
      window.__USER_CONTEXT__ = { refreshStatus };
    }
  }, [refreshStatus]);

  // Resetiraj login podatke
  const resetLoginData = () => {
    storage.deleteItem('DRIVER_TURA');
    storage.deleteItem('DRIVER_NAME');
    storage.deleteItem('DRIVER_ROLE');
    storage.deleteItem('DEVICE_ID');
    storage.deleteItem('IS_ADMIN');
    storage.deleteItem('APP_LANG');
    refreshStatus();
    if (typeof forceShowInit === 'function') {
      forceShowInit();
    }
    return true;
  };

  // Provjeri validnost ture i device_id
  const validateDriverAccess = () => {
    if (!driverTura || !deviceId) {
      return false;
    }
    if (driverTura === '8610' && isAdmin) {
      return true;
    }
    // Dodaj dodatnu validaciju po potrebi
    return true;
  };

  const value = {
    isAdmin,
    driverTura,
    driverName,
    driverRole,
    deviceId,
    userColor,
    refreshStatus,
    resetLoginData,
    validateDriverAccess
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext mora biti korišten unutar <UserProvider>');
  }
  return context;
}
