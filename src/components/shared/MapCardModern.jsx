// MapCardModern.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './MapCardModern2026.module.css';
import { searchAddresses } from './AddressSearchService';
import { getDrivingRouteInfo, formatDistance as gmFormatDistance, formatDuration as gmFormatDuration } from '../../utils/googleMaps';
import { getRouteFromMapQuest } from '../../utils/mapQuest';
import { fetchVoranachbRoute } from '../../utils/voranachb';
import ENV from '../../config/env';
import { analyzePolyline } from '../../utils/polylineUtils';

const MapCardModern = ({ 
  children, 
  className = '', 
  style, 
  title = 'Mapa dostave - Austrija',
  loading = false,
  address = '',
  city = '',
  onNavigate,
  onSearchSelect,
  mapRef,
  onLocateMe,
  autoLocate = true,
  selectedMarker = null,
  footerRef,
  isMobile = (typeof window !== 'undefined') ? window.innerWidth < 768 : false,
  // Optional: parent can pass measured header height (px) to calculate remaining viewport space
  headerHeight = 80
  ,onMapClickCloseSidebar
}) => {
  // Helper: compact address formatter (street number, postal)
  const formatCompactAddress = (addr, cityOrPostal) => {
    if (!addr && !cityOrPostal) return '';
    // Try extract street+number and postal code
    let streetPart = '';
    let postalPart = '';
    if (addr) {
      // if address contains comma-separated parts, prefer first part
      streetPart = addr.split(',')[0].trim();
    }
    if (cityOrPostal) {
      // if cityOrPostal contains numeric postal, pick last numeric token
      const postalMatch = String(cityOrPostal).match(/(\d{3,6})/);
      postalPart = postalMatch ? postalMatch[0] : String(cityOrPostal).split(',')[0].trim();
    }
    if (streetPart && postalPart) return `${streetPart}, ${postalPart}`;
    if (streetPart) return streetPart;
    return postalPart;
  };

  // Try to compact a full address string (possibly 'Street, City' or with <br> tags)
  const compactFromFull = (full) => {
    if (!full) return '';
    // remove HTML line breaks
    const cleaned = String(full).replace(/<br\s*\/?[^>]*>/gi, ',').trim();
    if (!cleaned) return '';
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      const addr = parts[0].trim();
      const rest = parts.slice(1).join(',').trim();
      return formatCompactAddress(addr, rest);
    }
    // fallback: truncate to 40 chars
    if (cleaned.length > 40) return cleaned.slice(0, 37) + '...';
    return cleaned;
  };
  // Zoom kontrole
  const handleZoomIn = () => {
    if (mapRef?.current?.zoomIn) mapRef.current.zoomIn();
  };
  
  const handleZoomOut = () => {
    if (mapRef?.current?.zoomOut) mapRef.current.zoomOut();
  };

  // locate: always use GPS
  const handleLocateMe = () => {
    console.log('📍 Lociraj me kliknuto - tražim GPS lokaciju');

    if (!navigator.geolocation) {
      alert('Geolokacija nije podržana u ovom pregledniku.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('📍 GPS lokacija pronađena:', pos.coords);
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCurrentCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });

        try {
          if (mapRef?.current?.setView) mapRef.current.setView(coords, 17);
        } catch (err) {
          console.warn('Map setView not available', err);
        }

        if (onLocateMe) onLocateMe(coords);
      },
      (error) => {
        console.error('📍 GPS greška:', error);
        alert('Nije moguće dobiti lokaciju. Provjerite dozvole preglednika.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  // Address search state
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef();

  // current and selected location state
  const [currentCoords, setCurrentCoords] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routingEnabled, setRoutingEnabled] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [polylineAnalysis, setPolylineAnalysis] = useState(null);
  const routeCacheRef = useRef({ ts: 0, key: null });
  const watchIdRef = useRef(null);
  const lastReverseRef = useRef(null);
  const centeredRef = useRef(false);

  // Search function
  useEffect(() => {
    let ignore = false;
    
    if (!inputValue.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    
    setLoadingSuggestions(true);
    
    searchAddresses(inputValue).then(results => {
      if (!ignore) {
        setSuggestions(results || []);
        setLoadingSuggestions(false);
      }
    }).catch(error => {
      if (!ignore) {
        console.error('Address search error:', error);
        setSuggestions([]);
        setLoadingSuggestions(false);
      }
    });
    
    return () => { ignore = true; };
  }, [inputValue]);

  // Sync input with external address changes
  useEffect(() => {
    setInputValue(address ? (city ? `${address}, ${city}` : address) : '');
  }, [address, city]);

  // Keep local selectedLocation in sync
  useEffect(() => {
    if (selectedMarker && (typeof selectedMarker.lat === 'number' || typeof selectedMarker.lon === 'number')) {
      const sel = {
        address: selectedMarker.address || selectedMarker.data?.name || address || '',
        city: selectedMarker.city || '',
        lat: selectedMarker.lat,
        lon: selectedMarker.lon
      };
      setSelectedLocation(sel);
      
      if (selectedMarker.polyline) {
        try {
          const analysis = analyzePolyline(selectedMarker.polyline, 80);
          setPolylineAnalysis(analysis);
        } catch (err) {
          console.warn('Polyline analysis failed', err);
          setPolylineAnalysis(null);
        }
      } else {
        setPolylineAnalysis(null);
      }
      
      if (selectedMarker.hafasUrl || selectedMarker.hafasHtml) {
        const proxyBase = ENV.API_BASE_URL ? ENV.API_BASE_URL.replace(/\/$/, '') : 'http://localhost:4000';
        const proxyUrl = `${proxyBase}/hafas/parse`;
        (async () => {
          try {
            const body = selectedMarker.hafasHtml ? { html: selectedMarker.hafasHtml } : { url: selectedMarker.hafasUrl };
            const r = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (r.ok) {
              const json = await r.json();
              setRouteInfo({ 
                distanceMeters: json.distanceMeters || null, 
                durationSeconds: json.durationSeconds || null, 
                distanceText: json.distanceText || null, 
                durationText: json.durationText || null, 
                provider: 'HAFAS' 
              });
            }
          } catch (err) {
            console.warn('HAFAS proxy error', err);
          }
        })();
      }
    } else if (address) {
      setSelectedLocation(prev => ({
        address: address || '',
        city: city || '',
        lat: prev?.lat,
        lon: prev?.lon
      }));
    }
  }, [selectedMarker, address, city]);

  // Handle suggestion click
  const handleSuggestionClick = (location) => {
    const x = location.crd?.x;
    const y = location.crd?.y;
    
    if (typeof x === 'number' && typeof y === 'number' && mapRef?.current?.setView) {
      const lat = y / 1e6;
      const lon = x / 1e6;
      
      mapRef.current.setView([lat, lon], 17);
      
      let fullAddress = location.nameFormatted?.text || location.name || '';
      let addressPart = fullAddress;
      let cityPart = '';
      
      const brRegex = /<br\s*\/?.*?>/i;
      if (brRegex.test(fullAddress)) {
        const parts = fullAddress.split(brRegex);
        addressPart = parts[0].trim();
        cityPart = parts.slice(1).join(' ').trim();
      } else if (fullAddress.includes(',')) {
        const parts = fullAddress.split(',');
        addressPart = parts[0].trim();
        cityPart = parts.slice(1).join(',').trim();
      }
      
      setInputValue(addressPart + (cityPart ? `, ${cityPart}` : ''));
      
      const selected = { address: addressPart, city: cityPart, lat, lon };
      setSelectedLocation(selected);
      if (onSearchSelect) onSearchSelect(selected);
      
      setSuggestions([]);
      setIsInputFocused(false);
    }
  };

  // Handle navigation
  const handleNavigate = () => {
    if (!onNavigate) return;

    if (selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lon === 'number') {
      onNavigate({
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        address: selectedLocation.address,
        city: selectedLocation.city
      });
      return;
    }

    if (inputValue && inputValue.trim()) {
      onNavigate(inputValue.trim());
    }
  };

  // Handle input key events
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNavigate();
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setIsInputFocused(false);
      inputRef.current?.blur();
    }
  };

  // Distance calculations
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (lat1, lon1, lat2, lon2) => {
    const km = haversineKm(lat1, lon1, lat2, lon2);
    if (!isFinite(km) || isNaN(km)) return null;
    const meters = km * 1000;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(km).toFixed(1)} km`;
  };

  const estimateDurationFromDistance = (distanceMeters, avgSpeedKmh = 40) => {
    if (!distanceMeters || isNaN(distanceMeters)) return null;
    const hours = (distanceMeters / 1000) / avgSpeedKmh;
    return Math.round(hours * 3600);
  };

  // Footer expand state (tap-to-expand full address on mobile)
  const [expandedFooter, setExpandedFooter] = useState(null); // 'current' | 'selected' | null
  const toggleExpand = (which) => {
    if (!isMobile) return; // only enable tap-to-expand on mobile to avoid surprising desktop
    setExpandedFooter(prev => (prev === which ? null : which));
  };

  // Compute available height on mobile so the map can expand to fill the viewport
  const [mapHeight, setMapHeight] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recalc = () => {
      try {
        if (!isMobile) {
          setMapHeight(null);
          return;
        }
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        const fh = footerRef && footerRef.current ? (footerRef.current.getBoundingClientRect().height || 0) : 0;
        const hh = Number(headerHeight) || 0;
        // subtract header and footer; clamp to reasonable minimum
        let available = Math.max(0, Math.round(vh - hh - fh));
        if (available < 200) available = Math.max(200, Math.round(vh - hh));
        setMapHeight(available);
      } catch (err) {
        // ignore and leave default
      }
    };

    // initial
    recalc();

    // observe footer size changes, if footerRef provided
    let ro;
    if (footerRef && footerRef.current && typeof ResizeObserver !== 'undefined') {
      try {
        ro = new ResizeObserver(() => recalc());
        ro.observe(footerRef.current);
      } catch (err) {
        ro = null;
      }
    }

    window.addEventListener('resize', recalc);
    const onOrientation = () => setTimeout(recalc, 120);
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('orientationchange', onOrientation);
      if (ro && ro.disconnect) ro.disconnect();
    };
  }, [footerRef, headerHeight, isMobile]);

  const mapContentStyle = isMobile && mapHeight ? { height: `${mapHeight}px` } : undefined;

  // Close sidebar when tapping the map on mobile (if parent provided a callback)
  useEffect(() => {
    const handleMapClick = () => {
      if (isMobile && typeof onMapClickCloseSidebar === 'function') {
        try {
          onMapClickCloseSidebar();
        } catch (e) {
          // ignore parent callback errors
        }
      }
    };
    const mapContainer = document.querySelector('.mapContainerModern');
    if (mapContainer && typeof mapContainer.addEventListener === 'function') {
      mapContainer.addEventListener('click', handleMapClick);
    }
    return () => {
      if (mapContainer && typeof mapContainer.removeEventListener === 'function') {
        mapContainer.removeEventListener('click', handleMapClick);
      }
    };
  }, [isMobile, onMapClickCloseSidebar]);

  const projectTo3857 = (lat, lon) => {
    return { x: Math.round(lon * 1e6), y: Math.round(lat * 1e6) };
  };

  // Reverse-geocode function
  const reverseGeocode = async (lat, lon) => {
    try {
      const { x, y } = projectTo3857(lat, lon);
      const VAO_URL = '/vor-proxy';
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
              maxLoc: 1,
              locFltrL: [{ type: 'PROD', mode: 'INC', value: 4087 }],
              getPOIs: true
            },
            id: '1|5|'
          }
        ]
      };

      try {
        const geoRes = await fetch(VAO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geoBody)
        });
        const geoData = await geoRes.json();
        if (
          geoData &&
          geoData.svcResL &&
          geoData.svcResL.length > 0 &&
          geoData.svcResL[0].res &&
          geoData.svcResL[0].res.locL &&
          geoData.svcResL[0].res.locL.length > 0
        ) {
          const loc = geoData.svcResL[0].res.locL[0];
          let adresa = (loc.nameFormatted && loc.nameFormatted.text) || loc.name || loc.txt || '';
          if (/^-?\d+\.\d+, ?-?\d+\.\d+$/.test(adresa)) adresa = '';
          if (!adresa) return { address: '', city: '' };
          let line1 = adresa;
          let line2 = '';
          if (adresa.includes(',')) {
            const parts = adresa.split(',');
            line1 = parts[0].trim();
            line2 = parts.slice(1).join(',').trim();
          }
          return { address: line1, city: line2 };
        }
      } catch (err) {
        console.warn('reverseGeocode LocGeoPos error', err);
      }

      // 2) Fallback to LocMatch (if LocGeoPos didn't return address)
      const matchBody = {
        ...VAO_BODY_BASE,
        svcReqL: [
          {
            meth: 'LocMatch',
            req: {
              input: {
                field: 'S',
                loc: { type: 'C', crd: { x, y } },
                maxLoc: 1,
                locFltrL: [{ type: 'META', value: 'in_austria_test' }]
              }
            },
            id: '1|24|'
          }
        ]
      };

      try {
        const matchRes = await fetch(VAO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchBody)
        });
        const matchData = await matchRes.json();
        if (
          matchData &&
          matchData.svcResL &&
          matchData.svcResL.length > 0 &&
          matchData.svcResL[0].res &&
          matchData.svcResL[0].res.match &&
          matchData.svcResL[0].res.match.locL &&
          matchData.svcResL[0].res.match.locL.length > 0
        ) {
          // Prefer finalized addresses and type A (address) when multiple
          const locs = matchData.svcResL[0].res.match.locL.slice();
          // Filter for state === 'F' (final)
          const finals = locs.filter(l => l.state === 'F');
          let chosen = null;
          if (finals.length > 0) {
            // Prefer type 'A', otherwise first final
            chosen = finals.find(l => l.type === 'A') || finals[0];
          } else {
            // no finals, pick address type A first
            chosen = locs.find(l => l.type === 'A') || locs[0];
          }
          if (!chosen) return { address: '', city: '' };
          let adresa = (chosen.nameFormatted && chosen.nameFormatted.text) || chosen.name || chosen.txt || '';
          if (/^-?\d+\.\d+, ?-?\d+\.\d+$/.test(adresa)) adresa = '';
          if (!adresa) return { address: '', city: '' };
          let line1 = adresa;
          let line2 = '';
          if (adresa.includes(',')) {
            const parts = adresa.split(',');
            line1 = parts[0].trim();
            line2 = parts.slice(1).join(',').trim();
          }
          return { address: line1, city: line2 };
        }
      } catch (err) {
        console.warn('reverseGeocode LocMatch error', err);
      }

      return { address: '', city: '' };
    } catch (err) {
      console.error('Reverse geocode error', err);
      return { address: '', city: '' };
    }
  };

  // Cleanup and effects
  useEffect(() => {
    return () => {
      if (watchIdRef.current && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoLocate) handleLocateMe();
  }, [autoLocate]);

  useEffect(() => {
    if (currentCoords && mapRef?.current?.setView && !centeredRef.current) {
      try {
        mapRef.current.setView([currentCoords.lat, currentCoords.lon], 17);
        centeredRef.current = true;
      } catch (err) {}
    }
  }, [currentCoords, mapRef]);

  useEffect(() => {
    let cancelled = false;
    if (!currentCoords) return;

    const key = `${currentCoords.lat.toFixed(6)},${currentCoords.lon.toFixed(6)}`;
    if (lastReverseRef.current === key) return;
    lastReverseRef.current = key;

    setReverseGeocodingLoading(true);

    (async () => {
      try {
        const addr = await reverseGeocode(currentCoords.lat, currentCoords.lon);
        if (!cancelled && addr && (addr.address || addr.city)) {
          const full = addr.address ? (addr.city ? `${addr.address}, ${addr.city}` : addr.address) : (addr.city || '');
          setCurrentAddress(full);
        } else if (!cancelled) {
          setCurrentAddress(`Lokacija: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)}`);
        }
      } catch (err) {
        if (!cancelled) {
          setCurrentAddress(`Lokacija: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)}`);
        }
      } finally {
        if (!cancelled) setReverseGeocodingLoading(false);
      }
    })();

    return () => { cancelled = true; setReverseGeocodingLoading(false); };
  }, [currentCoords]);

  useEffect(() => {
    let cancelled = false;
    if (!routingEnabled) {
      setRouteInfo(null);
      return;
    }

    if (currentCoords && selectedLocation &&
        typeof currentCoords.lat === 'number' && typeof currentCoords.lon === 'number' &&
        typeof selectedLocation.lat === 'number' && typeof selectedLocation.lon === 'number') {
      
      const key = `${currentCoords.lat},${currentCoords.lon}->${selectedLocation.lat},${selectedLocation.lon}`;
      const now = Date.now();
      if (routeCacheRef.current.key === key && (now - routeCacheRef.current.ts) < 30000 && routeInfo) {
        return;
      }
      
      setRouteLoading(true);

      (async () => {
        try {
          // Use MapQuest for routing first (more accurate for driving distances)
          const originLat = currentCoords.lat;
          const originLon = currentCoords.lon;
          const destLat = selectedLocation.lat;
          const destLon = selectedLocation.lon;
          
          let routeResult = null;
          try {
            routeResult = await getRouteFromMapQuest(originLat, originLon, destLat, destLon);
            if (routeResult) {
              setRouteInfo({
                distanceMeters: routeResult.distanceMeters,
                distanceText: routeResult.distanceText,
                durationSeconds: routeResult.durationSeconds,
                durationText: routeResult.durationText,
                provider: 'MapQuest'
              });
              routeCacheRef.current = { ts: Date.now(), key };
              return; // route set, skip fallback
            }
          } catch (err) {
            console.warn('MapQuest routing failed, falling back to Google:', err.message || err);
          }
          
          // Fallback to existing Google routing helper if MapQuest fails
          try {
            const googleRes = await getDrivingRouteInfo({ lat: originLat, lon: originLon }, { lat: destLat, lon: destLon });
            if (googleRes) {
              setRouteInfo({
                distanceMeters: googleRes.distanceMeters,
                distanceText: googleRes.distanceText || gmFormatDistance(googleRes.distanceMeters),
                durationSeconds: googleRes.durationSeconds,
                durationText: googleRes.durationText || gmFormatDuration(googleRes.durationSeconds),
                provider: googleRes.provider || 'Google'
              });
              routeCacheRef.current = { ts: Date.now(), key };
            } else {
              setRouteInfo(null);
            }
          } catch (err) {
            console.warn('Google routing failed as fallback:', err);
            setRouteInfo(null);
          }
         } catch (err) {
           if (!cancelled) setRouteInfo(null);
         } finally {
           if (!cancelled) setRouteLoading(false);
         }
       })();
    } else {
      setRouteInfo(null);
    }

    return () => { cancelled = true; setRouteLoading(false); };
  }, [currentCoords, selectedLocation]);

  return (
    <div className={`${styles.mapCardModern} ${className}`} style={style}>
      {/* Integrated Address Search Bar */}
      <div className={styles.addressBarIntegrated}>
        {/* Search input sa ikonom */}
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.searchIcon}>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
              onKeyDown={handleInputKeyDown}
              placeholder="Unesi adresu (npr: hauprstrasse 60 9340)..."
              autoComplete="off"
            />
          </div>
          
          {/* Navigiraj dugme sa SVG ikonom */}
          <button
            className={styles.navigateBtn}
            onClick={handleNavigate}
            disabled={!inputValue.trim()}
            title="Otvori navigaciju"
            aria-label="Navigiraj"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </button>

          {/* Suggestions Dropdown */}
          {isInputFocused && inputValue && (
            <div className={styles.suggestionsDropdown}>
              {loadingSuggestions ? (
                <div className={styles.suggestionItem}>
                  <div className={styles.loadingSpinnerSmall}></div>
                  Tražim adrese...
                </div>
              ) : suggestions.length === 0 ? (
                <div className={styles.suggestionItem}>
                  Nema rezultata za "{inputValue}"
                </div>
              ) : (
                suggestions.map((location, index) => (
                  <div
                    key={index}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(location)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className={styles.suggestionAddress}>
                      {location.nameFormatted?.text?.replace(/<[^>]*>/g, '') || location.name || ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className={styles.mapContent} style={mapContentStyle}>
        {loading ? (
          <div className={styles.mapLoading}>
            <div className={styles.loadingSpinner}></div>
            <p>Učitavam mapu...</p>
          </div>
        ) : (
          <>
            {children}
            
            {/* Floating Map Controls - Desna strana */}
            <div className={styles.mapControlsFloating}>
              {/* ZUM IN - SVG ikona */}
              <button className={styles.floatingControlBtn} onClick={handleZoomIn} title="Povećaj zoom">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                </svg>
                <span className="sr-only">Povećaj zoom</span>
              </button>

              {/* ZUM OUT - SVG ikona */}
              <button className={styles.floatingControlBtn} onClick={handleZoomOut} title="Smanji zoom">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11H5v2h14z"/>
                </svg>
                <span className="sr-only">Smanji zoom</span>
              </button>

              {/* LOCIRAJ ME - SVG ikona */}
              <button className={styles.floatingControlBtn} onClick={handleLocateMe} title="Lociraj na adresu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                </svg>
                <span className="sr-only">Lociraj na adresu</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
  <div ref={footerRef} className={`${styles.mapFooter} mapFooter`}>
        <div className={styles.addressInfo}>
          {/* TRENUTNA LOKACIJA */}
          {reverseGeocodingLoading ? (
            <div className={`${styles.currentAddress} ${styles.addressExpandable}`} onClick={() => toggleExpand('current')}>
              <svg className={styles.modernLocationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div className={styles.loadingSpinnerSmall} style={{ display: 'inline-block', marginRight: '8px' }}></div>
              Prepoznajem adresu...
            </div>
          ) : currentAddress ? (
            <div
              className={`${styles.currentAddress} ${styles.addressExpandable} ${expandedFooter === 'current' ? styles.expanded : ''}`}
              onClick={() => toggleExpand('current')}
              title={currentAddress}
            >
              <svg className={styles.modernLocationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {expandedFooter === 'current' ? (
                currentAddress
              ) : (
                isMobile ? compactFromFull(currentAddress) : currentAddress
              )}
            </div>
          ) : currentCoords ? (
            <div className={`${styles.currentAddress} ${styles.addressExpandable}`} onClick={() => toggleExpand('current')}>
              <svg className={styles.modernLocationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {currentCoords.lat.toFixed(6)}, {currentCoords.lon.toFixed(6)}
            </div>
          ) : (
            <div className={`${styles.currentAddress} ${styles.addressExpandable}`} onClick={() => toggleExpand('current')}>
              <svg className={styles.modernLocationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Lokacija nije dostupna
            </div>
          )}

          {/* ODABRANA ADRESA */}
          {selectedLocation ? (
            <div
              className={`${styles.selectedAddress} ${styles.addressExpandable} ${expandedFooter === 'selected' ? styles.expanded : ''}`}
              title={`${selectedLocation.address}${selectedLocation.city ? `, ${selectedLocation.city}` : ''}`}
              onClick={() => toggleExpand('selected')}
            >
              <svg className={styles.modernTargetIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
              {isMobile ? (
                expandedFooter === 'selected' ? `${selectedLocation.address}${selectedLocation.city ? `, ${selectedLocation.city}` : ''}` : formatCompactAddress(selectedLocation.address, selectedLocation.city)
              ) : (
                `${selectedLocation.address}${selectedLocation.city ? `, ${selectedLocation.city}` : ''}`
              )}
            </div>
          ) : inputValue ? (
            <div
              className={`${styles.selectedAddress} ${styles.addressExpandable} ${expandedFooter === 'selected' ? styles.expanded : ''}`}
              title={inputValue}
              onClick={() => toggleExpand('selected')}
            >
              <span style={{ marginRight: '8px' }}>🔍</span>
              {isMobile ? (expandedFooter === 'selected' ? inputValue : formatCompactAddress(inputValue, '')) : inputValue}
            </div>
          ) : null}
        </div>

        <div className={styles.distanceInfo}>
          <div className={styles.distanceInfoInner}>
            {polylineAnalysis ? (
              <div className={styles.distanceText}>
                <span>{polylineAnalysis.compact}</span>
                <small className={styles.distanceSmall}>Polyline</small>
              </div>
            ) : routeInfo ? (
              <div className={styles.distanceText}>
                <span className={styles.routeSummary}>
                  {routeInfo.durationText || gmFormatDuration(routeInfo.durationSeconds) || '--'}
                  {` • `}
                  {routeInfo.distanceText || gmFormatDistance(routeInfo.distanceMeters) || '--'}
                </span>
                {routeLoading && (
                  <span className={styles.spinnerWrapper}>
                    <div className={styles.loadingSpinnerSmall} aria-hidden="true"></div>
                  </span>
                )}
                {routeInfo.provider && routeInfo.provider.toLowerCase() !== 'mapquest' && (
                  <small className={styles.distanceSmall}>{routeInfo.provider}</small>
                )}
              </div>
            ) : currentCoords && selectedLocation ? (
              <div className={styles.distanceText}>
                <span className={styles.routeSummary}>
                  {(() => {
                    const aerialKm = haversineKm(currentCoords.lat, currentCoords.lon, selectedLocation.lat, selectedLocation.lon);
                    const aerialMeters = Math.round(aerialKm * 1000);
                    const estSec = estimateDurationFromDistance(aerialMeters, 40);
                    return estSec ? (
                      `${gmFormatDuration(estSec)} • ${gmFormatDistance(aerialMeters)}`
                    ) : '--';
                  })()}
                </span>
              </div>
            ) : (
              <div className={styles.distanceText}><span className={styles.routeSummary}>--</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapCardModern;