import { useEffect, useCallback } from 'react';
import driversSync from '../services/driversSync';

// Guard to avoid scheduling the initial bulk sync multiple times (React StrictMode double-invoke in dev)
let _initialSyncScheduled = false;

/**
 * useSyncTables Hook - Automatska sinhronizacija između app_users i drivers tabela
 * Koristi se globalno u App komponenti da održava tabele usklađene
 */
export default function useSyncTables() {
  
  // Sync user when they login
  const syncUserOnLogin = useCallback(async (userTura) => {
    try {
      const success = await driversSync.syncUserToDriver(userTura);
      if (!success) {
        console.warn(`Failed to sync user ${userTura} to drivers table`);
      }
      return success;
    } catch (error) {
      console.error('Error syncing user on login:', error);
      return false;
    }
  }, []);

  // Sync all users (for initial load or mass sync)
  const syncAllUsers = useCallback(async () => {
    try {
      const result = await driversSync.syncAllUsers();
      console.log('Bulk sync result:', result);
      return result;
    } catch (error) {
      console.error('Error in bulk sync:', error);
      return false;
    }
  }, []);

  // Get combined user data (auth + business)
  const getCombinedUserData = useCallback(async (userTura) => {
    try {
      return await driversSync.getCombinedUserData(userTura);
    } catch (error) {
      console.error('Error getting combined user data:', error);
      return null;
    }
  }, []);

  // Auto-sync on app startup
  useEffect(() => {
    if (_initialSyncScheduled) return;
    _initialSyncScheduled = true;

    const performInitialSync = async () => {
      // Delay sync to allow other components to initialize
      setTimeout(async () => {
        console.log('Performing initial table sync...');
        await syncAllUsers();
      }, 2000); // 2 second delay
    };

    performInitialSync();
  }, [syncAllUsers]);

  return {
    syncUserOnLogin,
    syncAllUsers,
    getCombinedUserData,
    
    // Direct access to sync service
    driversSync
  };
}