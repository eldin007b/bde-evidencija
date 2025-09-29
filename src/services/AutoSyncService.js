// AutoSyncService za PWA koristi Supabase cloud sync i browser interval
import { syncDeliveries, syncDrivers } from '../db/syncAll';

class AutoSyncService {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.listeners = new Set();
    this.SYNC_INTERVAL = 5 * 60 * 1000; // 5 minuta
    this.MIN_SYNC_DELAY = 30 * 1000; // Minimum 30 sekundi između sync-ova
    this.retryDelay = 5000; // 5 sekundi početno kašnjenje za retry
    this.errorCount = 0;
    this.maxErrors = 10; // Zaustavi sync nakon 10 grešaka u nizu
    this.isOnline = navigator.onLine;
    
    // Event listeners za network status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Load persisted state
    this.loadPersistedState();
  }

  handleOnline() {
    console.log('🌐 Network connection restored');
    this.isOnline = true;
    this.errorCount = 0; // Reset error count when back online
    this.notifyListeners({ type: 'network', status: 'online' });
    
    if (this.isRunning) {
      // Pokreni sync odmah kada se vrati konekcija
      setTimeout(() => this.syncNow(), 1000);
    }
  }

  handleOffline() {
    console.log('🌐 Network connection lost');
    this.isOnline = false;
    this.notifyListeners({ type: 'network', status: 'offline' });
  }

  isNetworkAvailable() {
    return this.isOnline && navigator.onLine;
  }

  loadPersistedState() {
    try {
      const saved = localStorage.getItem('autoSyncState');
      if (saved) {
        const state = JSON.parse(saved);
        this.lastSyncTime = state.lastSyncTime;
        this.errorCount = state.errorCount || 0;
      }
    } catch (error) {
      console.warn('Failed to load persisted sync state:', error);
    }
  }

  saveState() {
    try {
      const state = {
        lastSyncTime: this.lastSyncTime,
        errorCount: this.errorCount,
        isRunning: this.isRunning
      };
      localStorage.setItem('autoSyncState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save sync state:', error);
    }
  }

  start(intervalMin = 5) {
    if (this.isRunning) return;
    this.SYNC_INTERVAL = intervalMin * 60 * 1000;
    this.isRunning = true;
    this.syncNow();
    this.syncInterval = setInterval(() => {
      this.syncNow();
    }, this.SYNC_INTERVAL);
    this.notifyListeners({ type: 'started' });
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.notifyListeners({ type: 'stopped' });
  }

  async syncNow(force = false) {
    if (this.syncInProgress && !force) {
      return { success: false, reason: 'already_in_progress' };
    }
    
    if (!force && this.lastSyncTime && Date.now() - this.lastSyncTime < this.MIN_SYNC_DELAY) {
      return { success: false, reason: 'min_delay' };
    }

    // Provjeri network status
    if (!this.isNetworkAvailable()) {
      this.notifyListeners({ 
        type: 'error', 
        error: 'No network connection', 
        code: 'NETWORK_ERROR' 
      });
      return { success: false, reason: 'no_network' };
    }

    // Provjeri da li je dosegnut maksimalni broj grešaka
    if (this.errorCount >= this.maxErrors) {
      this.notifyListeners({ 
        type: 'error', 
        error: `Too many sync errors (${this.errorCount}). Auto-sync paused.`, 
        code: 'MAX_ERRORS_REACHED' 
      });
      this.stop();
      return { success: false, reason: 'max_errors_reached' };
    }

    this.syncInProgress = true;
    this.notifyListeners({ type: 'sync_started' });

    try {
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Starting sync attempt ${retryCount + 1}/${maxRetries}`);
          
          await syncDeliveries();
          await syncDrivers();
          
          this.lastSyncTime = Date.now();
          this.errorCount = 0; // Reset error count on success
          this.saveState();
          
          this.notifyListeners({ 
            type: 'sync_success', 
            timestamp: this.lastSyncTime,
            attempt: retryCount + 1
          });
          
          console.log('✅ Sync completed successfully');
          return { success: true, timestamp: this.lastSyncTime };

        } catch (error) {
          retryCount++;
          this.errorCount++;
          
          console.error(`❌ Sync attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            const delay = this.retryDelay * retryCount; // Exponential backoff
            console.log(`⏳ Retrying in ${delay/1000} seconds...`);
            
            this.notifyListeners({ 
              type: 'sync_retry', 
              attempt: retryCount,
              maxRetries,
              delay,
              error: error.message 
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Sve ponovne pokušaje su neuspješni
            this.notifyListeners({ 
              type: 'sync_failed', 
              error: error.message,
              errorCount: this.errorCount,
              maxRetries
            });
            
            this.saveState();
            return { success: false, error, attempts: retryCount };
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  notifyListeners(event) {
    this.listeners.forEach((cb) => cb(event));
  }

  addListener(cb) {
    this.listeners.add(cb);
  }

  removeListener(cb) {
    this.listeners.delete(cb);
  }
}

export const autoSyncService = new AutoSyncService();

// Hook za korištenje u komponentama
import { useEffect, useState } from 'react';
export function useAutoSync() {
  const [isRunning, setIsRunning] = useState(autoSyncService.isRunning);
  const [syncInProgress, setSyncInProgress] = useState(autoSyncService.syncInProgress);
  const [lastSyncTime, setLastSyncTime] = useState(autoSyncService.lastSyncTime);

  useEffect(() => {
    const listener = (event) => {
      if (event.type === 'started') setIsRunning(true);
      if (event.type === 'stopped') setIsRunning(false);
      if (event.type === 'synced') setLastSyncTime(autoSyncService.lastSyncTime);
      setSyncInProgress(autoSyncService.syncInProgress);
    };
    autoSyncService.addListener(listener);
    return () => autoSyncService.removeListener(listener);
  }, []);

  return {
    isRunning,
    syncInProgress,
    lastSyncTime,
    start: (intervalMin) => autoSyncService.start(intervalMin),
    stop: () => autoSyncService.stop(),
    syncNow: (force) => autoSyncService.syncNow(force),
  };
}
