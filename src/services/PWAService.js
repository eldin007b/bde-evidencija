/**
 * 🚀 PWA Service
 * Upravlja PWA funkcionalnostima: install prompt, service worker, background sync
 */

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.serviceWorkerRegistration = null;
    this.listeners = new Set();
    this.syncInProgress = false;
    
    this.checkInstallStatus();
    this.setupInstallPrompt();
    this.registerServiceWorker();
    this.setupServiceWorkerMessages();
    
    console.log('🚀 [PWA] Service inicijalizovan');
  }

  checkInstallStatus() {
    // Check if app is installed/standalone
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');
    
    this.isInstalled = this.isStandalone;
    
    console.log('🚀 [PWA] Install status:', {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone
    });
  }

  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('🚀 [PWA] Install prompt available');
      
      // Prevent automatic prompt
      event.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = event;
      
      this.notifyListeners({
        type: 'install_available',
        canInstall: true
      });
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', (event) => {
      console.log('🚀 [PWA] App installed successfully');
      
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      this.notifyListeners({
        type: 'app_installed',
        isInstalled: true
      });
      
      // Track installation
      this.trackInstallation();
    });

    // Check for iOS install capability
    this.checkIOSInstall();
  }

  checkIOSInstall() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone;
    
    if (isIOS && !isInStandaloneMode) {
      this.notifyListeners({
        type: 'ios_install_available',
        platform: 'iOS'
      });
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/bde-evidencija/sw.js', {
          scope: '/bde-evidencija/'
        });
        
        this.serviceWorkerRegistration = registration;
        
        console.log('🚀 [PWA] Service Worker registered:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('🚀 [PWA] Service Worker update found');
          
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🚀 [PWA] New Service Worker available');
              
              this.notifyListeners({
                type: 'update_available',
                registration: registration
              });
            }
          });
        });
        
        // Setup background sync
        this.setupBackgroundSync();
        
        return registration;
      } catch (error) {
        console.error('🚀 [PWA] Service Worker registration failed:', error);
        throw error;
      }
    } else {
      console.warn('🚀 [PWA] Service Workers not supported');
    }
  }

  setupServiceWorkerMessages() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('🚀 [PWA] Message from Service Worker:', event.data);
        
        switch (event.data.type) {
          case 'SYNC_STARTED':
            this.syncInProgress = true;
            this.notifyListeners({
              type: 'sync_started'
            });
            break;
            
          case 'SYNC_COMPLETED':
            this.syncInProgress = false;
            this.notifyListeners({
              type: 'sync_completed'
            });
            break;
            
          case 'SYNC_FAILED':
            this.syncInProgress = false;
            this.notifyListeners({
              type: 'sync_failed',
              error: event.data.error
            });
            break;
        }
      });
    }
  }

  setupBackgroundSync() {
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('🚀 [PWA] Background Sync supported');
      
      // Setup periodic sync for data updates
      this.scheduleBackgroundSync();
    } else {
      console.warn('🚀 [PWA] Background Sync not supported');
    }
  }

  async scheduleBackgroundSync() {
    if (this.serviceWorkerRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await this.serviceWorkerRegistration.sync.register('background-sync-data');
        console.log('🚀 [PWA] Background sync scheduled');
      } catch (error) {
        console.error('🚀 [PWA] Background sync scheduling failed:', error);
      }
    }
  }

  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('🚀 [PWA] Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('🚀 [PWA] Install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        this.notifyListeners({
          type: 'install_accepted'
        });
      } else {
        this.notifyListeners({
          type: 'install_dismissed'
        });
      }
      
      // Clear the prompt
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('🚀 [PWA] Install prompt error:', error);
      return false;
    }
  }

  // Check if app can be installed
  canInstall() {
    return !this.isInstalled && this.deferredPrompt !== null;
  }

  // Check if iOS install instructions should be shown
  shouldShowIOSInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone;
    return isIOS && !isInStandaloneMode;
  }

  // Update service worker
  async updateServiceWorker() {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
        console.log('🚀 [PWA] Service Worker update triggered');
        
        // Send skip waiting message to activate new worker
        if (this.serviceWorkerRegistration.waiting) {
          this.serviceWorkerRegistration.waiting.postMessage({
            type: 'SKIP_WAITING'
          });
        }
        
        return true;
      } catch (error) {
        console.error('🚀 [PWA] Service Worker update failed:', error);
        return false;
      }
    }
    return false;
  }

  // Clear app cache
  async clearCache() {
    if (this.serviceWorkerRegistration) {
      try {
        // Send message to service worker to clear cache
        if (this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'CLEAR_CACHE'
          });
        }
        
        console.log('🚀 [PWA] Cache clear requested');
        return true;
      } catch (error) {
        console.error('🚀 [PWA] Cache clear failed:', error);
        return false;
      }
    }
    return false;
  }

  // Get app installation info
  getInstallInfo() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      canInstall: this.canInstall(),
      shouldShowIOSInstructions: this.shouldShowIOSInstructions(),
      serviceWorkerSupported: 'serviceWorker' in navigator,
      syncSupported: 'sync' in window.ServiceWorkerRegistration.prototype,
      notificationSupported: 'Notification' in window
    };
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('🚀 [PWA] Notification permission:', permission);
        
        this.notifyListeners({
          type: 'notification_permission',
          permission: permission
        });
        
        return permission === 'granted';
      } catch (error) {
        console.error('🚀 [PWA] Notification permission request failed:', error);
        return false;
      }
    }
    return false;
  }

  // Setup push notifications
  async setupPushNotifications() {
    if (!this.serviceWorkerRegistration) {
      console.warn('🚀 [PWA] Service Worker not available for push notifications');
      return false;
    }

    try {
      // Check for push support
      if (!('PushManager' in window)) {
        console.warn('🚀 [PWA] Push notifications not supported');
        return false;
      }

      // Request notification permission
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        console.warn('🚀 [PWA] Notification permission denied');
        return false;
      }

      // Subscribe to push notifications
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Dodaj tvoj VAPID public key ovde
          'YOUR_VAPID_PUBLIC_KEY'
        )
      });

      console.log('🚀 [PWA] Push subscription created:', subscription);
      
      this.notifyListeners({
        type: 'push_subscribed',
        subscription: subscription
      });

      return subscription;
    } catch (error) {
      console.error('🚀 [PWA] Push notification setup failed:', error);
      return false;
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Track installation for analytics
  trackInstallation() {
    try {
      // Send installation event to analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'app_install', {
          event_category: 'PWA',
          event_label: 'BDE Evidencija'
        });
      }
      
      // Store install timestamp
      localStorage.setItem('bde_app_installed', new Date().toISOString());
      
      console.log('🚀 [PWA] Installation tracked');
    } catch (error) {
      console.error('🚀 [PWA] Installation tracking failed:', error);
    }
  }

  // Check for app updates
  async checkForUpdates() {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
        console.log('🚀 [PWA] Update check completed');
        return true;
      } catch (error) {
        console.error('🚀 [PWA] Update check failed:', error);
        return false;
      }
    }
    return false;
  }

  // Get PWA capabilities
  getPWACapabilities() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'PushManager' in window,
      notifications: 'Notification' in window,
      installPrompt: 'beforeinstallprompt' in window,
      periodicSync: 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      geolocation: 'geolocation' in navigator,
      battery: 'getBattery' in navigator,
      vibration: 'vibrate' in navigator
    };
  }

  // Observer pattern
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
        console.error('🚀 [PWA] Listener error:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    this.listeners.clear();
    console.log('🚀 [PWA] Service destroyed');
  }
}

// Singleton instance
export const pwaService = new PWAService();

// React hook
import { useState, useEffect } from 'react';

export function usePWA() {
  const [installInfo, setInstallInfo] = useState(pwaService.getInstallInfo());
  const [capabilities, setCapabilities] = useState(pwaService.getPWACapabilities());
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const listener = (event) => {
      switch (event.type) {
        case 'install_available':
          setInstallInfo(prev => ({ ...prev, canInstall: true }));
          break;
        case 'app_installed':
          setInstallInfo(prev => ({ ...prev, isInstalled: true, canInstall: false }));
          break;
        case 'update_available':
          setUpdateAvailable(true);
          break;
        case 'sync_started':
          setSyncInProgress(true);
          break;
        case 'sync_completed':
        case 'sync_failed':
          setSyncInProgress(false);
          break;
      }
    };

    const unsubscribe = pwaService.addListener(listener);
    
    // Refresh info
    setInstallInfo(pwaService.getInstallInfo());
    setCapabilities(pwaService.getPWACapabilities());
    
    return unsubscribe;
  }, []);

  const showInstallPrompt = async () => {
    return await pwaService.showInstallPrompt();
  };

  const updateApp = async () => {
    const success = await pwaService.updateServiceWorker();
    if (success) {
      setUpdateAvailable(false);
      // Refresh page to activate new service worker
      setTimeout(() => window.location.reload(), 1000);
    }
    return success;
  };

  const clearCache = async () => {
    return await pwaService.clearCache();
  };

  const requestNotifications = async () => {
    return await pwaService.requestNotificationPermission();
  };

  const setupPushNotifications = async () => {
    return await pwaService.setupPushNotifications();
  };

  const checkForUpdates = async () => {
    return await pwaService.checkForUpdates();
  };

  return {
    installInfo,
    capabilities,
    updateAvailable,
    syncInProgress,
    showInstallPrompt,
    updateApp,
    clearCache,
    requestNotifications,
    setupPushNotifications,
    checkForUpdates,
    service: pwaService
  };
}