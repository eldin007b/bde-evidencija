/**
 * 🗺️ Map Tile Caching Service
 * Cache Leaflet map tiles u IndexedDB za offline uporabu
 * Optimizovan za minimalno memorijsko zauzećeaže
 */

class MapTileCacheService {
  constructor() {
    this.dbName = 'MapTileCache';
    this.dbVersion = 1;
    this.storeName = 'tiles';
    this.db = null;
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
    this.maxTileAge = 7 * 24 * 60 * 60 * 1000; // 7 dana
    this.isInitialized = false;
    
    this.init();
  }

  async init() {
    try {
      await this.openDatabase();
      await this.cleanupOldTiles();
      this.isInitialized = true;
      console.log('🗺️ [MapCache] Service inicijalizovan');
    } catch (error) {
      console.error('🗺️ [MapCache] Inicijalizacija neuspešna:', error);
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
        
        // Obriši postojeći store ako postoji
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }
        
        // Kreiraj novi store
        const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('size', 'size', { unique: false });
      };
    });
  }

  // Generiši ključ tile-a na osnovu URL-a
  generateTileKey(url) {
    // Normalizuj URL da bude konzistentan
    return url.replace(/[?&]t=\d+/, ''); // Ukloni timestamp parametre
  }

  // Cache tile
  async cacheTile(url, blob) {
    if (!this.isInitialized || !this.db) return false;

    try {
      const key = this.generateTileKey(url);
      const size = blob.size;
      const timestamp = Date.now();

      // Proverava li ima mesta u cache-u
      const cacheSize = await this.getCacheSize();
      if (cacheSize + size > this.maxCacheSize) {
        await this.cleanupCache();
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const tileData = {
        url: key,
        blob: blob,
        size: size,
        timestamp: timestamp
      };

      await new Promise((resolve, reject) => {
        const request = store.put(tileData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`🗺️ [MapCache] Tile cached: ${url.slice(-20)}... (${(size/1024).toFixed(1)}KB)`);
      return true;
    } catch (error) {
      console.error('🗺️ [MapCache] Error caching tile:', error);
      return false;
    }
  }

  // Dobij cached tile
  async getCachedTile(url) {
    if (!this.isInitialized || !this.db) return null;

    try {
      const key = this.generateTileKey(url);
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const result = await new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (result) {
        // Proverava li je tile prestaro
        const age = Date.now() - result.timestamp;
        if (age > this.maxTileAge) {
          await this.deleteTile(key);
          return null;
        }

        console.log(`🗺️ [MapCache] Tile served from cache: ${url.slice(-20)}...`);
        return result.blob;
      }

      return null;
    } catch (error) {
      console.error('🗺️ [MapCache] Error getting cached tile:', error);
      return null;
    }
  }

  // Obriši tile iz cache-a
  async deleteTile(key) {
    if (!this.isInitialized || !this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('🗺️ [MapCache] Error deleting tile:', error);
    }
  }

  // Dobij ukupnu veličinu cache-a
  async getCacheSize() {
    if (!this.isInitialized || !this.db) return 0;

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return await new Promise((resolve, reject) => {
        const request = store.openCursor();
        let totalSize = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            totalSize += cursor.value.size || 0;
            cursor.continue();
          } else {
            resolve(totalSize);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('🗺️ [MapCache] Error calculating cache size:', error);
      return 0;
    }
  }

  // Dobij broj cached tile-ova
  async getTileCount() {
    if (!this.isInitialized || !this.db) return 0;

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('🗺️ [MapCache] Error counting tiles:', error);
      return 0;
    }
  }

  // Očisti stare tile-ove
  async cleanupOldTiles() {
    if (!this.isInitialized || !this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const cutoffTime = Date.now() - this.maxTileAge;
      const range = IDBKeyRange.upperBound(cutoffTime);

      let deletedCount = 0;
      
      await new Promise((resolve, reject) => {
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (deletedCount > 0) {
        console.log(`🗺️ [MapCache] Cleaned up ${deletedCount} old tiles`);
      }
    } catch (error) {
      console.error('🗺️ [MapCache] Error cleaning up old tiles:', error);
    }
  }

  // Očisti cache kad je pun (LRU strategy)
  async cleanupCache() {
    if (!this.isInitialized || !this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');

      // Obriši najstariji 25% tile-ova
      const tiles = [];
      
      await new Promise((resolve, reject) => {
        const request = index.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            tiles.push({
              url: cursor.value.url,
              timestamp: cursor.value.timestamp,
              size: cursor.value.size
            });
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // Sortiraj po timestamp (najstariji prvi)
      tiles.sort((a, b) => a.timestamp - b.timestamp);
      
      const tilesToDelete = tiles.slice(0, Math.floor(tiles.length * 0.25));
      
      for (const tile of tilesToDelete) {
        await this.deleteTile(tile.url);
      }

      console.log(`🗺️ [MapCache] Cleaned up ${tilesToDelete.length} tiles to free space`);
    } catch (error) {
      console.error('🗺️ [MapCache] Error during cache cleanup:', error);
    }
  }

  // Obriši kompletan cache
  async clearCache() {
    if (!this.isInitialized || !this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('🗺️ [MapCache] Cache cleared');
    } catch (error) {
      console.error('🗺️ [MapCache] Error clearing cache:', error);
    }
  }

  // Dobij statistike cache-a
  async getCacheStats() {
    const size = await this.getCacheSize();
    const count = await this.getTileCount();
    
    return {
      size: size,
      sizeFormatted: this.formatBytes(size),
      count: count,
      maxSize: this.maxCacheSize,
      maxSizeFormatted: this.formatBytes(this.maxCacheSize),
      utilization: (size / this.maxCacheSize * 100).toFixed(1) + '%'
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Preload tile-ovi za određenu oblast
  async preloadArea(bounds, zoomLevels = [10, 11, 12, 13, 14]) {
    console.log('🗺️ [MapCache] Starting area preload:', bounds, zoomLevels);
    
    let totalTiles = 0;
    let cachedTiles = 0;

    for (const zoom of zoomLevels) {
      const tiles = this.getTilesInBounds(bounds, zoom);
      totalTiles += tiles.length;

      for (const tileInfo of tiles) {
        try {
          const url = this.buildTileUrl(tileInfo.x, tileInfo.y, tileInfo.z);
          const cached = await this.getCachedTile(url);
          
          if (!cached) {
            // Fetch and cache tile
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              await this.cacheTile(url, blob);
              cachedTiles++;
            }
          }
        } catch (error) {
          console.warn('🗺️ [MapCache] Failed to preload tile:', error);
        }
      }
    }

    console.log(`🗺️ [MapCache] Preload complete: ${cachedTiles}/${totalTiles} tiles cached`);
    return { totalTiles, cachedTiles };
  }

  // Dobij tile koordinate u određenim granicama
  getTilesInBounds(bounds, zoom) {
    const tiles = [];
    const nwTile = this.latLngToTile(bounds.getNorthWest(), zoom);
    const seTile = this.latLngToTile(bounds.getSouthEast(), zoom);

    for (let x = nwTile.x; x <= seTile.x; x++) {
      for (let y = nwTile.y; y <= seTile.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }

  // Konvertuj lat/lng u tile koordinate
  latLngToTile(latLng, zoom) {
    const lat = latLng.lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    
    return {
      x: Math.floor((latLng.lng + 180) / 360 * n),
      y: Math.floor((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * n)
    };
  }

  // Kreiraj tile URL (OpenStreetMap format)
  buildTileUrl(x, y, z) {
    const subdomain = ['a', 'b', 'c'][Math.abs(x + y) % 3];
    return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }
}

// Singleton instance
export const mapTileCacheService = new MapTileCacheService();

// Leaflet tile layer sa cache support
export class CachedTileLayer {
  constructor(urlTemplate, options = {}) {
    this.urlTemplate = urlTemplate;
    this.options = options;
    this.cacheService = mapTileCacheService;
  }

  // Override za Leaflet tile loading
  createTile(coords, done) {
    const tile = document.createElement('img');
    const url = this.getTileUrl(coords);

    // Pokušaj dobiti iz cache-a prvo
    this.cacheService.getCachedTile(url).then(cachedBlob => {
      if (cachedBlob) {
        // Serve from cache
        tile.src = URL.createObjectURL(cachedBlob);
        done(null, tile);
      } else {
        // Fetch from network i cache
        tile.onload = () => {
          // Cache tile nakon uspešnog učitavanja
          fetch(url)
            .then(response => response.blob())
            .then(blob => this.cacheService.cacheTile(url, blob))
            .catch(error => console.warn('🗺️ Failed to cache tile:', error));
          
          done(null, tile);
        };
        tile.onerror = (error) => done(error, tile);
        tile.src = url;
      }
    }).catch(error => {
      // Fallback na mrežno učitavanje
      console.warn('🗺️ Cache lookup failed, falling back to network:', error);
      tile.onload = () => done(null, tile);
      tile.onerror = (error) => done(error, tile);
      tile.src = url;
    });

    return tile;
  }

  getTileUrl(coords) {
    return this.urlTemplate
      .replace('{x}', coords.x)
      .replace('{y}', coords.y)
      .replace('{z}', coords.z);
  }
}

// React hook za map cache
import { useState, useEffect } from 'react';

export function useMapCache() {
  const [stats, setStats] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkInitialization = async () => {
      // Sačekaj da se cache inicijalizuje
      let attempts = 0;
      while (!mapTileCacheService.isInitialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      setIsInitialized(mapTileCacheService.isInitialized);
      
      if (mapTileCacheService.isInitialized) {
        const cacheStats = await mapTileCacheService.getCacheStats();
        setStats(cacheStats);
      }
    };

    checkInitialization();
  }, []);

  const refreshStats = async () => {
    if (mapTileCacheService.isInitialized) {
      const cacheStats = await mapTileCacheService.getCacheStats();
      setStats(cacheStats);
    }
  };

  const clearCache = async () => {
    await mapTileCacheService.clearCache();
    await refreshStats();
  };

  const preloadArea = async (bounds, zoomLevels) => {
    return await mapTileCacheService.preloadArea(bounds, zoomLevels);
  };

  return {
    stats,
    isInitialized,
    refreshStats,
    clearCache,
    preloadArea,
    cacheService: mapTileCacheService
  };
}