/**
 * 🌍 Debounced Reverse Geocoding Service
 * Inteligentno upravljanje reverse geocoding pozivima sa:
 * - Debouncing za smanjenje API poziva
 * - Distance-based throttling (ne pozivaj ako se nisi pomerio dovoljno)
 * - Caching rezultata
 * - Adaptivno ponašanje na osnovu brzine kretanja
 */

import { haversineKm } from '../utils/geoUtils';
import ENV from '../config/env';

class DebouncedReverseGeocodingService {
  constructor() {
    this.debounceDelay = 2000; // 2 sekunde default
    this.minDistanceThreshold = 0.05; // 50 metara minimum pokret
    this.speedAdaptiveThresholds = {
      walking: { speed: 5, distance: 0.02, delay: 1500 },     // Hodanje: 20m, 1.5s
      cycling: { speed: 20, distance: 0.05, delay: 2000 },    // Bicikl: 50m, 2s  
      driving: { speed: 50, distance: 0.1, delay: 3000 },     // Vožnja: 100m, 3s
      highway: { speed: 80, distance: 0.2, delay: 4000 }      // Autoput: 200m, 4s
    };
    
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.cacheExpirationTime = 10 * 60 * 1000; // 10 minuta
    
    this.lastPosition = null;
    this.lastGeocodingTime = 0;
    this.pendingTimeout = null;
    this.currentSpeed = 0;
    this.listeners = new Set();
    
    console.log('🌍 [ReverseGeo] Service inicijalizovan');
  }

  // Glavni metod za reverse geocoding sa debouncing-om
  async reverseGeocode(lat, lon, speed = 0, force = false) {
    this.currentSpeed = speed;
    const now = Date.now();
    const position = { lat, lon };

    // Generiši cache ključ
    const cacheKey = this.generateCacheKey(lat, lon);
    
    // Proveri cache prvo
    if (!force) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        console.log('🌍 [ReverseGeo] Served from cache:', cacheKey);
        this.notifyListeners({
          type: 'result',
          data: cached.data,
          source: 'cache',
          position
        });
        return cached.data;
      }
    }

    // Adaptivni thresholds na osnovu brzine
    const thresholds = this.getSpeedBasedThresholds(speed);
    
    // Proveri da li se dovoljno pomerio
    if (!force && this.lastPosition) {
      const distance = haversineKm(
        this.lastPosition.lat, this.lastPosition.lon,
        lat, lon
      );
      
      if (distance < thresholds.distance) {
        console.log(`🌍 [ReverseGeo] Skipped - insufficient movement: ${(distance * 1000).toFixed(0)}m < ${(thresholds.distance * 1000).toFixed(0)}m`);
        return null;
      }
    }

    // Proveri da li je prošlo dovoljno vremena
    if (!force && (now - this.lastGeocodingTime) < thresholds.delay) {
      console.log(`🌍 [ReverseGeo] Skipped - too soon: ${now - this.lastGeocodingTime}ms < ${thresholds.delay}ms`);
      
      // Schedule delayed geocoding
      this.scheduleDelayedGeocoding(lat, lon, speed, thresholds.delay);
      return null;
    }

    // Cancel pending timeout
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Izvrši reverse geocoding
    return await this.performGeocoding(lat, lon, position, cacheKey);
  }

  // Schedule delayed geocoding
  scheduleDelayedGeocoding(lat, lon, speed, delay) {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    this.pendingTimeout = setTimeout(async () => {
      console.log('🌍 [ReverseGeo] Executing delayed geocoding');
      await this.reverseGeocode(lat, lon, speed, true);
      this.pendingTimeout = null;
    }, delay);
  }

  // Izvrši actual geocoding
  async performGeocoding(lat, lon, position, cacheKey) {
    try {
      this.notifyListeners({
        type: 'started',
        position
      });

      // Pozovi actual reverse geocoding funkciju (iz MapCardModern)
      const result = await this.callReverseGeocodingAPI(lat, lon);
      
      if (result && (result.address || result.city)) {
        // Cache rezultat
        this.setCached(cacheKey, result);
        
        // Update tracking variables
        this.lastPosition = position;
        this.lastGeocodingTime = Date.now();
        
        console.log(`🌍 [ReverseGeo] Success for ${(lat).toFixed(4)}, ${(lon).toFixed(4)}:`, result);
        
        this.notifyListeners({
          type: 'result',
          data: result,
          source: 'api',
          position
        });
        
        return result;
      } else {
        console.warn('🌍 [ReverseGeo] No valid result received');
        return null;
      }
    } catch (error) {
      console.error('🌍 [ReverseGeo] Error:', error);
      this.notifyListeners({
        type: 'error',
        error: error.message,
        position
      });
      return null;
    } finally {
      this.notifyListeners({
        type: 'finished',
        position
      });
    }
  }

  // Adaptivni thresholds na osnovu brzine
  getSpeedBasedThresholds(speed) {
    const speedKmh = (speed || 0) * 3.6; // m/s to km/h
    
    if (speedKmh < this.speedAdaptiveThresholds.walking.speed) {
      return this.speedAdaptiveThresholds.walking;
    } else if (speedKmh < this.speedAdaptiveThresholds.cycling.speed) {
      return this.speedAdaptiveThresholds.cycling;
    } else if (speedKmh < this.speedAdaptiveThresholds.driving.speed) {
      return this.speedAdaptiveThresholds.driving;
    } else {
      return this.speedAdaptiveThresholds.highway;
    }
  }

  // Cache management
  generateCacheKey(lat, lon) {
    // Round to ~100m precision for caching
    const precision = 3;
    return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.cacheExpirationTime) {
        cached.lastAccessed = now; // LRU tracking
        return cached;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  setCached(key, data) {
    const now = Date.now();
    
    // Cleanup cache if it's getting too large
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      lastAccessed: now
    });
  }

  cleanupCache() {
    // Remove oldest 25% of entries (LRU)
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`🌍 [ReverseGeo] Cache cleanup: removed ${toRemove} entries`);
  }

  // API poziv - trebas implementirati na osnovu tvog existing koda
  async callReverseGeocodingAPI(lat, lon) {
    // Ovo je placeholder - trebas zameniti sa tvojim postojećim kodom iz MapCardModern
    // Možeš koristiti isti kod što se koristi u MapCardModern reverseGeocode funkciji
    
    try {
      const x = Math.round(lon * 1e6);
      const y = Math.round(lat * 1e6);
      
      const VAO_URL = `${ENV.API_BASE_URL}/vor-proxy`;
      const VAO_BODY_BASE = {
        id: 'ibwmnqg8g2kj8iwg',
        ver: '1.59',
        lang: 'deu',
        auth: { type: 'AID', aid: 'wf7mcf9bv3nv8g5f' },
        client: {
          id: 'VAO',
          type: 'WEB',
          name: 'webapp',
          l: 'vs_anachb',
          v: 10010,
          pos: { x, y, acc: 20 }
        },
        formatted: false,
        ext: 'VAO.22',
        svcReqL: []
      };

      // 1) Try LocGeoPos first (closest address/POI)
      const geoBody = {
        ...VAO_BODY_BASE,
        svcReqL: [
          {
            meth: 'LocGeoPos',
            req: {
              ring: { cCrd: { x, y }, minDist: 0, maxDist: 30 },
              locL: [
                { type: 'S', mode: ['foot', 'bike', 'car'] },
                { type: 'P' },
                { type: 'A' }
              ],
              maxLoc: 1,
              getPOIs: false,
              getStops: false
            }
          }
        ]
      };

      const geoResponse = await fetch(VAO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geoBody)
      });

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData?.svcResL?.[0]?.res?.locL?.[0]) {
          const loc = geoData.svcResL[0].res.locL[0];
          if (loc.name) {
            const parts = loc.name.split(',');
            const line1 = parts[0]?.trim() || '';
            let line2 = '';
            if (parts.length > 1) {
              line2 = parts.slice(1).join(',').trim();
            }
            return { address: line1, city: line2 };
          }
        }
      }

      // 2) Fallback to LocMatch
      const matchBody = {
        ...VAO_BODY_BASE,
        svcReqL: [
          {
            meth: 'LocMatch',
            req: {
              input: {
                loc: { name: '', crd: { x, y }, type: 'C' },
                field: 'S'
              }
            }
          }
        ]
      };

      const matchResponse = await fetch(VAO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchBody)
      });

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        if (matchData?.svcResL?.[0]?.res?.match?.locL?.[0]) {
          const loc = matchData.svcResL[0].res.match.locL[0];
          if (loc.name) {
            const parts = loc.name.split(',');
            const line1 = parts[0]?.trim() || '';
            let line2 = '';
            if (parts.length > 1) {
              line2 = parts.slice(1).join(',').trim();
            }
            return { address: line1, city: line2 };
          }
        }
      }

      return { address: '', city: '' };
    } catch (error) {
      console.error('🌍 [ReverseGeo] VAO API Error:', error);
      
      // Fallback to Nominatim when VAO proxy fails
      try {
        console.log('🌍 [ReverseGeo] Trying Nominatim fallback...');
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=de,en&addressdetails=1`
        );

        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          console.log('🌍 [ReverseGeo] Nominatim fallback response:', nominatimData);

          if (nominatimData.display_name) {
            let address = nominatimData.display_name;

            // Try to create a shorter human-friendly address
            if (nominatimData.address) {
              const addr = nominatimData.address;
              let formattedAddr = '';
              
              if (addr.house_number && addr.road) {
                formattedAddr = `${addr.road} ${addr.house_number}`;
              } else if (addr.road) {
                formattedAddr = addr.road;
              } else if (addr.suburb) {
                formattedAddr = addr.suburb;
              }
              
              let city = '';
              if (addr.postcode && addr.city) {
                city = `${addr.postcode} ${addr.city}`;
              } else if (addr.city) {
                city = addr.city;
              } else if (addr.town) {
                city = addr.town;
              } else if (addr.village) {
                city = addr.village;
              }
              
              return { 
                address: formattedAddr || address.split(',')[0], 
                city: city || '' 
              };
            }
            
            return { 
              address: address.split(',')[0] || '', 
              city: address.split(',')[1]?.trim() || '' 
            };
          }
        }
      } catch (nominatimError) {
        console.error('🌍 [ReverseGeo] Nominatim fallback also failed:', nominatimError);
      }
      
      // Final fallback: coordinates
      return { 
        address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, 
        city: 'Koordinaten' 
      };
    }
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
        console.error('🌍 [ReverseGeo] Listener error:', error);
      }
    });
  }

  // Statistike i debugging
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      lastPosition: this.lastPosition,
      lastGeocodingTime: this.lastGeocodingTime,
      currentSpeed: this.currentSpeed,
      currentThresholds: this.getSpeedBasedThresholds(this.currentSpeed),
      isPending: !!this.pendingTimeout
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('🌍 [ReverseGeo] Cache cleared');
  }

  // Manual override za testing
  setThresholds(customThresholds) {
    Object.assign(this.speedAdaptiveThresholds, customThresholds);
    console.log('🌍 [ReverseGeo] Custom thresholds applied:', customThresholds);
  }

  // Cleanup
  destroy() {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }
    this.cache.clear();
    this.listeners.clear();
    console.log('🌍 [ReverseGeo] Service destroyed');
  }
}

// Singleton instance
export const debouncedReverseGeocodingService = new DebouncedReverseGeocodingService();

// React hook
import { useState, useEffect } from 'react';

export function useDeboncedReverseGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const listener = (event) => {
      switch (event.type) {
        case 'started':
          setIsLoading(true);
          setError(null);
          break;
        case 'result':
          setLastResult(event.data);
          setIsLoading(false);
          break;
        case 'error':
          setError(event.error);
          setIsLoading(false);
          break;
        case 'finished':
          setIsLoading(false);
          break;
      }
    };

    const unsubscribe = debouncedReverseGeocodingService.addListener(listener);
    
    // Load initial stats
    setStats(debouncedReverseGeocodingService.getStats());
    
    return unsubscribe;
  }, []);

  const reverseGeocode = async (lat, lon, speed, force = false) => {
    return await debouncedReverseGeocodingService.reverseGeocode(lat, lon, speed, force);
  };

  const refreshStats = () => {
    setStats(debouncedReverseGeocodingService.getStats());
  };

  const clearCache = () => {
    debouncedReverseGeocodingService.clearCache();
    refreshStats();
  };

  return {
    isLoading,
    lastResult,
    error,
    stats,
    reverseGeocode,
    refreshStats,
    clearCache,
    service: debouncedReverseGeocodingService
  };
}