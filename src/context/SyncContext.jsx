import React, { createContext, useContext, useEffect, useState } from 'react';
import { autoSyncService, useAutoSync } from '../services/AutoSyncService.js';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const autoSync = useAutoSync();
  const [globalSyncEnabled, setGlobalSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(null); // null = smart interval

  useEffect(() => {
    if (globalSyncEnabled) {
      // Proslijedi null za smart interval ili broj za fixed interval
      autoSync.start(syncInterval);
    } else {
      autoSync.stop();
    }
    return () => {
      autoSync.stop();
    };
  }, [globalSyncEnabled, syncInterval]);

  const value = {
    autoSync,
    globalSyncEnabled,
    setGlobalSyncEnabled,
    syncInterval,
    setSyncInterval,
    isAutoSyncRunning: autoSync.isRunning,
    isSyncInProgress: autoSync.syncInProgress,
    lastSyncTime: autoSync.lastSyncTime,
    nextSyncTime: autoSync.nextSyncTime,
    startAutoSync: autoSync.start,
    stopAutoSync: autoSync.stop,
    syncNow: autoSync.syncNow,
    getLastSyncText: () => {
      if (!autoSync.lastSyncTime) return 'Nikad';
      const now = Date.now();
      const diff = now - autoSync.lastSyncTime;
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (minutes > 0) {
        return `prije ${minutes}min ${seconds}s`;
      } else {
        return `prije ${seconds}s`;
      }
    },
    getNextSyncText: () => {
      if (!autoSync.nextSyncTime || !autoSync.isRunning) return 'Isključen';
      const now = Date.now();
      const diff = autoSync.nextSyncTime - now;
      if (diff <= 0) return 'Uskoro';
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (minutes > 0) {
        return `za ${minutes}min ${seconds}s`;
      } else {
        return `za ${seconds}s`;
      }
    }
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext mora biti korišten unutar <SyncProvider>');
  }
  return context;
}
