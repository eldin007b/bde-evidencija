/**
 * 🔋 Battery Optimization Service
 * Upravlja frekvencijom GPS update-a na osnovu stanja aplikacije
 * - Smanjena frekvencija kada je aplikacija u background-u
 * - Inteligentno upravljanje GPS tracking-om za očuvanje baterije
 */

class BatteryOptimizationService {
  constructor() {
    this.isAppVisible = true;
    this.listeners = new Set();
    this.lastActivity = Date.now();
    this.activityTimeout = null;
    
    // GPS konfiguracija
    this.gpsConfig = {
      foreground: {
        enableHighAccuracy: true,
        maximumAge: 1000,        // 1 sekunda
        timeout: 5000,
        updateInterval: 1000     // Update svake sekunde
      },
      background: {
        enableHighAccuracy: false,
        maximumAge: 10000,       // 10 sekundi
        timeout: 30000,
        updateInterval: 30000    // Update svakih 30 sekundi
      },
      inactive: {
        enableHighAccuracy: false,
        maximumAge: 60000,       // 1 minut
        timeout: 60000,
        updateInterval: 120000   // Update svakih 2 minuta
      }
    };

    this.currentMode = 'foreground';
    this.init();
  }

  init() {
    // Page visibility API
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Focus/blur events
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
    
    // User activity detection
    this.trackUserActivity();
    
    console.log('🔋 [Battery] Service inicijalizovan');
  }

  handleVisibilityChange() {
    this.isAppVisible = !document.hidden;
    this.updateMode();
    console.log('🔋 [Battery] Visibility changed:', this.isAppVisible ? 'visible' : 'hidden');
  }

  handleFocus() {
    this.isAppVisible = true;
    this.updateActivity();
    this.updateMode();
    console.log('🔋 [Battery] App focused');
  }

  handleBlur() {
    this.isAppVisible = false;
    this.updateMode();
    console.log('🔋 [Battery] App blurred');
  }

  trackUserActivity() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  updateActivity() {
    this.lastActivity = Date.now();
    
    // Resetuj timeout za neaktivnost
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    // Postavi timeout za označavanje kao neaktivan (5 minuta)
    this.activityTimeout = setTimeout(() => {
      this.updateMode();
    }, 5 * 60 * 1000);
    
    this.updateMode();
  }

  updateMode() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const isInactive = timeSinceActivity > 5 * 60 * 1000; // 5 minuta
    
    let newMode;
    if (!this.isAppVisible) {
      newMode = 'background';
    } else if (isInactive) {
      newMode = 'inactive';
    } else {
      newMode = 'foreground';
    }
    
    if (newMode !== this.currentMode) {
      const oldMode = this.currentMode;
      this.currentMode = newMode;
      
      console.log(`🔋 [Battery] Mode changed: ${oldMode} → ${newMode}`);
      
      // Notifikuj sve listenere
      this.notifyListeners({
        type: 'mode_changed',
        oldMode,
        newMode,
        config: this.getCurrentConfig()
      });
    }
  }

  getCurrentConfig() {
    return this.gpsConfig[this.currentMode];
  }

  getCurrentMode() {
    return this.currentMode;
  }

  // Observer pattern za komponente
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('🔋 [Battery] Error in listener:', error);
      }
    });
  }

  // Battery API support (ako je dostupan)
  async getBatteryInfo() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (error) {
        console.warn('🔋 [Battery] Battery API not available:', error);
      }
    }
    return null;
  }

  // Adaptivni GPS na osnovu baterije
  async getAdaptiveGpsConfig() {
    const batteryInfo = await this.getBatteryInfo();
    const baseConfig = this.getCurrentConfig();
    
    if (batteryInfo && batteryInfo.level < 20 && !batteryInfo.charging) {
      // Vrlo niska baterija - maksimalno štedni režim
      return {
        ...baseConfig,
        enableHighAccuracy: false,
        maximumAge: 60000,
        updateInterval: Math.max(baseConfig.updateInterval * 2, 60000)
      };
    }
    
    if (batteryInfo && batteryInfo.level < 50 && !batteryInfo.charging) {
      // Niska baterija - umeren štedni režim
      return {
        ...baseConfig,
        maximumAge: Math.max(baseConfig.maximumAge * 1.5, 5000),
        updateInterval: Math.max(baseConfig.updateInterval * 1.5, 5000)
      };
    }
    
    return baseConfig;
  }

  // Cleanup
  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);
    
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    this.listeners.clear();
    console.log('🔋 [Battery] Service destroyed');
  }
}

// Singleton instance
export const batteryOptimizationService = new BatteryOptimizationService();

// React hook za korištenje u komponentama
import { useState, useEffect } from 'react';

export function useBatteryOptimization() {
  const [mode, setMode] = useState(batteryOptimizationService.getCurrentMode());
  const [config, setConfig] = useState(batteryOptimizationService.getCurrentConfig());
  const [batteryInfo, setBatteryInfo] = useState(null);

  useEffect(() => {
    const listener = (event) => {
      if (event.type === 'mode_changed') {
        setMode(event.newMode);
        setConfig(event.config);
      }
    };

    const unsubscribe = batteryOptimizationService.addListener(listener);
    
    // Load initial battery info
    batteryOptimizationService.getBatteryInfo().then(setBatteryInfo);
    
    return unsubscribe;
  }, []);

  const getAdaptiveConfig = async () => {
    return await batteryOptimizationService.getAdaptiveGpsConfig();
  };

  return {
    mode,
    config,
    batteryInfo,
    getAdaptiveConfig,
    isBackground: mode === 'background',
    isInactive: mode === 'inactive',
    isForeground: mode === 'foreground'
  };
}