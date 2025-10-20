/**
 * 💾 IndexedDB Data Storage Service
 * Centralizovano upravljanje lokalnim podacima sa automatskim sync-om
 * Stores: route history, cached addresses, user preferences, offline data
 */

class IndexedDBStorageService {
  constructor() {
    this.dbName = 'BDEEvidencija';
    this.dbVersion = 2;
    this.db = null;
    this.isInitialized = false;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    // Store definitions
    this.stores = {
      routeHistory: {
        name: 'routeHistory',
        keyPath: 'id',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp', unique: false },
          { name: 'startAddress', keyPath: 'startAddress', unique: false },
          { name: 'endAddress', keyPath: 'endAddress', unique: false }
        ]
      },
      cachedAddresses: {
        name: 'cachedAddresses',
        keyPath: 'id',
        indexes: [
          { name: 'address', keyPath: 'address', unique: false },
          { name: 'coordinates', keyPath: 'coordinates', unique: false },
          { name: 'lastUsed', keyPath: 'lastUsed', unique: false }
        ]
      },
      userPreferences: {
        name: 'userPreferences',
        keyPath: 'key',
        indexes: [
          { name: 'category', keyPath: 'category', unique: false },
          { name: 'lastModified', keyPath: 'lastModified', unique: false }
        ]
      },
      offlineData: {
        name: 'offlineData',
        keyPath: 'id',
        indexes: [
          { name: 'type', keyPath: 'type', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false },
          { name: 'synced', keyPath: 'synced', unique: false }
        ]
      },
      searchHistory: {
        name: 'searchHistory',
        keyPath: 'id',
        indexes: [
          { name: 'query', keyPath: 'query', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false },
          { name: 'resultCount', keyPath: 'resultCount', unique: false }
        ]
      }
    };

    this.init();
  }

  async init() {
    try {
      await this.openDatabase();
      await this.cleanupOldData();
      this.setupNetworkListeners();
      this.isInitialized = true;
      console.log('💾 [Storage] Service inicijalizovan');
      
      // Pokušaj sync pending data
      this.processSyncQueue();
    } catch (error) {
      console.error('💾 [Storage] Inicijalizacija neuspešna:', error);
    }
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        console.log(`💾 [Storage] Upgrade from version ${oldVersion} to ${this.dbVersion}`);
        
        // Kreiraj/update stores
        Object.values(this.stores).forEach(storeConfig => {
          if (db.objectStoreNames.contains(storeConfig.name)) {
            db.deleteObjectStore(storeConfig.name);
          }
          
          const store = db.createObjectStore(storeConfig.name, { 
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.keyPath === 'id'
          });
          
          // Kreiraj indexes
          storeConfig.indexes.forEach(index => {
            store.createIndex(index.name, index.keyPath, { 
              unique: index.unique || false 
            });
          });
        });
      };
    });
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('💾 [Storage] Network online - processing sync queue');
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('💾 [Storage] Network offline');
    });
  }

  // === ROUTE HISTORY ===
  async saveRouteHistory(routeData) {
    const route = {
      id: Date.now(),
      startCoords: routeData.startCoords,
      endCoords: routeData.endCoords,
      startAddress: routeData.startAddress || '',
      endAddress: routeData.endAddress || '',
      distance: routeData.distance || 0,
      duration: routeData.duration || 0,
      timestamp: new Date().toISOString(),
      polyline: routeData.polyline || '',
      metadata: routeData.metadata || {}
    };

    try {
      await this.add('routeHistory', route);
      console.log('💾 [Storage] Route history saved:', route.id);
      
      // Cleanup old routes (keep last 50)
      await this.cleanupRouteHistory();
      
      return route.id;
    } catch (error) {
      console.error('💾 [Storage] Error saving route history:', error);
      throw error;
    }
  }

  async getRouteHistory(limit = 20) {
    try {
      const routes = await this.getAll('routeHistory', 'timestamp', 'prev', limit);
      return routes;
    } catch (error) {
      console.error('💾 [Storage] Error getting route history:', error);
      return [];
    }
  }

  async searchRouteHistory(query) {
    try {
      const allRoutes = await this.getAll('routeHistory');
      return allRoutes.filter(route => 
        route.startAddress.toLowerCase().includes(query.toLowerCase()) ||
        route.endAddress.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('💾 [Storage] Error searching route history:', error);
      return [];
    }
  }

  async cleanupRouteHistory() {
    try {
      const routes = await this.getAll('routeHistory', 'timestamp', 'prev');
      if (routes.length > 50) {
        const toDelete = routes.slice(50);
        for (const route of toDelete) {
          await this.delete('routeHistory', route.id);
        }
        console.log(`💾 [Storage] Cleaned up ${toDelete.length} old routes`);
      }
    } catch (error) {
      console.error('💾 [Storage] Error cleaning route history:', error);
    }
  }

  // === CACHED ADDRESSES ===
  async cacheAddress(address, coordinates, metadata = {}) {
    const cached = {
      id: this.generateAddressId(address, coordinates),
      address: address,
      coordinates: coordinates,
      metadata: metadata,
      lastUsed: new Date().toISOString(),
      useCount: 1
    };

    try {
      // Check if exists and update use count
      const existing = await this.get('cachedAddresses', cached.id);
      if (existing) {
        cached.useCount = existing.useCount + 1;
        cached.firstCached = existing.firstCached;
      } else {
        cached.firstCached = cached.lastUsed;
      }

      await this.put('cachedAddresses', cached);
      console.log('💾 [Storage] Address cached:', address);
      
      return cached.id;
    } catch (error) {
      console.error('💾 [Storage] Error caching address:', error);
      throw error;
    }
  }

  async getCachedAddress(query) {
    try {
      const addresses = await this.getAll('cachedAddresses');
      return addresses.find(addr => 
        addr.address.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('💾 [Storage] Error getting cached address:', error);
      return null;
    }
  }

  async searchCachedAddresses(query, limit = 10) {
    try {
      const addresses = await this.getAll('cachedAddresses');
      const filtered = addresses
        .filter(addr => addr.address.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.useCount - a.useCount) // Sort by use count
        .slice(0, limit);
      
      return filtered;
    } catch (error) {
      console.error('💾 [Storage] Error searching cached addresses:', error);
      return [];
    }
  }

  generateAddressId(address, coordinates) {
    const coordStr = `${coordinates.lat.toFixed(4)},${coordinates.lon.toFixed(4)}`;
    return btoa(address + coordStr).replace(/[^a-zA-Z0-9]/g, '');
  }

  // === USER PREFERENCES ===
  async savePreference(key, value, category = 'general') {
    const preference = {
      key: key,
      value: value,
      category: category,
      lastModified: new Date().toISOString()
    };

    try {
      await this.put('userPreferences', preference);
      console.log('💾 [Storage] Preference saved:', key, value);
      return true;
    } catch (error) {
      console.error('💾 [Storage] Error saving preference:', error);
      return false;
    }
  }

  async getPreference(key, defaultValue = null) {
    try {
      const preference = await this.get('userPreferences', key);
      return preference ? preference.value : defaultValue;
    } catch (error) {
      console.error('💾 [Storage] Error getting preference:', error);
      return defaultValue;
    }
  }

  async getAllPreferences(category = null) {
    try {
      const preferences = await this.getAll('userPreferences');
      if (category) {
        return preferences.filter(pref => pref.category === category);
      }
      return preferences;
    } catch (error) {
      console.error('💾 [Storage] Error getting preferences:', error);
      return [];
    }
  }

  // === OFFLINE DATA QUEUE ===
  async queueOfflineData(type, data, metadata = {}) {
    const offlineItem = {
      id: Date.now() + Math.random(),
      type: type,
      data: data,
      metadata: metadata,
      timestamp: new Date().toISOString(),
      synced: false,
      attempts: 0
    };

    try {
      await this.add('offlineData', offlineItem);
      console.log('💾 [Storage] Offline data queued:', type);
      
      // Pokušaj sync ako si online
      if (this.isOnline) {
        this.processSyncQueue();
      }
      
      return offlineItem.id;
    } catch (error) {
      console.error('💾 [Storage] Error queuing offline data:', error);
      throw error;
    }
  }

  async processSyncQueue() {
    if (!this.isOnline) return;

    try {
      const pendingItems = await this.getAllByIndex('offlineData', 'synced', false);
      
      for (const item of pendingItems) {
        try {
          // Pokušaj sync (ovo treba implementirati na osnovu tipa)
          const success = await this.syncOfflineItem(item);
          
          if (success) {
            item.synced = true;
            item.syncedAt = new Date().toISOString();
            await this.put('offlineData', item);
            console.log('💾 [Storage] Synced offline item:', item.id);
          } else {
            item.attempts = (item.attempts || 0) + 1;
            await this.put('offlineData', item);
          }
        } catch (error) {
          console.error('💾 [Storage] Error syncing item:', item.id, error);
          item.attempts = (item.attempts || 0) + 1;
          await this.put('offlineData', item);
        }
      }
    } catch (error) {
      console.error('💾 [Storage] Error processing sync queue:', error);
    }
  }

  async syncOfflineItem(item) {
    // Implementiraj specifican sync logic na osnovu item.type
    switch (item.type) {
      case 'route_completion':
        // Sync route completion to server
        return await this.syncRouteCompletion(item.data);
      case 'user_activity':
        // Sync user activity
        return await this.syncUserActivity(item.data);
      default:
        console.warn('💾 [Storage] Unknown sync type:', item.type);
        return false;
    }
  }

  async syncRouteCompletion(data) {
    // Placeholder - implementiraj integration sa tvojim backend-om
    console.log('💾 [Storage] Syncing route completion:', data);
    return true; // Mock success
  }

  async syncUserActivity(data) {
    // Placeholder - implementiraj integration sa tvojim backend-om
    console.log('💾 [Storage] Syncing user activity:', data);
    return true; // Mock success
  }

  // === SEARCH HISTORY ===
  async saveSearchHistory(query, results) {
    const search = {
      id: Date.now(),
      query: query,
      resultCount: results.length,
      timestamp: new Date().toISOString(),
      results: results.slice(0, 5) // Keep top 5 results
    };

    try {
      await this.add('searchHistory', search);
      
      // Cleanup old searches (keep last 100)
      await this.cleanupSearchHistory();
      
      console.log('💾 [Storage] Search history saved:', query);
      return search.id;
    } catch (error) {
      console.error('💾 [Storage] Error saving search history:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query, limit = 5) {
    try {
      const searches = await this.getAll('searchHistory');
      const suggestions = searches
        .filter(search => search.query.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        .map(search => search.query);
      
      return [...new Set(suggestions)]; // Remove duplicates
    } catch (error) {
      console.error('💾 [Storage] Error getting search suggestions:', error);
      return [];
    }
  }

  async cleanupSearchHistory() {
    try {
      const searches = await this.getAll('searchHistory', 'timestamp', 'prev');
      if (searches.length > 100) {
        const toDelete = searches.slice(100);
        for (const search of toDelete) {
          await this.delete('searchHistory', search.id);
        }
        console.log(`💾 [Storage] Cleaned up ${toDelete.length} old searches`);
      }
    } catch (error) {
      console.error('💾 [Storage] Error cleaning search history:', error);
    }
  }

  // === GENERIC DATABASE OPERATIONS ===
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, direction = 'next', limit = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      
      const request = source.openCursor(null, direction);
      const results = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && (!limit || results.length < limit)) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // === MAINTENANCE ===
  async cleanupOldData() {
    try {
      await this.cleanupRouteHistory();
      await this.cleanupSearchHistory();
      
      // Cleanup old cached addresses (remove unused ones older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const addresses = await this.getAll('cachedAddresses');
      const toDelete = addresses.filter(addr => 
        new Date(addr.lastUsed) < thirtyDaysAgo && addr.useCount < 3
      );
      
      for (const addr of toDelete) {
        await this.delete('cachedAddresses', addr.id);
      }
      
      if (toDelete.length > 0) {
        console.log(`💾 [Storage] Cleaned up ${toDelete.length} old cached addresses`);
      }
    } catch (error) {
      console.error('💾 [Storage] Error during cleanup:', error);
    }
  }

  async getStorageStats() {
    const stats = {};
    
    for (const storeName of Object.keys(this.stores)) {
      try {
        stats[storeName] = await this.count(storeName);
      } catch (error) {
        stats[storeName] = 0;
      }
    }
    
    return {
      stores: stats,
      isOnline: this.isOnline,
      isInitialized: this.isInitialized,
      dbVersion: this.dbVersion
    };
  }

  // Cleanup
  destroy() {
    if (this.db) {
      this.db.close();
    }
    console.log('💾 [Storage] Service destroyed');
  }
}

// Singleton instance
export const indexedDBStorageService = new IndexedDBStorageService();

// React hook
import { useState, useEffect } from 'react';

export function useIndexedDBStorage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const checkInitialization = async () => {
      let attempts = 0;
      while (!indexedDBStorageService.isInitialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      setIsInitialized(indexedDBStorageService.isInitialized);
      
      if (indexedDBStorageService.isInitialized) {
        const storageStats = await indexedDBStorageService.getStorageStats();
        setStats(storageStats);
      }
    };

    checkInitialization();
  }, []);

  const refreshStats = async () => {
    if (indexedDBStorageService.isInitialized) {
      const storageStats = await indexedDBStorageService.getStorageStats();
      setStats(storageStats);
    }
  };

  // Convenience methods
  const saveRoute = async (routeData) => {
    return await indexedDBStorageService.saveRouteHistory(routeData);
  };

  const getRoutes = async (limit) => {
    return await indexedDBStorageService.getRouteHistory(limit);
  };

  const cacheAddress = async (address, coordinates, metadata) => {
    return await indexedDBStorageService.cacheAddress(address, coordinates, metadata);
  };

  const searchAddresses = async (query, limit) => {
    return await indexedDBStorageService.searchCachedAddresses(query, limit);
  };

  const savePreference = async (key, value, category) => {
    return await indexedDBStorageService.savePreference(key, value, category);
  };

  const getPreference = async (key, defaultValue) => {
    return await indexedDBStorageService.getPreference(key, defaultValue);
  };

  const queueOfflineData = async (type, data, metadata) => {
    return await indexedDBStorageService.queueOfflineData(type, data, metadata);
  };

  return {
    isInitialized,
    stats,
    refreshStats,
    saveRoute,
    getRoutes,
    cacheAddress,
    searchAddresses,
    savePreference,
    getPreference,
    queueOfflineData,
    service: indexedDBStorageService
  };
}